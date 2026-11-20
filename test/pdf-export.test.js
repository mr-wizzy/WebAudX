const test = require('node:test');
const assert = require('node:assert/strict');
const reportEngine = require('../src/report-engine');
const pdfExport = require('../src/pdf-export');

test('Feature 5: Native PDF Generation & Print Export Test Suite', async (t) => {

  const sampleInspection = {
    url: 'https://example.com/',
    submittedUrl: 'example.com',
    overallStatus: 'Complete',
    timestamp: '2026-11-20T12:00:00.000Z',
    measurements: [
      { id: 1, name: 'Secure connection', status: 'Good', explanation: 'Uses HTTPS.' },
      { id: 2, name: 'Page loads', status: 'Good', explanation: 'Returns HTTP 200.' },
      { id: 3, name: 'Page title', status: 'Good', explanation: 'Clear title.' },
      { id: 4, name: 'Search summary', status: 'Good', explanation: 'Summary present.' },
      { id: 5, name: 'Main heading', status: 'Good', explanation: 'Main heading present.' },
      { id: 6, name: 'Heading structure', status: 'Good', explanation: 'Valid hierarchy.' },
      { id: 7, name: 'Readable text', status: 'Good', explanation: '500 words found.' },
      { id: 8, name: 'Navigation menu', status: 'Good', explanation: 'Menu present.' },
      { id: 9, name: 'Internal links', status: 'Good', explanation: '15 links sampled, 0 broken.' },
      { id: 10, name: 'Action links and buttons', status: 'Good', explanation: 'Action buttons found.' },
      { id: 11, name: 'Ways to contact', status: 'Good', explanation: 'Contact form found.' },
      { id: 12, name: 'Mobile display setting', status: 'Good', explanation: 'Mobile viewport set.' },
      { id: 13, name: 'Image descriptions', status: 'Good', explanation: '10 of 10 described.' }
    ]
  };

  const sampleAnswers = {
    1: 'Yes',
    2: 'Partly',
    3: 'No',
    4: 'Yes',
    5: 'Not sure',
    6: 'Partly',
    7: 'No'
  };

  const report = reportEngine.assembleReport(sampleInspection, sampleAnswers);

  await t.test('Acceptance Test 2: Printable PDF is generated without requiring an account', () => {
    const printableHtml = pdfExport.generatePrintableHtml(report);
    assert.ok(printableHtml && printableHtml.length > 500, 'Printable HTML must be generated');
    assert.ok(printableHtml.includes('<!DOCTYPE html>'), 'Must be valid standalone HTML');
  });

  await t.test('User Requirement: Excludes website top navigation header and generic website footer', () => {
    const styles = pdfExport.getPrintStyles();
    assert.ok(styles.includes('header,'), 'Print styles must exclude site header');
    assert.ok(styles.includes('footer,'), 'Print styles must exclude generic site footer');
    assert.ok(styles.includes('.report-toolbar'), 'Print styles must exclude interactive toolbars');
    assert.ok(styles.includes('display: none !important'), 'Print styles must set display: none !important for excluded elements');
  });

  await t.test('User Requirement: Brands footer with logo, contact text, and phone number 08168076603', () => {
    const footerHtml = pdfExport.buildPdfFooterHtml();
    assert.ok(footerHtml.includes('assets/WebAudX-logo.png'), 'Footer must contain brand logo');
    assert.ok(footerHtml.includes('Generated with WebAudX'), 'Footer must contain mandatory watermark');
    assert.ok(footerHtml.includes('08168076603'), 'Footer must contain phone number 08168076603');
    assert.ok(footerHtml.includes('For custom web development'), 'Footer must contain custom web development prompt');
  });

  await t.test('Footer is styled for every printed page using paged media fixed position', () => {
    const styles = pdfExport.getPrintStyles();
    assert.ok(styles.includes('.pdf-print-page-footer'), 'Must define styles for print footer');
    assert.ok(styles.includes('position: fixed !important'), 'Must be fixed at bottom for paged media');
    assert.ok(styles.includes('bottom: 0 !important'), 'Must anchor to bottom of page');
  });

  await t.test('Report content and all 10 sections are completely preserved in the PDF output', () => {
    const printableHtml = pdfExport.generatePrintableHtml(report);
    assert.ok(printableHtml.includes('1. Page Reviewed'), 'Section 1 must be present');
    assert.ok(printableHtml.includes('2. Check Status'), 'Section 2 must be present');
    assert.ok(printableHtml.includes('3. Summary'), 'Section 3 must be present');
    assert.ok(printableHtml.includes('4. Check Results'), 'Section 4 must be present');
    assert.ok(printableHtml.includes('5. What Is Working'), 'Section 5 must be present');
    assert.ok(printableHtml.includes('6. Areas to Improve'), 'Section 6 must be present');
    assert.ok(printableHtml.includes('7. Needs Further Review'), 'Section 7 must be present');
    assert.ok(printableHtml.includes('8. Changed Suggestions'), 'Section 8 must be present');
    assert.ok(printableHtml.includes('9. Multi-Page Checking'), 'Section 9 must be present');
    assert.ok(printableHtml.includes('10. About This Report'), 'Section 10 must be present');
  });

  await t.test('PDF contains zero arbitrary scores, letter grades, or pass/fail verdicts', () => {
    const printableHtml = pdfExport.generatePrintableHtml(report);
    assert.ok(!printableHtml.includes('/100'), 'PDF must not contain arbitrary percentage score');
    assert.ok(!printableHtml.toLowerCase().includes('score:'), 'PDF must not contain score');
    assert.ok(!printableHtml.toLowerCase().includes('grade:'), 'PDF must not contain grade');
    assert.ok(printableHtml.includes('not a full or independent audit'), 'PDF must state not a full audit');
  });
});
