/**
 * WebAudX Safe Webpage Inspection Engine
 * Conforms to:
 * - WebAudX PRD v1.0 Section 5 (Automated Check & 13 Measurements)
 * - .agent/Rules/security-and-privacy.md (SSRF Defense, Limits, Timeouts)
 * - Question 4: Registrable domain internal linking
 * - Question 5: 10s timeout per network request
 */

const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns').promises;
const { URL } = require('node:url');
const zlib = require('node:zlib');
const { isProhibitedDestination, getRegistrableDomain, isInternalLink, validateAddress } = require('./validate-address.js');
const copyLibrary = require('../docs/copy-library.json');

// Inspection Constraints
const MAX_REDIRECTS = 3;
const MAX_PAGE_BYTES = 2 * 1024 * 1024; // 2 MB limit (PRD Section 11)
const REQUEST_TIMEOUT_MS = 10 * 1000; // 10s per request (Question 5 confirmed)
const MAX_SAMPLED_INTERNAL_LINKS = 30; // Max 30 internal links (PRD Section 5.1 & 11)
const READABLE_TEXT_THRESHOLD = 200; // 200 words (PRD Section 5.4)
const USER_AGENT = 'WebAudX/1.0 (+https://github.com/mr-wizzy/WebAudX; usability-check@webaudx.org)';

// PRD Section 5.2 Item 10 Action Terms
const ACTION_TERMS = [
  'contact', 'book', 'buy', 'get started', 'call',
  'request', 'sign up', 'subscribe', 'download', 'shop'
];

/**
 * Perform a safe HTTP/HTTPS GET request that re-validates DNS to prevent SSRF and rebinding.
 * Follows up to 3 redirects, with 10s timeout and 2MB limit.
 *
 * @param {string} targetUrl
 * @param {number} redirectCount
 * @returns {Promise<{
 *   statusCode: number,
 *   finalUrl: string,
 *   headers: object,
 *   body: string,
 *   redirectCount: number
 * }>}
 */
async function safeFetch(targetUrl, redirectCount = 0) {
  if (redirectCount > MAX_REDIRECTS) {
    const err = new Error(copyLibrary.inspection.redirect_loop);
    err.code = 'ERR_TOO_MANY_REDIRECTS';
    throw err;
  }

  const parsed = new URL(targetUrl);

  // Validate protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    const err = new Error(copyLibrary.address.unsupported_scheme);
    err.code = 'ERR_UNSUPPORTED_SCHEME';
    throw err;
  }

  // Pre-connection DNS validation to block private/local destinations (SSRF defense)
  if (isProhibitedDestination(parsed.hostname)) {
    const err = new Error(copyLibrary.address.prohibited_destination);
    err.code = 'ERR_PROHIBITED_DESTINATION';
    throw err;
  }

  try {
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    for (const record of addresses) {
      if (isProhibitedDestination(record.address)) {
        const err = new Error(copyLibrary.address.prohibited_destination);
        err.code = 'ERR_PROHIBITED_DESTINATION';
        throw err;
      }
    }
  } catch (dnsErr) {
    if (dnsErr.code === 'ERR_PROHIBITED_DESTINATION') throw dnsErr;
    const err = new Error(copyLibrary.inspection.address_not_found);
    err.code = 'ERR_ADDRESS_NOT_FOUND';
    throw err;
  }

  return new Promise((resolve, reject) => {
    const client = parsed.protocol === 'https:' ? https : http;
    let settled = false;

    const req = client.get(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: REQUEST_TIMEOUT_MS
    }, (res) => {
      // Check for redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        req.destroy();
        const nextUrl = new URL(res.headers.location, targetUrl).href;
        return resolve(safeFetch(nextUrl, redirectCount + 1));
      }

      // Check content type: only inspect HTML pages (PRD Section 13: "File, not a page")
      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
        req.destroy();
        const err = new Error(copyLibrary.inspection.file_not_page);
        err.code = 'ERR_FILE_NOT_PAGE';
        return reject(err);
      }

      let stream = res;
      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      const chunks = [];
      let totalBytes = 0;

      stream.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_PAGE_BYTES) {
          req.destroy();
          const err = new Error(copyLibrary.inspection.too_large);
          err.code = 'ERR_PAGE_TOO_LARGE';
          if (!settled) {
            settled = true;
            reject(err);
          }
        } else {
          chunks.push(chunk);
        }
      });

      stream.on('end', () => {
        if (settled) return;
        settled = true;
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({
          statusCode: res.statusCode,
          finalUrl: targetUrl,
          headers: res.headers,
          body: body,
          redirectCount: redirectCount
        });
      });

      stream.on('error', (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error(copyLibrary.inspection.too_slow);
      err.code = 'ERR_TIMEOUT';
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        const customErr = new Error(copyLibrary.inspection.address_not_found);
        customErr.code = err.code;
        return reject(customErr);
      }
      reject(err);
    });
  });
}

