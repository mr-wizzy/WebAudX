const test = require('node:test');
const assert = require('node:assert/strict');
const {
  QUESTIONS,
  CHOICES,
  COPY,
  getInitialSuggestions,
  getQuestionEvidence,
  validateAnswers,
  getChangedSuggestions
} = require('../src/questionnaire.js');
const copyLibrary = require('../docs/copy-library.json');

test('Questionnaire: Approved 7 Questions Structure (PRD Section 6)', () => {
  assert.equal(QUESTIONS.length, 7, 'Must have exactly 7 questions');

  const expectedAreas = [
    'First impression',
    'Messaging',
    'Navigation',
    'Visual hierarchy',
    'Call to action',
    'User experience',
    'Mobile experience'
  ];

  const expectedQuestions = [
    'Can a first-time visitor quickly understand what this website is about?',
    'Can a visitor understand what is being offered and who it is for?',
    'Can a visitor easily find the information they are looking for?',
    'Are the most important information and elements easy to notice?',
    'Is it clear what the visitor should do next?',
    'Can a visitor use the website without unnecessary confusion?',
    'Is the website easy to understand and use on a mobile device?'
  ];

  QUESTIONS.forEach((q, idx) => {
    assert.equal(q.id, idx + 1);
    assert.equal(q.area, expectedAreas[idx]);
    assert.equal(q.text, expectedQuestions[idx]);
  });
});

test('Questionnaire: Approved Choices (PRD Section 6)', () => {
  assert.deepEqual(CHOICES, ['Yes', 'Partly', 'No', 'Not sure']);
});

test('Questionnaire: Acceptance Test 5: The user cannot submit with an unanswered question', () => {
  // Empty answers
  const emptyRes = validateAnswers({});
  assert.equal(emptyRes.valid, false);
  assert.equal(emptyRes.unanswered.length, 7);
  assert.equal(emptyRes.error, copyLibrary.questionnaire.unanswered_warning);

  // Partially answered (e.g. 5 of 7)
  const partialRes = validateAnswers({
    1: 'Yes',
    2: 'Partly',
    3: 'No',
    4: 'Not sure',
    5: 'Yes'
    // missing 6 and 7
  });
  assert.equal(partialRes.valid, false);
  assert.deepEqual(partialRes.unanswered, [6, 7]);
  assert.equal(partialRes.error, copyLibrary.questionnaire.unanswered_warning);

  // Invalid choice value
  const invalidChoiceRes = validateAnswers({
    1: 'Yes', 2: 'Partly', 3: 'No', 4: 'Not sure',
    5: 'Yes', 6: 'InvalidChoice', 7: 'No'
  });
  assert.equal(invalidChoiceRes.valid, false);
  assert.deepEqual(invalidChoiceRes.unanswered, [6]);
});

test('Questionnaire: Validation succeeds when all 7 questions are answered', () => {
  const fullAnswers = {
    1: 'Yes',
    2: 'Partly',
    3: 'No',
    4: 'Not sure',
    5: 'Yes',
    6: 'Partly',
    7: 'No'
  };
  const res = validateAnswers(fullAnswers);
  assert.equal(res.valid, true);
  assert.deepEqual(res.unanswered, []);
  assert.equal(res.error, null);
});

test('Questionnaire: Suggestions eligible only for Questions 3, 5, and 7 on Complete check', () => {
  const completeInspection = {
    overallStatus: 'Complete',
    suggestions: {
      3: 'Yes',
      5: 'Partly',
      7: 'Yes'
    }
  };

  const suggestions = getInitialSuggestions(completeInspection);
  assert.equal(suggestions[3], 'Yes');
  assert.equal(suggestions[5], 'Partly');
  assert.equal(suggestions[7], 'Yes');
  // Must NOT contain suggestions for 1, 2, 4, 6
  assert.equal(suggestions[1], undefined);
  assert.equal(suggestions[2], undefined);
  assert.equal(suggestions[4], undefined);
  assert.equal(suggestions[6], undefined);
});

test('Questionnaire: Suggestions are suppressed when check is Limited or Not completed (PRD Section 5.3 & 5.4)', () => {
  const limitedInspection = {
    overallStatus: 'Limited',
    suggestions: {}
  };
  assert.deepEqual(getInitialSuggestions(limitedInspection), {});

  const incompleteInspection = {
    overallStatus: 'Not completed'
  };
  assert.deepEqual(getInitialSuggestions(incompleteInspection), {});
});

