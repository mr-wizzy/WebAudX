/**
 * WebAudX Usability Questionnaire Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 6 (Questionnaire & 7 Required Questions)
 * - WebAudX PRD v1.0 Section 5.3 (Suggested Answers Mapping)
 * - WebAudX PRD v1.0 Section 7 (Processing Rules)
 * - .agent/Rules/product-scope.md (Section 6 & 7)
 * - .agent/Skills/questionnaire-and-report-generation.md
 * - Approved copy from docs/copy-library.json
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WebAudXQuestionnaire = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // PRD Section 6: Exactly seven required questions
  const QUESTIONS = [
    {
      id: 1,
      area: 'First impression',
      text: 'Can a first-time visitor quickly understand what this website is about?',
      evidenceItems: [3, 5, 4] // Page title, Main heading, Search summary
    },
    {
      id: 2,
      area: 'Messaging',
      text: 'Can a visitor understand what is being offered and who it is for?',
      evidenceItems: [5, 4] // Main heading, Search summary
    },
    {
      id: 3,
      area: 'Navigation',
      text: 'Can a visitor easily find the information they are looking for?',
      evidenceItems: [8, 9], // Navigation menu, Internal links
      hasSuggestion: true
    },
    {
      id: 4,
      area: 'Visual hierarchy',
      text: 'Are the most important information and elements easy to notice?',
      evidenceItems: [6] // Heading structure
    },
    {
      id: 5,
      area: 'Call to action',
      text: 'Is it clear what the visitor should do next?',
      evidenceItems: [10, 11], // Action links and buttons, Ways to contact
      hasSuggestion: true
    },
    {
      id: 6,
      area: 'User experience',
      text: 'Can a visitor use the website without unnecessary confusion?',
      evidenceItems: [] // None (per PRD Section 6 table)
    },
    {
      id: 7,
      area: 'Mobile experience',
      text: 'Is the website easy to understand and use on a mobile device?',
      evidenceItems: [12], // Mobile display setting
      hasSuggestion: true
    }
  ];

  // PRD Section 6: Exactly four answers for every question
  const CHOICES = ['Yes', 'Partly', 'No', 'Not sure'];

  // Plain-English Copy from docs/copy-library.json
  const COPY = {
    UNANSWERED_WARNING: "Please answer all seven questions before continuing.",
    NO_EVIDENCE_NEEDED: "No automated evidence needed for this question. Base your answer on your experience using the page.",
    LIMITED_EVIDENCE: "Could not check because the page has very little readable text.",
    NOT_COMPLETED_EVIDENCE: "Automated check could not be completed for this page. Please answer based on your browser view.",
    SUGGESTED_PREFIX: "Suggested answer based on page check: "
  };

  /**
   * Determine initial suggested answers for Questions 3, 5, and 7.
   * Only provided when check is 'Complete'.
   * For 'Limited' or 'Not completed', returns empty object.
   *
   * @param {object} inspectionData
   * @returns {object} map of { [questionId]: 'Yes' | 'Partly' | 'No' }
   */
  function getInitialSuggestions(inspectionData) {
    if (!inspectionData || inspectionData.overallStatus !== 'Complete' || !inspectionData.suggestions) {
      return {};
    }

    const suggestions = {};
    if (inspectionData.suggestions[3]) suggestions[3] = inspectionData.suggestions[3];
    if (inspectionData.suggestions[5]) suggestions[5] = inspectionData.suggestions[5];
    if (inspectionData.suggestions[7]) suggestions[7] = inspectionData.suggestions[7];
    return suggestions;
  }

  /**
   * Extract and format plain-English evidence items for a given question.
   *
   * @param {number} questionId (1 to 7)
   * @param {object} inspectionData
   * @returns {{
   *   items: Array<{ label: string, text: string, status?: string }>,
   *   suggestedAnswer?: string,
   *   note?: string
   * }}
   */
  function getQuestionEvidence(questionId, inspectionData) {
    const q = QUESTIONS.find(item => item.id === questionId);
    if (!q) return { items: [] };

    // Question 6 explicitly has no automated evidence
    if (questionId === 6) {
      return {
        items: [],
        note: COPY.NO_EVIDENCE_NEEDED
      };
    }

    if (!inspectionData || inspectionData.overallStatus === 'Not completed') {
      return {
        items: [],
        note: COPY.NOT_COMPLETED_EVIDENCE
      };
    }

    const measurements = inspectionData.measurements || [];
    const getMeasurement = (id) => measurements.find(m => m.id === id);

    const items = [];

    // Helper to add measurement as evidence item
    const addEvidence = (measId, label) => {
      const m = getMeasurement(measId);
      if (!m) return;
      if (m.status === 'Could not check') {
        items.push({
          label: label || m.name,
          text: m.explanation || COPY.LIMITED_EVIDENCE,
          status: 'Could not check'
        });
      } else {
        items.push({
          label: label || m.name,
          text: m.evidence || m.explanation,
          status: m.status
        });
      }
    };

    if (questionId === 1) {
      addEvidence(3, 'Page title');
      addEvidence(5, 'Main heading');
      addEvidence(4, 'Search summary');
    } else if (questionId === 2) {
      addEvidence(5, 'Main heading');
      addEvidence(4, 'Search summary');
    } else if (questionId === 3) {
      addEvidence(8, 'Navigation menu');
      addEvidence(9, 'Internal links');
    } else if (questionId === 4) {
      addEvidence(6, 'Heading structure');
    } else if (questionId === 5) {
      addEvidence(10, 'Action links and buttons');
      addEvidence(11, 'Ways to contact');
    } else if (questionId === 7) {
      addEvidence(12, 'Mobile display setting');
    }

    // Check suggestion for Q3, Q5, Q7
    let suggestedAnswer = undefined;
    if (q.hasSuggestion && inspectionData.overallStatus === 'Complete' && inspectionData.suggestions) {
      suggestedAnswer = inspectionData.suggestions[questionId];
    }

    return {
      items: items,
      suggestedAnswer: suggestedAnswer
    };
  }

  /**
   * Validate that all 7 required questions have been answered with valid choices.
   * Enforces PRD Section 6 & Acceptance Test 5: "The user cannot submit with an unanswered question."
   *
   * @param {object} answers - Map of { [questionId]: answerChoice }
   * @returns {{
   *   valid: boolean,
   *   unanswered: number[],
   *   error: string | null
   * }}
   */
  function validateAnswers(answers) {
    if (!answers || typeof answers !== 'object') {
      return {
        valid: false,
        unanswered: [1, 2, 3, 4, 5, 6, 7],
        error: COPY.UNANSWERED_WARNING
      };
    }

    const unanswered = [];
    for (let id = 1; id <= 7; id++) {
      const ans = answers[id];
      if (!ans || !CHOICES.includes(ans)) {
        unanswered.push(id);
      }
    }

    if (unanswered.length > 0) {
      return {
        valid: false,
        unanswered: unanswered,
        error: COPY.UNANSWERED_WARNING
      };
    }

    return {
      valid: true,
      unanswered: [],
      error: null
    };
  }

  /**
   * Track whether any available suggested answer was changed by the user.
   * Enforces PRD Section 7 & Acceptance Test 6: "A changed suggestion appears in the report."
   *
   * @param {object} answers - User submitted answers { [qId]: choice }
   * @param {object} initialSuggestions - Map of initial suggestions { [qId]: choice }
   * @returns {Array<{ questionId: number, area: string, suggested: string, userChoice: string }>}
   */
  function getChangedSuggestions(answers, initialSuggestions) {
    if (!answers || !initialSuggestions) return [];

    const changed = [];
    for (const [qIdStr, suggestedVal] of Object.entries(initialSuggestions)) {
      const qId = parseInt(qIdStr, 10);
      const userChoice = answers[qId];
      if (userChoice && userChoice !== suggestedVal) {
        const q = QUESTIONS.find(item => item.id === qId);
        changed.push({
          questionId: qId,
          area: q ? q.area : `Question ${qId}`,
          suggested: suggestedVal,
          userChoice: userChoice
        });
      }
    }

    return changed;
  }

  return {
    QUESTIONS,
    CHOICES,
    COPY,
    getInitialSuggestions,
    getQuestionEvidence,
    validateAnswers,
    getChangedSuggestions
  };
});
