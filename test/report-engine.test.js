const test = require('node:test');
const assert = require('node:assert/strict');
const reportEngine = require('../src/report-engine');
const questionnaire = require('../src/questionnaire');

test('Feature 4: Report Engine & Processing Rules Test Suite', async (t) => {

  const sampleInspection = {
    url: 'https://example.com/',
    submittedUrl: 'example.com',
    overallStatus: 'Complete',
    timestamp: '2026-11-20T12:00:00.000Z',
    suggestions: { 3: 'Yes', 5: 'Yes', 7: 'Yes' },
    measurements: [
      { id: 1, name: 'Secure connection', status: 'Good', explanation: 'Uses HTTPS.' },
      { id: 2, name: 'Page loads', status: 'Good', explanation: 'Returns HTTP 200.' },
      { id: 3, name: 'Page title', status: 'Good', explanation: 'Clear title.' },
      { id: 4, name: 'Search summary', status: 'Good', explanation: 'Summary present.' },
      { id: 5, name: 'Main heading', status: 'Good', explanation: 'H1 present.' },
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

  await t.test('Acceptance Test 7: All "Yes" answers produce "What is working" with no recommendations', () => {
    const allYes = { 1: 'Yes', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes' };
    const report = reportEngine.assembleReport(sampleInspection, allYes);

    assert.equal(report.sections.whatIsWorking.length, 7);
    assert.equal(report.sections.areasToImprove.length, 0);
    assert.equal(report.sections.needsFurtherReview.length, 0);

    // Verify each item has a finding and absolutely NO recommendation
    report.sections.whatIsWorking.forEach(item => {
      assert.ok(item.finding && item.finding.length > 0, `Expected finding for Q${item.questionId}`);
      assert.equal(item.recommendation, undefined, `Expected NO recommendation for "Yes" answer on Q${item.questionId}`);
    });
  });

  await t.test('Acceptance Test 8: All "Partly" answers produce all seven areas under "Areas to improve"', () => {
    const allPartly = { 1: 'Partly', 2: 'Partly', 3: 'Partly', 4: 'Partly', 5: 'Partly', 6: 'Partly', 7: 'Partly' };
    const report = reportEngine.assembleReport(sampleInspection, allPartly);

    assert.equal(report.sections.whatIsWorking.length, 0);
    assert.equal(report.sections.areasToImprove.length, 7);
    assert.equal(report.sections.needsFurtherReview.length, 0);

    // Verify each item has both finding and a practical recommendation
    report.sections.areasToImprove.forEach(item => {
      assert.ok(item.finding && item.finding.length > 0, `Expected finding for Q${item.questionId}`);
      assert.ok(item.recommendation && item.recommendation.length > 0, `Expected recommendation for Q${item.questionId}`);
    });
  });

  await t.test('Acceptance Test 9: All "No" answers produce all seven areas under "Areas to improve"', () => {
    const allNo = { 1: 'No', 2: 'No', 3: 'No', 4: 'No', 5: 'No', 6: 'No', 7: 'No' };
    const report = reportEngine.assembleReport(sampleInspection, allNo);

    assert.equal(report.sections.whatIsWorking.length, 0);
    assert.equal(report.sections.areasToImprove.length, 7);
    assert.equal(report.sections.needsFurtherReview.length, 0);

    report.sections.areasToImprove.forEach(item => {
      assert.ok(item.finding && item.finding.length > 0, `Expected finding for Q${item.questionId}`);
      assert.ok(item.recommendation && item.recommendation.length > 0, `Expected recommendation for Q${item.questionId}`);
    });
  });

  await t.test('Acceptance Test 10: All "Not sure" answers produce all seven areas under "Needs further review"', () => {
    const allNotSure = { 1: 'Not sure', 2: 'Not sure', 3: 'Not sure', 4: 'Not sure', 5: 'Not sure', 6: 'Not sure', 7: 'Not sure' };
    const report = reportEngine.assembleReport(sampleInspection, allNotSure);

    assert.equal(report.sections.whatIsWorking.length, 0);
    assert.equal(report.sections.areasToImprove.length, 0);
    assert.equal(report.sections.needsFurtherReview.length, 7);

    report.sections.needsFurtherReview.forEach(item => {
      assert.ok(item.finding && item.finding.length > 0, `Expected finding for Q${item.questionId}`);
      assert.ok(item.checkMethod && item.checkMethod.length > 0, `Expected check method for Q${item.questionId}`);
    });
  });

  await t.test('Acceptance Test 11: Mixed answers appear in the correct section', () => {
    // 2 Yes, 3 Partly/No, 2 Not sure
    const mixed = {
      1: 'Yes',
      2: 'Partly',
      3: 'No',
      4: 'Yes',
      5: 'Not sure',
      6: 'Partly',
      7: 'Not sure'
    };

    const report = reportEngine.assembleReport(sampleInspection, mixed);

    assert.equal(report.sections.whatIsWorking.length, 2);
    assert.equal(report.sections.areasToImprove.length, 3);
    assert.equal(report.sections.needsFurtherReview.length, 2);

    const workingIds = report.sections.whatIsWorking.map(i => i.questionId);
    assert.deepEqual(workingIds, [1, 4]);

    const improveIds = report.sections.areasToImprove.map(i => i.questionId);
    assert.deepEqual(improveIds, [2, 3, 6]);

    const reviewIds = report.sections.needsFurtherReview.map(i => i.questionId);
    assert.deepEqual(reviewIds, [5, 7]);
  });

  await t.test('Acceptance Test 12: No two questions share a recommendation', () => {
    const allRecommendations = new Set();
    const copy = reportEngine.COPY;

    for (let qId = 1; qId <= 7; qId++) {
      const qDef = copy.findings_and_recommendations[String(qId)];
      assert.ok(qDef, `Missing question definition for Q${qId}`);

      // Check 'partly' recommendation
      const partlyRec = qDef.partly.recommendation;
      assert.ok(partlyRec && partlyRec.length > 0, `Q${qId} partly must have recommendation`);
      assert.ok(!allRecommendations.has(partlyRec), `Duplicate recommendation found: "${partlyRec}"`);
      allRecommendations.add(partlyRec);

      // Check 'no' recommendation
      const noRec = qDef.no.recommendation;
      assert.ok(noRec && noRec.length > 0, `Q${qId} no must have recommendation`);
      assert.ok(!allRecommendations.has(noRec), `Duplicate recommendation found: "${noRec}"`);
      allRecommendations.add(noRec);

      // Check 'not_sure' check method
      const notSureRec = qDef.not_sure.recommendation;
      assert.ok(notSureRec && notSureRec.length > 0, `Q${qId} not_sure must have check method`);
      assert.ok(!allRecommendations.has(notSureRec), `Duplicate recommendation/check method found: "${notSureRec}"`);
      allRecommendations.add(notSureRec);
    }

    assert.equal(allRecommendations.size, 21, 'Expected 21 unique recommendations/check methods (3 per question * 7 questions)');
  });

  await t.test('Acceptance Test 13: Report contains no score, grade, or verdict, and states not a full audit', () => {
    const mixed = { 1: 'Yes', 2: 'Yes', 3: 'Partly', 4: 'No', 5: 'Yes', 6: 'Not sure', 7: 'Partly' };
    const report = reportEngine.assembleReport(sampleInspection, mixed);

    // Validate integrity check
    const val = reportEngine.validateReportIntegrity(report);
    assert.ok(val.valid, `Report failed integrity check: ${val.error}`);

    // Check summary text
    const summary = report.sections.summary;
    assert.ok(!summary.includes('/100'), 'Summary must not contain percentage score');
    assert.ok(!summary.toLowerCase().includes('score'), 'Summary must not contain word "score"');
    assert.ok(!summary.toLowerCase().includes('grade'), 'Summary must not contain word "grade"');
    assert.ok(!summary.toLowerCase().includes('pass'), 'Summary must not contain pass/fail verdict');
    assert.ok(!summary.toLowerCase().includes('fail'), 'Summary must not contain pass/fail verdict');

    // Section 10: About this report statement
    const aboutNotice = report.sections.aboutThisReport;
    assert.ok(aboutNotice.includes('not a full or independent audit'), 'Report must state it is not a full or independent audit');
  });

  await t.test('Acceptance Test 6: A changed suggestion appears in the report', () => {
    const initialSuggestions = { 3: 'Yes', 5: 'Yes', 7: 'Yes' };
    // User changes Q3 to 'Partly' and Q7 to 'No', keeps Q5 as 'Yes'
    const answers = {
      1: 'Yes',
      2: 'Yes',
      3: 'Partly', // Changed!
      4: 'Yes',
      5: 'Yes',    // Kept!
      6: 'Yes',
      7: 'No'      // Changed!
    };

    const report = reportEngine.assembleReport(sampleInspection, answers, initialSuggestions);
    const changed = report.sections.changedSuggestions;

    assert.equal(changed.length, 2, 'Expected 2 changed suggestions');
    assert.equal(changed[0].questionId, 3);
    assert.equal(changed[0].suggested, 'Yes');
    assert.equal(changed[0].userChoice, 'Partly');

    assert.equal(changed[1].questionId, 7);
    assert.equal(changed[1].suggested, 'Yes');
    assert.equal(changed[1].userChoice, 'No');
  });

  await t.test('Report Section Order: Strictly follows the 10 PRD Section 8 sections in sequence', () => {
    const answers = { 1: 'Yes', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes' };
    const report = reportEngine.assembleReport(sampleInspection, answers);

    const expectedOrder = [
      'pageReviewed',
      'checkStatus',
      'summary',
      'checkResults',
      'whatIsWorking',
      'areasToImprove',
      'needsFurtherReview',
      'changedSuggestions',
      'multiPageNote',
      'aboutThisReport'
    ];

    assert.deepEqual(report.sectionOrder, expectedOrder);
    for (const secKey of expectedOrder) {
      assert.ok(report.sections[secKey] !== undefined, `Report section "${secKey}" must exist`);
    }
  });

  await t.test('Handles Limited check and Not completed inspection states gracefully', () => {
    const limitedInspection = {
      url: 'https://example.com/short',
      submittedUrl: 'example.com/short',
      overallStatus: 'Limited',
      timestamp: '2026-11-20T12:00:00.000Z',
      measurements: [
        { id: 1, name: 'Secure connection', status: 'Good' },
        { id: 7, name: 'Readable text', status: 'Needs attention', explanation: 'Under 200 words.' }
      ]
    };

    const answers = { 1: 'Yes', 2: 'Partly', 3: 'No', 4: 'Not sure', 5: 'Yes', 6: 'Partly', 7: 'No' };
    const report = reportEngine.assembleReport(limitedInspection, answers);

    assert.equal(report.sections.checkStatus.status, 'Limited');
    assert.ok(report.sections.checkStatus.reason.includes('small amount of text'));
    assert.ok(report.sections.summary.includes('limited due to low readable text'));
  });
});