test('Questionnaire: Acceptance Test 6: Changed suggestions are tracked accurately', () => {
  const initialSuggestions = {
    3: 'Yes',
    5: 'Partly',
    7: 'Yes'
  };

  // Case A: User kept all suggestions
  const answersKept = {
    1: 'Yes', 2: 'Yes',
    3: 'Yes', // kept
    4: 'Yes',
    5: 'Partly', // kept
    6: 'Yes',
    7: 'Yes' // kept
  };
  const changedA = getChangedSuggestions(answersKept, initialSuggestions);
  assert.equal(changedA.length, 0);

  // Case B: User changed Q3 from 'Yes' to 'Partly' and Q7 from 'Yes' to 'No'
  const answersChanged = {
    1: 'Yes', 2: 'Yes',
    3: 'Partly', // changed from Yes
    4: 'Yes',
    5: 'Partly', // kept
    6: 'Yes',
    7: 'No' // changed from Yes
  };
  const changedB = getChangedSuggestions(answersChanged, initialSuggestions);
  assert.equal(changedB.length, 2);
  assert.equal(changedB[0].questionId, 3);
  assert.equal(changedB[0].suggested, 'Yes');
  assert.equal(changedB[0].userChoice, 'Partly');
  assert.equal(changedB[1].questionId, 7);
  assert.equal(changedB[1].suggested, 'Yes');
  assert.equal(changedB[1].userChoice, 'No');
});

test('Questionnaire: Evidence extraction per question (PRD Section 6)', () => {
  const dummyInspection = {
    overallStatus: 'Complete',
    measurements: [
      { id: 3, name: 'Page title', evidence: 'Awesome Company', status: 'Good' },
      { id: 4, name: 'Search summary', evidence: 'We make great widgets for small businesses.', status: 'Good' },
      { id: 5, name: 'Main heading', evidence: 'Empowering Your Business', status: 'Good' },
      { id: 6, name: 'Heading structure', evidence: 'h1 → h2 → h3', status: 'Good' },
      { id: 8, name: 'Navigation menu', evidence: 'Navigation landmark found', status: 'Good' },
      { id: 9, name: 'Internal links', evidence: '15 internal links found', status: 'Good' },
      { id: 10, name: 'Action links and buttons', evidence: '4 action terms found', status: 'Good' },
      { id: 11, name: 'Ways to contact', evidence: 'email link, phone link', status: 'Good' },
      { id: 12, name: 'Mobile display setting', evidence: 'Mobile display setting detected', status: 'Good' }
    ],
    suggestions: { 3: 'Yes', 5: 'Yes', 7: 'Yes' }
  };

  // Q1 shows Page title, Main heading, Search summary
  const ev1 = getQuestionEvidence(1, dummyInspection);
  assert.equal(ev1.items.length, 3);
  assert.equal(ev1.items[0].label, 'Page title');
  assert.equal(ev1.items[1].label, 'Main heading');
  assert.equal(ev1.items[2].label, 'Search summary');

  // Q2 shows Main heading, Search summary
  const ev2 = getQuestionEvidence(2, dummyInspection);
  assert.equal(ev2.items.length, 2);

  // Q3 shows Navigation menu, Internal links + suggested answer
  const ev3 = getQuestionEvidence(3, dummyInspection);
  assert.equal(ev3.items.length, 2);
  assert.equal(ev3.suggestedAnswer, 'Yes');

  // Q4 shows Heading structure
  const ev4 = getQuestionEvidence(4, dummyInspection);
  assert.equal(ev4.items.length, 1);
  assert.equal(ev4.items[0].label, 'Heading structure');

  // Q6 explicitly has no automated evidence
  const ev6 = getQuestionEvidence(6, dummyInspection);
  assert.equal(ev6.items.length, 0);
  assert.ok(ev6.note.includes('No automated evidence needed'));

  // Q7 shows Mobile display setting + suggested answer
  const ev7 = getQuestionEvidence(7, dummyInspection);
  assert.equal(ev7.items.length, 1);
  assert.equal(ev7.suggestedAnswer, 'Yes');
});
