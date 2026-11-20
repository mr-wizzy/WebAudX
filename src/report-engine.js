/**
 * WebAudX Report Engine Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 7 (Processing Rules)
 * - WebAudX PRD v1.0 Section 8 (Report Structure & Presentation)
 * - WebAudX PRD v1.0 Section 12 (Plain English Standards)
 * - Acceptance Tests 6, 7, 8, 9, 10, 11, 12, 13
 * - .agent/Skills/questionnaire-and-report-generation.md
 * - Approved copy from docs/copy-library.json
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const copyLibrary = require('../docs/copy-library.json');
    const questionnaire = require('./questionnaire');
    module.exports = factory(copyLibrary, questionnaire);
  } else {
    root.WebAudXReportEngine = factory(root.WebAudXCopyLibrary || null, root.WebAudXQuestionnaire);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (copyLib, questionnaireModule) {

  // Default copy definitions from docs/copy-library.json
  const COPY = (copyLib && copyLib.report) ? copyLib.report : {
    title: 'Webpage Usability Report',
    lead: 'A plain-English evaluation of webpage clarity and usability.',
    review: {
      title: 'Review Your Answers',
      lead: 'Please check your answers before creating the report. You can change any answer at this stage.',
      edit_answers: 'Edit Answers',
      generate_report: 'Generate Report',
      all_answered: 'All 7 questions answered.',
      changed_suggestions_note: 'You chose different answers for suggested items:'
    },
    sections: {
      page_reviewed: 'Page Reviewed',
      check_status: 'Check Status',
      summary: 'Summary',
      check_results: 'Check Results',
      what_is_working: 'What Is Working',
      areas_to_improve: 'Areas to Improve',
      needs_further_review: 'Needs Further Review',
      changed_suggestions: 'Changed Suggestions',
      multi_page_note: 'Checking multiple pages will come in a future version.',
      about_this_report: 'About this report: It combines an automated check of one page with the user\'s answers. It is not a full or independent audit, and it reflects the page on the date shown.'
    },
    badges: {
      measured: 'Measured',
      your_answer: 'Your answer',
      suggested: 'Suggested'
    },
    actions: {
      download_pdf: 'Download PDF',
      brand_report: 'Brand this report',
      review_another: 'Review another page'
    },
    findings_and_recommendations: {
      '1': {
        area: 'First impression',
        question: 'Can a first-time visitor quickly understand what this website is about?',
        yes: {
          finding: 'Visitors can quickly tell what this website is about as soon as they land on the page.',
          recommendation: null
        },
        partly: {
          finding: 'The website purpose is somewhat clear, but a visitor may have to read closely to figure out what it offers.',
          recommendation: 'Place a concise headline and a one-sentence summary near the very top of your page explaining your core service or product.'
        },
        no: {
          finding: 'It is difficult for a new visitor to quickly grasp the purpose of the website.',
          recommendation: 'Add a clear, prominent headline at the top of the page that plainly states what your organization does.'
        },
        not_sure: {
          finding: 'First impression could not be confidently assessed from the delivered page alone.',
          recommendation: 'Ask someone unfamiliar with your business to look at your homepage for five seconds and describe what you do.'
        }
      },
      '2': {
        area: 'Messaging',
        question: 'Can a visitor understand what is being offered and who it is for?',
        yes: {
          finding: 'The page clearly explains what is offered and specifically who the service or product is for.',
          recommendation: null
        },
        partly: {
          finding: 'The offering is mentioned, but the target audience or benefits are not immediately distinct.',
          recommendation: 'Directly state who your service is for and list two or three key benefits near the top of the page.'
        },
        no: {
          finding: 'The page does not clearly communicate the specific offering or target audience.',
          recommendation: 'Write a short introductory paragraph identifying who you help and the primary problem you solve.'
        },
        not_sure: {
          finding: 'Messaging clarity could not be confidently determined.',
          recommendation: 'Review your main headline and text with a client or customer to verify whether your core offer is instantly obvious.'
        }
      },
      '3': {
        area: 'Navigation',
        question: 'Can a visitor easily find the information they are looking for?',
        yes: {
          finding: 'The navigation menu and internal page links make it easy for visitors to find the information they need.',
          recommendation: null
        },
        partly: {
          finding: 'Visitors can find some key pages, but some links or menu sections may be unclear or difficult to locate.',
          recommendation: 'Simplify your navigation menu into 5 to 7 clearly labeled items and ensure all links point to active, relevant pages.'
        },
        no: {
          finding: 'Visitors may struggle to find information because the page lacks a clear navigation menu or helpful links.',
          recommendation: 'Add a visible navigation menu at the top of the page with direct links to your most important sections.'
        },
        not_sure: {
          finding: 'Ease of navigation could not be confidently evaluated.',
          recommendation: 'Test your page links in your browser to verify that every menu item and button leads directly to where a visitor expects.'
        }
      },
      '4': {
        area: 'Visual hierarchy',
        question: 'Are the most important information and elements easy to notice?',
        yes: {
          finding: 'The page uses clear headings and distinct sections so visitors notice the most important information first.',
          recommendation: null
        },
        partly: {
          finding: 'Some important information stands out, but large text blocks or competing sections make scanning difficult.',
          recommendation: 'Break up long paragraphs with descriptive subheadings, bullet points, and generous spacing between sections.'
        },
        no: {
          finding: 'The page layout makes it hard to distinguish primary information from secondary details.',
          recommendation: 'Organize your content into clear visual levels with one main headline, clear subheadings, and bold key points.'
        },
        not_sure: {
          finding: 'Visual hierarchy could not be confidently determined.',
          recommendation: 'Step back from your screen or view the page on a smaller window to see if your eyes naturally focus on the most important message first.'
        }
      },
      '5': {
        area: 'Call to action',
        question: 'Is it clear what the visitor should do next?',
        yes: {
          finding: 'The page clearly guides visitors toward the next step with prominent action buttons and easy contact methods.',
          recommendation: null
        },
        partly: {
          finding: 'Next steps are available, but action buttons or contact options may be easy to overlook or confusingly placed.',
          recommendation: 'Add a high-contrast action button (such as \'Contact us\' or \'Get started\') above the fold and repeat it at the bottom.'
        },
        no: {
          finding: 'The page lacks a clear call to action, leaving visitors unsure of what step to take next.',
          recommendation: 'Include a clear, prominent button inviting the visitor to take a specific action, such as scheduling a call or requesting information.'
        },
        not_sure: {
          finding: 'Call to action clarity could not be confidently assessed.',
          recommendation: 'Look at your page and confirm that a visitor can reach your contact form, phone link, or purchase button within one click.'
        }
      },
      '6': {
        area: 'User experience',
        question: 'Can a visitor use the website without unnecessary confusion?',
        yes: {
          finding: 'The page delivers a straightforward, predictable browsing experience without frustrating roadblocks.',
          recommendation: null
        },
        partly: {
          finding: 'The overall experience is usable, but certain elements or layout shifts may cause minor confusion.',
          recommendation: 'Remove distracting pop-ups, simplify complex forms, and ensure page elements remain predictable as visitors scroll.'
        },
        no: {
          finding: 'The page presents friction or confusion that could cause visitors to leave before finishing their visit.',
          recommendation: 'Streamline the page by removing unnecessary distractions, clarifying form labels, and keeping layout interactions simple.'
        },
        not_sure: {
          finding: 'Overall user experience could not be confidently determined.',
          recommendation: 'Observe a colleague or friend navigating the page on their own device to spot where they pause or encounter difficulty.'
        }
      },
      '7': {
        area: 'Mobile experience',
        question: 'Is the website easy to understand and use on a mobile device?',
        yes: {
          finding: 'The page is sized and formatted so visitors can comfortably read text and tap buttons on mobile devices.',
          recommendation: null
        },
        partly: {
          finding: 'The page loads on mobile devices, but text sizing, button spacing, or scrolling could be improved.',
          recommendation: 'Adjust font sizes and tap target spacing so phone users can easily read text and tap buttons without zooming.'
        },
        no: {
          finding: 'The page is not properly formatted for mobile screens, making it difficult to read and navigate on a phone.',
          recommendation: 'Configure your site so that page content automatically fits mobile screen widths without requiring horizontal scrolling.'
        },
        not_sure: {
          finding: 'Mobile experience could not be confidently assessed from desktop view.',
          recommendation: 'Open the page on an actual smartphone and test scrolling, reading text, and tapping links with your thumb.'
        }
      }
    }
  };

  /**
   * Map question answer to finding and recommendation.
   * Enforces PRD Section 7:
   * - Yes: short positive finding, NO recommendation.
   * - Partly / No: finding + practical next step.
   * - Not sure: note that area could not be confidently assessed + simple check method.
   * - Where check result supports a finding, states it in plain English.
   *
   * @param {number} questionId
   * @param {'Yes' | 'Partly' | 'No' | 'Not sure'} answer
   * @param {object} [inspectionData]
   */
  function mapAnswerToFinding(questionId, answer, inspectionData) {
    const qIdStr = String(questionId);
    const qDefs = COPY.findings_and_recommendations[qIdStr];
    if (!qDefs) {
      throw new Error(`Unknown question ID: ${questionId}`);
    }

    const key = answer.toLowerCase().replace(' ', '_');
    const mapping = qDefs[key];
    if (!mapping) {
      throw new Error(`Unknown answer choice: "${answer}" for question ${questionId}`);
    }

    // Determine supporting check evidence in plain English if available
    let supportingCheck = null;
    if (inspectionData && inspectionData.measurements) {
      const measurements = inspectionData.measurements;
      const getMeas = (id) => measurements.find(m => m.id === id);

      if (questionId === 1) {
        const titleMeas = getMeas(3);
        const headingMeas = getMeas(5);
        if (titleMeas && titleMeas.status === 'Good' && headingMeas && headingMeas.status === 'Good') {
          supportingCheck = `The page provides a clear title and main heading.`;
        }
      } else if (questionId === 3) {
        const navMeas = getMeas(8);
        const linksMeas = getMeas(9);
        if (navMeas && navMeas.status === 'Good' && linksMeas && linksMeas.status === 'Good') {
          supportingCheck = `A navigation menu and tested internal links were found.`;
        } else if (linksMeas && linksMeas.evidence) {
          supportingCheck = linksMeas.evidence;
        }
      } else if (questionId === 5) {
        const actionMeas = getMeas(10);
        const contactMeas = getMeas(11);
        if (actionMeas && actionMeas.status === 'Good' && contactMeas && contactMeas.status === 'Good') {
          supportingCheck = `Clear action links and contact options were identified on the page.`;
        }
      } else if (questionId === 7) {
        const mobileMeas = getMeas(12);
        if (mobileMeas && mobileMeas.status === 'Good') {
          supportingCheck = `A mobile screen display setting was confirmed.`;
        } else if (mobileMeas && mobileMeas.status === 'Needs attention') {
          supportingCheck = `The page does not set how mobile devices size it.`;
        }
      }
    }

    return {
      questionId: questionId,
      area: qDefs.area,
      question: qDefs.question,
      answer: answer,
      finding: mapping.finding,
      recommendation: mapping.recommendation, // null for 'Yes'
      supportingCheck: supportingCheck
    };
  }

  /**
   * Generate plain-English summary of answer pattern and automated checks.
   * Enforces PRD Section 7 & Acceptance Test 13:
   * - The summary describes the pattern of answers in plain English.
   * - It contains NO score, grade, or pass/fail verdict.
   * - It may state e.g. "5 of 13 checks were good", but MUST NOT combine them into one score.
   *
   * @param {object} answers - Map of { [questionId]: answerChoice }
   * @param {object} inspectionData
   * @returns {string} Plain-English summary text
   */
  function generateReportSummary(answers, inspectionData) {
    let yesCount = 0;
    let improveCount = 0; // Partly or No
    let notSureCount = 0;

    for (let i = 1; i <= 7; i++) {
      const a = answers[i];
      if (a === 'Yes') yesCount++;
      else if (a === 'Partly' || a === 'No') improveCount++;
      else if (a === 'Not sure') notSureCount++;
    }

    // Usability questionnaire summary sentence
    const answerSentences = [];
    if (yesCount === 7) {
      answerSentences.push('All seven usability areas reviewed are working well.');
    } else if (improveCount === 7) {
      answerSentences.push('All seven usability areas reviewed have clear opportunities for improvement.');
    } else if (notSureCount === 7) {
      answerSentences.push('All seven usability areas need further review or direct testing.');
    } else {
      const parts = [];
      if (yesCount > 0) parts.push(`${yesCount} ${yesCount === 1 ? 'area is' : 'areas are'} working well`);
      if (improveCount > 0) parts.push(`${improveCount} ${improveCount === 1 ? 'area has' : 'areas have'} opportunities to improve`);
      if (notSureCount > 0) parts.push(`${notSureCount} ${notSureCount === 1 ? 'area needs' : 'areas need'} further review`);
      answerSentences.push(`Out of 7 usability areas reviewed, ${parts.join(', ')}.`);
    }

    // Automated check summary sentence
    let checksSentence = '';
    if (inspectionData && inspectionData.measurements) {
      const measurements = inspectionData.measurements;
      const total = measurements.length;
      const goodCount = measurements.filter(m => m.status === 'Good').length;
      const attentionCount = measurements.filter(m => m.status === 'Needs attention').length;
      const couldNotCount = measurements.filter(m => m.status === 'Could not check').length;

      if (inspectionData.overallStatus === 'Not completed') {
        checksSentence = 'Automated checks could not be completed for this address.';
      } else if (inspectionData.overallStatus === 'Limited') {
        checksSentence = `The automated check was limited due to low readable text; ${goodCount} of ${total} checks were good, while ${couldNotCount} could not be checked.`;
      } else {
        checksSentence = `In the automated page check, ${goodCount} of ${total} checks were good, and ${attentionCount} need attention.`;
      }
    }

    return `${answerSentences.join(' ')} ${checksSentence}`.trim();
  }

  /**
   * Assemble the complete 10-section report conforming strictly to PRD Section 8.
   *
   * Sections in exact sequence:
   * 1. Page reviewed
   * 2. Check status
   * 3. Summary
   * 4. Check results
   * 5. What is working
   * 6. Areas to improve
   * 7. Needs further review
   * 8. Changed suggestions
   * 9. Multi-page checking note
   * 10. About this report
   *
   * @param {object} inspectionData
   * @param {object} answers - Map of { [questionId]: answer }
   * @param {object} [initialSuggestions] - Initial suggestions { [questionId]: choice }
   * @returns {object} The assembled report data object
   */
  function assembleReport(inspectionData, answers, initialSuggestions) {
    if (!answers || typeof answers !== 'object') {
      throw new Error('Answers are required to assemble report.');
    }

    // Validate that all 7 required questions are present
    const qModule = questionnaireModule || (typeof window !== 'undefined' ? window.WebAudXQuestionnaire : null);
    if (qModule && qModule.validateAnswers) {
      const val = qModule.validateAnswers(answers);
      if (!val.valid) {
        throw new Error(val.error || 'All seven questions must be answered.');
      }
    }

    const data = inspectionData || {
      url: '',
      submittedUrl: '',
      overallStatus: 'Not completed',
      measurements: []
    };

    const submittedUrl = data.submittedUrl || data.url || 'Webpage';
    const finalUrl = data.url || submittedUrl;
    const isRedirected = Boolean(data.url && data.submittedUrl && data.url !== data.submittedUrl);
    const timestamp = data.timestamp || new Date().toISOString();

    // 1. Page reviewed (PRD Section 8, Item 1)
    const pageReviewed = {
      submittedAddress: submittedUrl,
      finalAddress: finalUrl,
      redirected: isRedirected,
      timestamp: timestamp,
      formattedDate: new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // 2. Check status (PRD Section 8, Item 2)
    const checkStatus = {
      status: data.overallStatus || 'Complete',
      reason: data.error || (data.overallStatus === 'Limited' ? 'We could read only a small amount of text on this page.' : null)
    };

    // 3. Summary (PRD Section 8, Item 3)
    const summary = generateReportSummary(answers, data);

    // 4. Check results (PRD Section 8, Item 4)
    const checkResults = Array.isArray(data.measurements) ? data.measurements : [];

    // 5. What is working (PRD Section 8, Item 5)
    // Questions answered "Yes" (findings only, no recommendations)
    const whatIsWorking = [];

    // 6. Areas to improve (PRD Section 8, Item 6)
    // Questions answered "Partly" or "No" (findings and practical next steps)
    const areasToImprove = [];

    // 7. Needs further review (PRD Section 8, Item 7)
    // Questions answered "Not sure" (explanation and simple check method)
    const needsFurtherReview = [];

    for (let qId = 1; qId <= 7; qId++) {
      const ans = answers[qId];
      const item = mapAnswerToFinding(qId, ans, data);

      if (ans === 'Yes') {
        whatIsWorking.push({
          questionId: item.questionId,
          area: item.area,
          question: item.question,
          answer: item.answer,
          finding: item.finding,
          supportingCheck: item.supportingCheck
        });
      } else if (ans === 'Partly' || ans === 'No') {
        areasToImprove.push({
          questionId: item.questionId,
          area: item.area,
          question: item.question,
          answer: item.answer,
          finding: item.finding,
          recommendation: item.recommendation,
          supportingCheck: item.supportingCheck
        });
      } else if (ans === 'Not sure') {
        needsFurtherReview.push({
          questionId: item.questionId,
          area: item.area,
          question: item.question,
          answer: item.answer,
          finding: item.finding,
          checkMethod: item.recommendation, // simple check method
          supportingCheck: item.supportingCheck
        });
      }
    }

    // 8. Changed suggestions (PRD Section 8, Item 8)
    const changedSuggestions = [];
    if (initialSuggestions && typeof initialSuggestions === 'object') {
      if (qModule && qModule.getChangedSuggestions) {
        changedSuggestions.push(...qModule.getChangedSuggestions(answers, initialSuggestions));
      } else {
        for (const [qIdStr, sugg] of Object.entries(initialSuggestions)) {
          const qId = parseInt(qIdStr, 10);
          if (answers[qId] && answers[qId] !== sugg) {
            const qDef = COPY.findings_and_recommendations[String(qId)];
            changedSuggestions.push({
              questionId: qId,
              area: qDef ? qDef.area : `Question ${qId}`,
              suggested: sugg,
              userChoice: answers[qId]
            });
          }
        }
      }
    }

    // 9. Multi-page note (PRD Section 8, Item 9)
    const multiPageNote = COPY.sections.multi_page_note;

    // 10. About this report (PRD Section 8, Item 10)
    const aboutThisReport = COPY.sections.about_this_report;

    return {
      title: COPY.title,
      lead: COPY.lead,
      sections: {
        pageReviewed,
        checkStatus,
        summary,
        checkResults,
        whatIsWorking,
        areasToImprove,
        needsFurtherReview,
        changedSuggestions,
        multiPageNote,
        aboutThisReport
      },
      // Array in the exact 10-section sequence for sequential iteration
      sectionOrder: [
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
      ],
      metadata: {
        totalQuestions: 7,
        yesCount: whatIsWorking.length,
        improveCount: areasToImprove.length,
        notSureCount: needsFurtherReview.length,
        changedSuggestionsCount: changedSuggestions.length,
        totalMeasurements: checkResults.length
      }
    };
  }

  /**
   * Validate report object integrity against PRD Section 7 and 8 rules.
   * Ensures no numerical scores, grades, or verdicts exist.
   */
  function validateReportIntegrity(report) {
    if (!report || !report.sections) {
      return { valid: false, error: 'Report is missing sections.' };
    }

    const s = report.sections;
    const requiredSections = [
      'pageReviewed', 'checkStatus', 'summary', 'checkResults',
      'whatIsWorking', 'areasToImprove', 'needsFurtherReview',
      'changedSuggestions', 'multiPageNote', 'aboutThisReport'
    ];

    for (const req of requiredSections) {
      if (s[req] === undefined) {
        return { valid: false, error: `Missing required report section: ${req}` };
      }
    }

    // Ensure What is working items have NO recommendations (PRD Section 7 & Acceptance Test 7)
    for (const item of s.whatIsWorking) {
      if (item.recommendation) {
        return { valid: false, error: `Item in What is working must not have a recommendation.` };
      }
    }

    // Ensure Areas to improve items have recommendations (PRD Section 7)
    for (const item of s.areasToImprove) {
      if (!item.recommendation) {
        return { valid: false, error: `Item in Areas to improve is missing a recommendation.` };
      }
    }

    // Ensure no combined score or grade appears in summary or report
    const serialized = JSON.stringify(report).toLowerCase();
    const forbiddenWords = ['/100', 'score:', 'grade:', 'passed', 'failed', 'pass/fail verdict'];
    for (const word of forbiddenWords) {
      if (serialized.includes(word)) {
        return { valid: false, error: `Forbidden scoring/verdict term "${word}" found in report.` };
      }
    }

    return { valid: true };
  }

  return {
    COPY,
    mapAnswerToFinding,
    generateReportSummary,
    assembleReport,
    validateReportIntegrity
  };
});
