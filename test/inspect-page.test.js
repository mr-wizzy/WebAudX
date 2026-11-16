const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractReadableText,
  analyzePage,
  inspectWebpage,
  READABLE_TEXT_THRESHOLD,
  MAX_REDIRECTS,
  MAX_PAGE_BYTES
} = require('../src/inspect-page.js');
const copyLibrary = require('../docs/copy-library.json');

// Helper to generate text of given word count
function generateWords(count) {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(' ');
}

test('Inspection Engine: extractReadableText', () => {
  const html = `
    <html>
      <head>
        <title>Test Page</title>
        <style>body { color: red; }</style>
        <script>console.log("ignore me");</script>
      </head>
      <body>
        <!-- Comment here -->
        <h1>Welcome</h1>
        <p>This is a <strong>clean</strong> paragraph &amp; sample text.</p>
        <svg><text>Ignored SVG</text></svg>
      </body>
    </html>
  `;
  const res = extractReadableText(html);
  assert.equal(res.text, 'Test Page Welcome This is a clean paragraph & sample text.');
  assert.equal(res.wordCount, 10);
});

test('Inspection Engine: Acceptance Test 17: Standard page completes all 13 items & suggestions', async () => {
  const dummyHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>WebAudX Demo Page For Testing</title>
        <meta name="description" content="This is an official meta description of adequate length for testing search summary." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <nav><a href="/home">Home</a> <a href="/about">About</a></nav>
        <h1>Main Page Title</h1>
        <h2>Section Heading</h2>
        <h3>Sub Section Heading</h3>
        <p>${generateWords(250)}</p>
        <a href="mailto:hello@example.com">Contact Us</a>
        <button>Book Now</button>
        <img src="/logo.png" alt="Company Logo" />
      </body>
    </html>
  `;

  const fetchResult = {
    statusCode: 200,
    finalUrl: 'https://example.com/',
    body: dummyHtml
  };

  const result = await analyzePage(fetchResult, false);

  assert.equal(result.overallStatus, 'Complete');
  assert.equal(result.isLimited, false);
  assert.equal(result.measurements.length, 13);

  // Check 13 item names
  const expectedNames = [
    'Secure connection', 'Page loads', 'Page title', 'Search summary',
    'Main heading', 'Heading structure', 'Readable text', 'Navigation menu',
    'Internal links', 'Action links and buttons', 'Ways to contact',
    'Mobile display setting', 'Image descriptions'
  ];
  for (let i = 0; i < 13; i++) {
    assert.equal(result.measurements[i].name, expectedNames[i]);
    assert.ok(['Good', 'Needs attention', 'Could not check'].includes(result.measurements[i].status));
  }

  // Suggestions for Q3, Q5, Q7 must exist
  assert.ok(result.suggestions[3]);
  assert.ok(result.suggestions[5]);
  assert.ok(result.suggestions[7]);

  // Q7 must be Yes because viewport exists; Q7 never suggests Partly
  assert.equal(result.suggestions[7], 'Yes');
});

test('Inspection Engine: Acceptance Test 18: Page under 200 words is marked Limited and suggestions removed', async () => {
  const shortHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Short Page</title>
        <meta name="viewport" content="width=device-width" />
      </head>
      <body>
        <h1>Title</h1>
        <p>${generateWords(50)}</p>
      </body>
    </html>
  `;

  const fetchResult = {
    statusCode: 200,
    finalUrl: 'https://example.com/short',
    body: shortHtml
  };

  const result = await analyzePage(fetchResult, false);

  assert.equal(result.overallStatus, 'Limited');
  assert.equal(result.isLimited, true);

  // Items 3 to 7 and 10 must be 'Could not check' (PRD Section 5.4)
  // Indices:
  // Item 3 (title): index 2
  // Item 4 (search summary): index 3
  // Item 5 (main heading): index 4
  // Item 6 (heading structure): index 5
  // Item 10 (action buttons): index 9
  assert.equal(result.measurements[2].status, 'Could not check'); // Page title
  assert.equal(result.measurements[3].status, 'Could not check'); // Search summary
  assert.equal(result.measurements[4].status, 'Could not check'); // Main heading
  assert.equal(result.measurements[5].status, 'Could not check'); // Heading structure
  assert.equal(result.measurements[9].status, 'Could not check'); // Action buttons

  // Suggestions must be completely empty when Limited
  assert.deepEqual(result.suggestions, {});
});

test('Inspection Engine: SSRF & Prohibited Destinations are rejected before connecting', async () => {
  const result = await inspectWebpage('http://127.0.0.1:8080');
  assert.equal(result.success, false);
  assert.equal(result.error, copyLibrary.address.prohibited_destination);
  assert.equal(result.overallStatus, 'Not completed');
});