/**
 * Sample a link to verify if it is broken or accessible (10s timeout, SSRF protected).
 *
 * @param {string} url
 * @returns {Promise<boolean>} true if link works (2xx/3xx), false if broken (4xx/5xx/timeout/error)
 */
async function checkLinkLive(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (isProhibitedDestination(parsed.hostname)) return false;

    return new Promise((resolve) => {
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(url, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        timeout: REQUEST_TIMEOUT_MS
      }, (res) => {
        // Any 2xx or 3xx status is good; 4xx or 5xx is broken
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.end();
    });
  } catch {
    return false;
  }
}

/**
 * Extract clean visible readable text from HTML (strip script, style, tags, comments).
 *
 * @param {string} html
 * @returns {{ text: string, wordCount: number }}
 */
function extractReadableText(html) {
  if (!html) return { text: '', wordCount: 0 };

  // Strip non-content blocks
  let clean = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');

  // Strip all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  clean = clean
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Count words containing alphanumeric characters
  const words = clean.length > 0 ? clean.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)) : [];
  return {
    text: clean,
    wordCount: words.length
  };
}

/**
 * Evaluate HTML against the 13 PRD measured items.
 *
 * @param {object} fetchResult - Result from safeFetch
 * @param {boolean} sampleLinks - Whether to sample internal links
 * @returns {Promise<object>} Complete inspection result with 13 items and suggestions
 */
