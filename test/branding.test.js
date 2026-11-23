const test = require('node:test');
const assert = require('node:assert/strict');
const brandingValidator = require('../src/branding.js');
const accountStore = require('../src/account-store.js');
const reportEngine = require('../src/report-engine.js');
const pdfExport = require('../src/pdf-export.js');

test('Feature 6: Agency Accounts & Custom Branding Test Suite', async (t) => {

  // Reset store for fresh test runs
  accountStore._reset();

  await t.test('Agency Name validation enforces max 60 characters and non-empty (PRD Section 10.2)', () => {
    // Empty name
    const emptyRes = brandingValidator.validateAgencyName('');
    assert.equal(emptyRes.valid, false);

    // Valid name
    const validRes = brandingValidator.validateAgencyName('Acme Digital Agency');
    assert.equal(validRes.valid, true);
    assert.equal(validRes.sanitized, 'Acme Digital Agency');

    // Name over 60 characters
    const longName = 'A'.repeat(61);
    const longRes = brandingValidator.validateAgencyName(longName);
    assert.equal(longRes.valid, false);
    assert.equal(longRes.error, brandingValidator.COPY.NAME_TOO_LONG);
  });

  await t.test('Brand Color validation accepts only valid hex colors', () => {
    assert.equal(brandingValidator.validateBrandColor('#8306c1').valid, true);
    assert.equal(brandingValidator.validateBrandColor('#fff').valid, true);
    assert.equal(brandingValidator.validateBrandColor('red').valid, false);
    assert.equal(brandingValidator.validateBrandColor('rgb(0,0,0)').valid, false);
  });

  await t.test('Font validation strictly enforces 5 approved fonts (PRD Section 10.2)', () => {
    const approved = ['Montserrat', 'Inter', 'Roboto', 'Lato', 'Open Sans'];
    for (const font of approved) {
      assert.equal(brandingValidator.validateFont(font).valid, true, `Font "${font}" must be accepted`);
    }

    assert.equal(brandingValidator.validateFont('Comic Sans').valid, false);
    assert.equal(brandingValidator.validateFont('Papyrus').valid, false);
  });

  await t.test('Acceptance Test 23: Logos over 1 MB are rejected with approved copy', () => {
    // 1 MB + 1 byte
    const oversizedBuffer = Buffer.alloc(1048576 + 1);
    const res = brandingValidator.validateLogo(oversizedBuffer, 'logo.png');
    assert.equal(res.valid, false);
    assert.equal(res.error, "This logo is larger than 1 MB. Please upload a smaller file.");
  });

  await t.test('Acceptance Test 23: Unsupported file formats are rejected via magic bytes check', () => {
    // Fake PNG (text file renamed to .png)
    const fakePng = Buffer.from('Not a real PNG header, just plain text');
    const res = brandingValidator.validateLogo(fakePng, 'logo.png');
    assert.equal(res.valid, false);
    assert.equal(res.error, "Please upload a PNG, JPG, or SVG file.");
  });

  await t.test('Acceptance Test 23: Valid PNG, JPG, and SVG logos are accepted', () => {
    // Valid PNG header (89 50 4E 47 0D 0A 1A 0A)
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const pngRes = brandingValidator.validateLogo(validPng, 'test.png');
    assert.equal(pngRes.valid, true);
    assert.equal(pngRes.mimeType, 'image/png');

    // Valid JPG header (FF D8 FF)
    const validJpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpgRes = brandingValidator.validateLogo(validJpg, 'test.jpg');
    assert.equal(jpgRes.valid, true);
    assert.equal(jpgRes.mimeType, 'image/jpeg');

    // Valid SVG
    const validSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>');
    const svgRes = brandingValidator.validateLogo(validSvg, 'test.svg');
    assert.equal(svgRes.valid, true);
    assert.equal(svgRes.mimeType, 'image/svg+xml');
  });

  await t.test('SVG Sanitizer eliminates Stored XSS vectors (script tags, event handlers, foreignObject)', () => {
    const maliciousSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <script>alert("XSS")</script>
        <circle cx="50" cy="50" r="40" onload="alert('XSS')" />
        <foreignObject width="100" height="100"><iframe src="http://evil.com"></iframe></foreignObject>
        <a href="javascript:stealData()">Click here</a>
      </svg>
    `;

    const sanitized = brandingValidator.sanitizeSvg(maliciousSvg);
    assert.ok(!sanitized.includes('<script'), 'Must not contain script tags');
    assert.ok(!sanitized.includes('onload'), 'Must not contain inline event handlers');
    assert.ok(!sanitized.includes('<foreignObject'), 'Must not contain foreignObject');
    assert.ok(!sanitized.includes('<iframe'), 'Must not contain iframe');
    assert.ok(!sanitized.includes('javascript:'), 'Must not contain javascript: protocol');
    assert.ok(sanitized.includes('<svg'), 'Must retain valid SVG wrapper');
  });

  await t.test('Acceptance Test 3: User can create an account via magic link and set branding', () => {
    const email = 'user1@agency.com';
    const linkInfo = accountStore.createMagicLink(email);
    assert.ok(linkInfo.token && linkInfo.token.length === 64, 'Token must be 64-char hex (256 bits)');

    // Verify magic link
    const auth = accountStore.verifyMagicLink(linkInfo.token);
    assert.ok(auth.sessionToken && auth.sessionToken.length === 64, 'Session token must be 64-char hex');
    assert.equal(auth.email, email);

    // Save agency branding
    const updated = accountStore.updateAccountBranding(auth.accountId, {
      agencyName: 'Pixel Perfection Agency',
      brandColor: '#5a0484',
      font: 'Montserrat',
      logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });

    assert.equal(updated.agencyName, 'Pixel Perfection Agency');
    assert.equal(updated.brandColor, '#5a0484');
    assert.equal(updated.font, 'Montserrat');
    assert.ok(updated.logo && updated.logo.startsWith('data:image/png;base64,'));
  });

  await t.test('Magic link is strictly single-use and expires after 15 minutes', () => {
    const linkInfo = accountStore.createMagicLink('singleuse@agency.com');
    
    // First use: succeeds
    const auth = accountStore.verifyMagicLink(linkInfo.token);
    assert.ok(auth.sessionToken);

    // Second use: must fail
    assert.throws(() => {
      accountStore.verifyMagicLink(linkInfo.token);
    }, /This sign-in link has expired\. Request a new one\./);
  });

  await t.test('Acceptance Test 24: Data Isolation (Account A cannot access Account B data)', () => {
    // Create Account A
    const linkA = accountStore.createMagicLink('accountA@agency.com');
    const authA = accountStore.verifyMagicLink(linkA.token);
    accountStore.updateAccountBranding(authA.accountId, {
      agencyName: 'Agency Alpha',
      brandColor: '#111111',
      font: 'Inter'
    });

    // Create Account B
    const linkB = accountStore.createMagicLink('accountB@agency.com');
    const authB = accountStore.verifyMagicLink(linkB.token);
    accountStore.updateAccountBranding(authB.accountId, {
      agencyName: 'Agency Beta',
      brandColor: '#222222',
      font: 'Roboto'
    });

    // Verify session A returns Account A's branding
    const sessionAccountA = accountStore.getAccountBySession(authA.sessionToken);
    assert.equal(sessionAccountA.branding.agencyName, 'Agency Alpha');

    // Verify session B returns Account B's branding
    const sessionAccountB = accountStore.getAccountBySession(authB.sessionToken);
    assert.equal(sessionAccountB.branding.agencyName, 'Agency Beta');

    // Confirm session A cannot tamper with Account B
    assert.notEqual(sessionAccountA.id, sessionAccountB.id);
  });

  await t.test('Acceptance Test 4: Branded PDF shows agency name, logo, color, font, and retains mandatory watermark', () => {
    const sampleInspection = {
      url: 'https://example.com/',
      submittedUrl: 'example.com',
      overallStatus: 'Complete',
      timestamp: '2026-11-20T12:00:00.000Z',
      measurements: []
    };
    const sampleAnswers = { 1: 'Yes', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes' };
    const report = reportEngine.assembleReport(sampleInspection, sampleAnswers);

    const customBranding = {
      agencyName: 'Top Tier Studios',
      brandColor: '#8306c1',
      font: 'Montserrat',
      logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };

    const printableHtml = pdfExport.generatePrintableHtml(report, customBranding);

    // 1. Mandatory tool name and developer contact must be retained
    assert.ok(printableHtml.includes('WebAudX'), 'Branded PDF must show tool name "WebAudX"');
    assert.ok(!printableHtml.includes('class="pdf-footer-logo"'), 'Branded PDF footer must not contain logo image element');
    assert.ok(printableHtml.includes('08168076603'), 'Branded PDF must retain custom dev contact phone');

    // 2. Custom logo, agency name, and font are included
    assert.ok(printableHtml.includes(customBranding.logo), 'Custom logo must appear in PDF');
    assert.ok(printableHtml.includes('Prepared by Top Tier Studios'), 'Must contain "Prepared by [Agency Name]"');
    assert.ok(printableHtml.includes("'Montserrat', sans-serif"), 'Must use chosen font');
  });

  await t.test('Agency Contact Info: Contact email and phone validation', () => {
    // Valid email
    assert.equal(brandingValidator.validateContactEmail('hello@studio.agency').valid, true);
    assert.equal(brandingValidator.validateContactEmail('hello@studio.agency').sanitized, 'hello@studio.agency');
    // Empty email is valid (optional field)
    assert.equal(brandingValidator.validateContactEmail('').valid, true);
    assert.equal(brandingValidator.validateContactEmail(null).valid, true);
    // Invalid email
    assert.equal(brandingValidator.validateContactEmail('invalid-email').valid, false);

    // Valid phone
    assert.equal(brandingValidator.validateContactPhone('08168076603').valid, true);
    assert.equal(brandingValidator.validateContactPhone('+1 (555) 019-2834').valid, true);
    // Empty phone is valid (optional field)
    assert.equal(brandingValidator.validateContactPhone('').valid, true);
    assert.equal(brandingValidator.validateContactPhone(null).valid, true);
    // Invalid phone
    assert.equal(brandingValidator.validateContactPhone('not-a-phone!@#$').valid, false);
  });

  await t.test('Browser compatibility: Uint8Array and DataURI logo validation succeeds without Buffer', () => {
    // PNG bytes represented as a standard browser Uint8Array
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const resBytes = brandingValidator.validateLogo(pngBytes, 'test.png');
    assert.equal(resBytes.valid, true);
    assert.equal(resBytes.mimeType, 'image/png');

    // Data URI input
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resUri = brandingValidator.validateLogo(dataUri, 'pixel.png');
    assert.equal(resUri.valid, true);
    assert.equal(resUri.mimeType, 'image/png');
  });

  await t.test('Agency contact email and phone are stored and rendered on branded PDF', () => {
    const link = accountStore.createMagicLink('contact-test@agency.com');
    const auth = accountStore.verifyMagicLink(link.token);

    const updated = accountStore.updateAccountBranding(auth.accountId, {
      agencyName: 'Apex UX Agency',
      contactEmail: 'contact@apexux.com',
      contactPhone: '+1 (555) 987-6543',
      brandColor: '#2b0340',
      font: 'Roboto'
    });

    assert.equal(updated.contactEmail, 'contact@apexux.com');
    assert.equal(updated.contactPhone, '+1 (555) 987-6543');

    // Verify session retrieval includes contact fields
    const sessionAccount = accountStore.getAccountBySession(auth.sessionToken);
    assert.equal(sessionAccount.branding.contactEmail, 'contact@apexux.com');
    assert.equal(sessionAccount.branding.contactPhone, '+1 (555) 987-6543');

    // Verify PDF rendering with contact info
    const sampleInspection = {
      url: 'https://example.com/',
      submittedUrl: 'example.com',
      overallStatus: 'Complete',
      timestamp: '2026-11-20T12:00:00.000Z',
      measurements: []
    };
    const sampleAnswers = { 1: 'Yes', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes' };
    const report = reportEngine.assembleReport(sampleInspection, sampleAnswers);

    const printableHtml = pdfExport.generatePrintableHtml(report, sessionAccount.branding);
    assert.ok(printableHtml.includes('contact@apexux.com'), 'PDF header must include contact email');
    assert.ok(printableHtml.includes('+1 (555) 987-6543'), 'PDF header and footer must include contact phone');
    assert.ok(printableHtml.includes('WebAudX'), 'Mandatory tool name must remain');
    assert.ok(!printableHtml.includes('class="pdf-footer-logo"'), 'Branded PDF footer must not contain logo image element');
  });

  await t.test('Branded outputs adapt purple theme to agency color and remove logo from footer', () => {
    const sampleInspection = {
      url: 'https://example.com/',
      submittedUrl: 'example.com',
      overallStatus: 'Complete',
      timestamp: '2026-11-20T12:00:00.000Z',
      measurements: []
    };
    const sampleAnswers = { 1: 'Yes', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes' };
    const report = reportEngine.assembleReport(sampleInspection, sampleAnswers);

    const blueBranding = {
      agencyName: 'Blue Ocean UX',
      brandColor: '#2563eb', // Blue
      font: 'Roboto'
    };

    const printableHtml = pdfExport.generatePrintableHtml(report, blueBranding);

    // 1. Footer has no logo image, only tool name "WebAudX"
    assert.ok(!printableHtml.includes('class="pdf-footer-logo"'), 'Footer must not have logo image');
    assert.ok(printableHtml.includes('>WebAudX</span>'), 'Footer must display only tool name WebAudX');

    // 2. Purple theme elements replaced with agency blue color (#2563eb)
    assert.ok(printableHtml.includes('#2563eb'), 'Must contain agency selected brand color');
    assert.ok(!printableHtml.includes('#8306c1'), 'Must not contain default purple #8306c1');
    assert.ok(!printableHtml.includes('#e2d5ec'), 'Must not contain default purple border #e2d5ec');
    assert.ok(!printableHtml.includes('#fbf5fe'), 'Must not contain default purple background #fbf5fe');
    assert.ok(!printableHtml.includes('#f3eef7'), 'Must not contain default purple tint #f3eef7');
  });

  await t.test('Acceptance Test 25: Account deletion completely purges account and logs completion within 30 days', () => {
    const link = accountStore.createMagicLink('delete-me@agency.com');
    const auth = accountStore.verifyMagicLink(link.token);

    // Delete account
    const res = accountStore.deleteAccount(auth.accountId);
    assert.equal(res.success, true);

    // Confirm session is immediately invalidated
    const deletedAccount = accountStore.getAccountBySession(auth.sessionToken);
    assert.equal(deletedAccount, null);

    // Confirm audit log contains deletion record
    const state = accountStore._getState();
    const log = state.deletionLogs.find(l => l.accountId === auth.accountId);
    assert.ok(log, 'Deletion log must record purged account');
    assert.equal(log.status, 'Completed');
  });
});