test('Inspection Engine: Acceptance Test 19: Plain-English messages for check failures in Section 13', async () => {
  // Test file not page error message
  assert.equal(
    copyLibrary.inspection.file_not_page,
    'This address leads to a file rather than a web page, so it could not be reviewed.'
  );

  // Test address not found message
  assert.equal(
    copyLibrary.inspection.address_not_found,
    'We could not find this website. Check the address and try again.'
  );

  // Test timeout message
  assert.equal(
    copyLibrary.inspection.too_slow,
    'The page took too long to respond. It may be slow or temporarily unavailable.'
  );

  // Test too large message
  assert.equal(
    copyLibrary.inspection.too_large,
    'This page is too large for WebAudX to review.'
  );

  // Test redirect loop message
  assert.equal(
    copyLibrary.inspection.redirect_loop,
    'This address keeps sending us elsewhere, so we could not reach the page.'
  );

  // Test very little text message
  assert.equal(
    copyLibrary.inspection.very_little_text,
    'We could read only a small amount of text on this page. Some websites load content in ways WebAudX cannot read, so some results are missing.'
  );

  // Test unexpected error message
  assert.equal(
    copyLibrary.inspection.unexpected_error,
    'Something went wrong while reviewing the page. Please try again in a few minutes.'
  );
});

test('Inspection Engine: Acceptance Test 20: Builder patterns (Squarespace, Wix, WordPress style) tested', async () => {
  // 1. Squarespace style
  const squarespaceHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Artisan Bakery - Handcrafted Breads & Pastries</title>
        <meta name="description" content="Handcrafted artisan sourdough breads and French pastries baked fresh daily in Seattle." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header><nav><a href="/menu">Menu</a> <a href="/story">Our Story</a></nav></header>
        <main>
          <h1>Fresh Handcrafted Breads Everyday</h1>
          <h2>Our Breads</h2>
          <p>${generateWords(220)}</p>
          <a href="/order">Shop Fresh Loaves</a>
          <a href="tel:+12065550199">Call Bakery</a>
          <img src="/bread.jpg" alt="Fresh artisan sourdough bread loaf" />
        </main>
      </body>
    </html>
  `;
  const res1 = await analyzePage({ statusCode: 200, finalUrl: 'https://artisan-bakery.example.com/', body: squarespaceHtml }, false);
  assert.equal(res1.overallStatus, 'Complete');
  assert.equal(res1.measurements.find(m => m.name === 'Page title').status, 'Good');
  assert.equal(res1.measurements.find(m => m.name === 'Search summary').status, 'Good');
  assert.equal(res1.measurements.find(m => m.name === 'Main heading').status, 'Good');
  assert.equal(res1.measurements.find(m => m.name === 'Action links and buttons').status, 'Good');
  assert.equal(res1.measurements.find(m => m.name === 'Ways to contact').status, 'Good');
  assert.equal(res1.suggestions[3], 'Yes');
  assert.equal(res1.suggestions[5], 'Yes');
  assert.equal(res1.suggestions[7], 'Yes');

  // 2. Wix style
  const wixHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Studio Apex | Architecture & Interior Design</title>
        <meta name="description" content="Award-winning residential architecture and commercial interior design studio." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </head>
      <body>
        <div role="navigation"><a href="/portfolio">Portfolio</a></div>
        <h1>Modern Spaces Designed for Living</h1>
        <h2>Featured Residential Projects</h2>
        <p>${generateWords(240)}</p>
        <a href="mailto:studio@example.com">Contact Our Architects</a>
        <button>Get Started</button>
      </body>
    </html>
  `;
  const res2 = await analyzePage({ statusCode: 200, finalUrl: 'https://studio-apex.example.com/', body: wixHtml }, false);
  assert.equal(res2.overallStatus, 'Complete');
  assert.equal(res2.suggestions[3], 'Yes');
  assert.equal(res2.suggestions[5], 'Yes');
  assert.equal(res2.suggestions[7], 'Yes');

  // 3. WordPress style
  const wpHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Green Valley Legal - Family Law & Mediation</title>
        <meta name="description" content="Compassionate and experienced family law attorneys guiding you through mediation and custody." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <nav class="main-navigation"><a href="/practice-areas">Practice Areas</a></nav>
        <h1>Family Law with Care and Clarity</h1>
        <h2>How We Help You</h2>
        <h3>Mediation Services</h3>
        <p>${generateWords(210)}</p>
        <form action="/consultation" method="post"><button type="submit">Book a Consultation</button></form>
      </body>
    </html>
  `;
  const res3 = await analyzePage({ statusCode: 200, finalUrl: 'https://green-valley-legal.example.com/', body: wpHtml }, false);
  assert.equal(res3.overallStatus, 'Complete');
  assert.equal(res3.measurements.find(m => m.name === 'Heading structure').status, 'Good');
  assert.equal(res3.suggestions[5], 'Yes');
  assert.equal(res3.suggestions[7], 'Yes');
});