async function analyzePage(fetchResult, sampleLinks = true) {
  const { statusCode, finalUrl, body } = fetchResult;
  const parsedFinalUrl = new URL(finalUrl);

  // 1. Readable text & word count (Item 7)
  const { text: visibleText, wordCount } = extractReadableText(body);
  const isLimited = wordCount < READABLE_TEXT_THRESHOLD;

  // 2. Secure connection (Item 1)
  const isSecure = parsedFinalUrl.protocol === 'https:';
  const itemSecure = {
    id: 1,
    name: 'Secure connection',
    status: isSecure ? 'Good' : 'Needs attention',
    evidence: isSecure ? 'The address uses a secure (https) connection.' : 'The address uses an unencrypted (http) connection.',
    explanation: isSecure
      ? 'The page uses a secure connection.'
      : 'The page does not use a secure connection.'
  };

  // 3. Page loads (Item 2)
  const isOkStatus = statusCode === 200;
  const itemLoads = {
    id: 2,
    name: 'Page loads',
    status: isOkStatus ? 'Good' : 'Needs attention',
    evidence: isOkStatus ? 'Page responded normally.' : `Server returned response ${statusCode}`,
    explanation: isOkStatus
      ? 'The page loaded normally.'
      : `The page could not be loaded (error code ${statusCode}). Open the address in your browser to check it.`
  };

  // 4. Page title (Item 3)
  const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleText = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
  const itemTitle = {
    id: 3,
    name: 'Page title',
    status: isLimited ? 'Could not check' : (titleText.length > 0 ? 'Good' : 'Needs attention'),
    evidence: titleText || 'No page title found',
    explanation: isLimited
      ? 'Could not check because the page has very little readable text.'
      : (titleText.length > 0 ? `The page has a clear title: "${titleText}".` : 'The page does not have a title.')
  };

  // 5. Search summary (Item 4)
  const descMatch = body.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || body.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const descriptionText = descMatch ? descMatch[1].trim() : '';
  const itemDescription = {
    id: 4,
    name: 'Search summary',
    status: isLimited ? 'Could not check' : (descriptionText.length >= 20 ? 'Good' : 'Needs attention'),
    evidence: descriptionText || 'No search summary found',
    explanation: isLimited
      ? 'Could not check because the page has very little readable text.'
      : (descriptionText.length >= 20 ? 'The page includes a clear search summary.' : 'The page does not have a search summary.')
  };

  // 6. Main heading (Item 5)
  const h1Matches = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Count = h1Matches.length;
  const firstH1Text = h1Count > 0 ? h1Matches[0][1].replace(/<[^>]+>/g, '').trim() : '';
  const itemMainHeading = {
    id: 5,
    name: 'Main heading',
    status: isLimited ? 'Could not check' : (h1Count === 1 ? 'Good' : 'Needs attention'),
    evidence: h1Count === 1 ? `One main heading: "${firstH1Text}"` : `${h1Count} main headings found`,
    explanation: isLimited
      ? 'Could not check because the page has very little readable text.'
      : (h1Count === 1 ? 'The page has one clear main heading.' : (h1Count === 0 ? 'The page does not have a clear main heading.' : 'The page has multiple main headings.'))
  };

  // 7. Heading structure (Item 6)
  const headingTags = [...body.matchAll(/<(h[1-6])[^>]*>/gi)].map(m => m[1].toLowerCase());
  let headingStructureGood = headingTags.length > 0 && headingTags[0] === 'h1';
  for (let i = 0; i < headingTags.length - 1; i++) {
    const currLevel = parseInt(headingTags[i][1], 10);
    const nextLevel = parseInt(headingTags[i + 1][1], 10);
    if (nextLevel > currLevel + 1) {
      headingStructureGood = false;
      break;
    }
  }
  const itemHeadingStructure = {
    id: 6,
    name: 'Heading structure',
    status: isLimited ? 'Could not check' : (headingStructureGood ? 'Good' : 'Needs attention'),
    evidence: headingTags.join(' → ') || 'No headings found',
    explanation: isLimited
      ? 'Could not check because the page has very little readable text.'
      : (headingStructureGood ? 'Headings follow a clear and organized order.' : 'Headings do not follow a clear hierarchy.')
  };

  // 8. Readable text (Item 7)
  const itemReadableText = {
    id: 7,
    name: 'Readable text',
    status: isLimited ? 'Needs attention' : 'Good',
    evidence: `${wordCount} words detected`,
    explanation: isLimited
      ? `The page has very little readable text (${wordCount} words).`
      : `The page has plenty of readable text (${wordCount} words).`
  };

  // 9. Navigation menu (Item 8)
  const hasNavTag = /<nav\b[^>]*>/i.test(body) || /role=["']navigation["']/i.test(body);
  const itemNavMenu = {
    id: 8,
    name: 'Navigation menu',
    status: hasNavTag ? 'Good' : 'Needs attention',
    evidence: hasNavTag ? 'Navigation landmark found' : 'No nav element or navigation role found',
    explanation: hasNavTag
      ? 'A clear navigation menu was found on the page.'
      : 'No clear navigation menu was found on the page.'
  };

  // 10. Internal links & Sampled Broken Links (Item 9)
  // Extracts links and applies confirmed registrable domain (eTLD+1) rule
  const linkMatches = [...body.matchAll(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi)];
  const internalUrls = [];
  const seenUrls = new Set();

  for (const m of linkMatches) {
    const rawHref = m[1].trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      continue;
    }
    try {
      const resolved = new URL(rawHref, finalUrl).href;
      if (isInternalLink(resolved, finalUrl) && !seenUrls.has(resolved)) {
        seenUrls.add(resolved);
        internalUrls.push(resolved);
      }
    } catch {
      // ignore invalid URLs
    }
  }

  // Sample up to 30 internal links
  const sampledLinks = internalUrls.slice(0, MAX_SAMPLED_INTERNAL_LINKS);
  let brokenLinksCount = 0;

  if (sampleLinks && sampledLinks.length > 0) {
    const results = await Promise.all(sampledLinks.map(checkLinkLive));
    brokenLinksCount = results.filter(alive => !alive).length;
  }

  const itemInternalLinks = {
    id: 9,
    name: 'Internal links',
    status: (internalUrls.length > 0 && brokenLinksCount === 0) ? 'Good' : 'Needs attention',
    evidence: `${internalUrls.length} internal links found; ${sampledLinks.length} sampled; ${brokenLinksCount} broken`,
    explanation: internalUrls.length === 0
      ? 'No internal links were found on the page.'
      : (brokenLinksCount === 0
        ? `Checked ${sampledLinks.length} internal links and none were broken.`
        : `${brokenLinksCount} of ${sampledLinks.length} sampled links could not be loaded.`)
  };

  // 11. Action links and buttons (Item 10)
  let actionTermsCount = 0;
  for (const term of ACTION_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = body.match(regex);
    if (matches) actionTermsCount += matches.length;
  }
  const itemActionButtons = {
    id: 10,
    name: 'Action links and buttons',
    status: isLimited ? 'Could not check' : (actionTermsCount > 0 ? 'Good' : 'Needs attention'),
    evidence: `${actionTermsCount} action phrasing occurrences found`,
    explanation: isLimited
      ? 'Could not check because the page has very little readable text.'
      : (actionTermsCount > 0 ? `Found ${actionTermsCount} action links or buttons.` : 'No clear action buttons or links were found.')
  };

  // 12. Ways to contact (Item 11)
  const hasTel = /href=["']tel:[^"']*["']/i.test(body);
  const hasMailto = /href=["']mailto:[^"']*["']/i.test(body);
  const hasContactForm = /<form\b[^>]*>/i.test(body);
  const hasContact = hasTel || hasMailto || hasContactForm;
  const itemContact = {
    id: 11,
    name: 'Ways to contact',
    status: hasContact ? 'Good' : 'Needs attention',
    evidence: [hasTel && 'phone link', hasMailto && 'email link', hasContactForm && 'form'].filter(Boolean).join(', ') || 'None found',
    explanation: hasContact
      ? 'Found direct contact details on the page.'
      : 'No phone link, email link, or contact form was found.'
  };

  // 13. Mobile display setting (Item 12)
  const hasViewport = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.test(body);
  const itemMobileSetting = {
    id: 12,
    name: 'Mobile display setting',
    status: hasViewport ? 'Good' : 'Needs attention',
    evidence: hasViewport ? 'Mobile screen setting detected' : 'No mobile screen setting found',
    explanation: hasViewport
      ? 'The page sets how mobile screens should display it.'
      : 'The page does not set how phones display it.'
  };

  // 14. Image descriptions (Item 13)
  const imgMatches = [...body.matchAll(/<img\s+[^>]*>/gi)];
  const totalImages = imgMatches.length;
  let describedImages = 0;
  for (const m of imgMatches) {
    const tag = m[0];
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (altMatch && altMatch[1].trim().length > 0) {
      describedImages++;
    }
  }
  const imageRatio = totalImages > 0 ? (describedImages / totalImages) : 1;
  const imagesGood = imageRatio >= 0.8;
  const itemImageDescriptions = {
    id: 13,
    name: 'Image descriptions',
    status: imagesGood ? 'Good' : 'Needs attention',
    evidence: totalImages === 0 ? 'No images on page' : `${describedImages} of ${totalImages} images have descriptions`,
    explanation: totalImages === 0
      ? 'The page has no images requiring descriptions.'
      : (imagesGood ? 'All or most images have text descriptions.' : `${totalImages - describedImages} of ${totalImages} images are missing text descriptions.`)
  };

  const measurements = [
    itemSecure,
    itemLoads,
    itemTitle,
    itemDescription,
    itemMainHeading,
    itemHeadingStructure,
    itemReadableText,
    itemNavMenu,
    itemInternalLinks,
    itemActionButtons,
    itemContact,
    itemMobileSetting,
    itemImageDescriptions
  ];

  // Outcome determination (PRD Section 5.4 & 5.5)
  const overallStatus = isLimited ? 'Limited' : 'Complete';

  // Compute Suggested Answers for Questionnaire (PRD Section 5.3)
  // Suggestions are only generated when status is Complete
  const suggestions = {};

  if (!isLimited) {
    // Question 3: Navigation
    // Yes: Menu exists (8) and no sampled links are broken (9)
    // Partly: Menu exists but some broken, OR no menu but other links exist
    // No: No menu and no internal links
    const menuExists = hasNavTag;
    const internalExists = internalUrls.length > 0;
    const hasBroken = brokenLinksCount > 0;

    if (menuExists && !hasBroken && internalExists) {
      suggestions[3] = 'Yes';
    } else if ((menuExists && hasBroken) || (!menuExists && internalExists)) {
      suggestions[3] = 'Partly';
    } else if (!menuExists && !internalExists) {
      suggestions[3] = 'No';
    }

    // Question 5: Call to action
    // Yes: Action links or buttons (10) and a way to contact (11)
    // Partly: Action links without way to contact, or way to contact without action links
    // No: No action links and no way to contact
    const hasActions = actionTermsCount > 0;
    if (hasActions && hasContact) {
      suggestions[5] = 'Yes';
    } else if (hasActions || hasContact) {
      suggestions[5] = 'Partly';
    } else {
      suggestions[5] = 'No';
    }

    // Question 7: Mobile experience
    // Yes: Mobile display setting exists (12)
    // Partly: Not suggested (PRD Section 5.3 explicitly says "Not suggested")
    // No: Mobile display setting missing (12)
    suggestions[7] = hasViewport ? 'Yes' : 'No';
  }

  return {
    url: finalUrl,
    checkedAt: new Date().toISOString(),
    overallStatus: overallStatus,
    wordCount: wordCount,
    isLimited: isLimited,
    measurements: measurements,
    suggestions: suggestions
  };
}

/**
 * High-level inspection pipeline: validates, fetches, and inspects page.
 *
 * @param {string} inputUrl
 * @param {boolean} sampleLinks
 * @returns {Promise<object>}
 */
async function inspectWebpage(inputUrl, sampleLinks = true) {
  // Step 1: Validate address format and SSRF
  const val = validateAddress(inputUrl);
  if (!val.valid) {
    return {
      success: false,
      error: val.error,
      overallStatus: 'Not completed'
    };
  }

  try {
    // Step 2: Safe fetch with redirect limit, size limit, and timeout
    const fetchResult = await safeFetch(val.url);

    // Step 3: Analyze 13 measurements
    const inspection = await analyzePage(fetchResult, sampleLinks);

    return {
      success: true,
      ...inspection
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || copyLibrary.inspection.unexpected_error,
      code: err.code,
      overallStatus: 'Not completed'
    };
  }
}

module.exports = {
  safeFetch,
  checkLinkLive,
  extractReadableText,
  analyzePage,
  inspectWebpage,
  MAX_REDIRECTS,
  MAX_PAGE_BYTES,
  REQUEST_TIMEOUT_MS,
  MAX_SAMPLED_INTERNAL_LINKS,
  READABLE_TEXT_THRESHOLD
};
