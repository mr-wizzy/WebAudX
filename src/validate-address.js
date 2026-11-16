/**
 * WebAudX Safe Address Parsing & Validation Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 4 & 13
 * - .agent/Rules/security-and-privacy.md (SSRF & Destination Defense)
 * - Approved copy from docs/copy-library.json
 * - Question 4: Registrable domain internal linking
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WebAudXAddress = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // Approved Plain-English Error Messages from docs/copy-library.json
  const MESSAGES = {
    EMPTY: "Please enter the address of the page you want to review.",
    WRONG_FORMAT: "This doesn't look like a web address. Check for typing mistakes, such as yourwebsite.com.",
    UNSUPPORTED_SCHEME: "WebAudX can only review web pages that start with http:// or https://.",
    PROHIBITED_DESTINATION: "This address cannot be reviewed."
  };

  /**
   * Check if a hostname resolves to a prohibited local, private, or internal destination.
   * Enforces .agent/Rules/security-and-privacy.md Section 3.
   *
   * @param {string} hostname
   * @returns {boolean}
   */
  function isProhibitedDestination(hostname) {
    if (!hostname) return true;
    const h = hostname.toLowerCase().trim();

    // Loopback & local hostnames
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan')) {
      return true;
    }

    // Cloud metadata hostnames
    if (h === 'metadata.google.internal' || h === 'instance-data') {
      return true;
    }

    // IPv6 Loopback / Unspecified / Link-Local
    if (h === '::1' || h === '[::1]' || h === '::' || h === '[::]' || h.startsWith('fe80:') || h.startsWith('[fe80:')) {
      return true;
    }

    // Check for IPv4 dotted-decimal representations
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = h.match(ipv4Regex);
    if (match) {
      const [_, o1, o2, o3, o4] = match.map(Number);
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) {
        return true; // invalid IP
      }

      // Loopback: 127.0.0.0/8
      if (o1 === 127) return true;

      // Current network / Broadcast: 0.0.0.0/8 or 255.255.255.255
      if (o1 === 0 || (o1 === 255 && o2 === 255 && o3 === 255 && o4 === 255)) return true;

      // Private-use: 10.0.0.0/8
      if (o1 === 10) return true;

      // Private-use: 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

      // Private-use: 192.168.0.0/16
      if (o1 === 192 && o2 === 168) return true;

      // Link-local / Cloud Metadata: 169.254.0.0/16 (e.g. AWS/GCP 169.254.169.254)
      if (o1 === 169 && o2 === 254) return true;

      // Shared address space (Carrier-grade NAT): 100.64.0.0/10
      if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

      // Multicast / Reserved: 224.0.0.0/4 and 240.0.0.0/4
      if (o1 >= 224) return true;
    }

    return false;
  }

  /**
   * Extract the Registrable Domain (eTLD+1) from a hostname.
   * Satisfies Question 4 confirmation: "registrable domain internal linking".
   *
   * @param {string} hostname
   * @returns {string}
   */
  function getRegistrableDomain(hostname) {
    if (!hostname) return '';
    const cleanHost = hostname.toLowerCase().trim().replace(/^www\./, '');

    // Common multi-part TLDs (e.g. .co.uk, .com.au, .org.uk)
    const multiPartTlds = [
      'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'net.uk',
      'com.au', 'net.au', 'org.au', 'edu.au',
      'co.nz', 'org.nz', 'co.za', 'co.jp', 'com.br', 'com.ng'
    ];

    const parts = cleanHost.split('.');
    if (parts.length <= 1) return cleanHost;

    const lastTwo = parts.slice(-2).join('.');
    if (multiPartTlds.includes(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }

    return parts.slice(-2).join('.');
  }

  /**
   * Determine if a target URL is an internal link relative to the base URL
   * using the confirmed registrable domain rule (eTLD+1).
   *
   * @param {string} targetUrl
   * @param {string} baseUrl
   * @returns {boolean}
   */
  function isInternalLink(targetUrl, baseUrl) {
    try {
      const baseParsed = new URL(baseUrl);
      const targetParsed = new URL(targetUrl, baseUrl);

      // Only HTTP/HTTPS destinations qualify
      if (targetParsed.protocol !== 'http:' && targetParsed.protocol !== 'https:') {
        return false;
      }

      // Check registrable domain
      const baseDomain = getRegistrableDomain(baseParsed.hostname);
      const targetDomain = getRegistrableDomain(targetParsed.hostname);

      return baseDomain !== '' && baseDomain === targetDomain;
    } catch {
      return false;
    }
  }

  /**
   * Validate a submitted webpage address.
   *
   * @param {string} input - Raw user input
   * @returns {{
   *   valid: boolean,
   *   error?: string,
   *   url?: string,
   *   normalizedUrl?: string,
   *   registrableDomain?: string,
   *   addedPrefix?: boolean
   * }}
   */
  function validateAddress(input) {
    // 1. Empty Check (Acceptance Test 14)
    if (typeof input !== 'string' || input.trim().length === 0) {
      return { valid: false, error: MESSAGES.EMPTY };
    }

    const trimmed = input.trim();
    let candidate = trimmed;
    let addedPrefix = false;

    // 2. Auto-prefixing https:// if scheme is missing (Acceptance Test 15)
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
      candidate = 'https://' + candidate;
      addedPrefix = true;
    } else {
      // Scheme present: check if it's http or https (PRD Section 13)
      if (!/^https?:\/\//i.test(candidate)) {
        return { valid: false, error: MESSAGES.UNSUPPORTED_SCHEME };
      }
    }

    // 3. Parse as standard URL
    let parsed;
    try {
      parsed = new URL(candidate);
    } catch {
      return { valid: false, error: MESSAGES.WRONG_FORMAT };
    }

    // Must be http: or https:
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: MESSAGES.UNSUPPORTED_SCHEME };
    }

    // 4. Prohibited destinations check (Acceptance Test 16 & Security Rules)
    const hostname = parsed.hostname;
    if (isProhibitedDestination(hostname)) {
      return { valid: false, error: MESSAGES.PROHIBITED_DESTINATION };
    }

    // Must have a valid domain format (at least one dot)
    if (!hostname || !hostname.includes('.')) {
      return { valid: false, error: MESSAGES.WRONG_FORMAT };
    }

    const registrableDomain = getRegistrableDomain(hostname);

    return {
      valid: true,
      url: parsed.href,
      normalizedUrl: parsed.origin + parsed.pathname + parsed.search + parsed.hash,
      hostname: parsed.hostname,
      registrableDomain: registrableDomain,
      addedPrefix: addedPrefix
    };
  }

  return {
    MESSAGES,
    validateAddress,
    isProhibitedDestination,
    getRegistrableDomain,
    isInternalLink
  };
});
