# WebAudX Product Scope and Behaviour Rules

## 1. Authority and change control
- The current WebAudX PRD v1.0 is marked **Draft for approval**. Its requirements are proposed, not approved, until the product owner explicitly approves them.
- Treat a later explicit product-owner decision as an update only when it clearly changes or confirms a requirement.
- Do not turn recommendations, assumptions, examples, or open decisions into approved requirements.
- If a requirement is unclear, conflicts with another requirement, or needs a decision the PRD leaves open, record the question and ask the product owner before implementing that behaviour.
- Do not add, remove, or change product features, measurements, questions, answer choices, report sections, or user journey steps without explicit approval.
- Keep this five-file rules structure. Do not create additional rules files or remove any of the five.

## 2. Product definition
WebAudX helps a user review the clarity and usability of one web page. It combines an automated check of that page with seven user answers and produces a plain-English report. It is not a full audit.

Every report must visibly distinguish:
- **Measured:** results from the automated check.
- **Your answer:** judgments supplied by the user.

Do not present the user's answers as automated findings or automated measurements as proof of overall website quality.

## 3. Proposed user journey from PRD v1.0
The following journey is proposed by the draft PRD and remains subject to approval:
1. Explain what WebAudX checks and does not check.
2. Accept and validate one page address.
3. Run the automated check and show progress.
4. Show the check summary or explain why the check could not complete.
5. Ask the seven required questions.
6. Let the user review and submit answers.
7. Display the report.
8. Allow PDF download without an account.
9. Offer optional account creation after the report, for report branding.

Do not require an account or branding before showing the report.

## 4. Automated check boundaries
- The primary review target is the one page submitted by the user.
- Follow no more than three redirects from that submitted address.
- The check reads the page as delivered. It must not run the page's scripts.
- Do not submit forms, log in, click controls, or otherwise interact with the submitted page.
- In addition to the primary page, the check may contact up to 30 sampled internal links solely to determine whether those sampled links are broken.
- The PRD does not define the exact meaning of an internal link (same hostname, same origin, or same registrable domain). Do not choose one silently; obtain product-owner approval before implementing the definition.
- The 13 measured items are:
  1. Secure connection.
  2. Page loads.
  3. Page title.
  4. Search summary.
  5. Main heading.
  6. Heading structure.
  7. Readable text.
  8. Navigation menu.
  9. Internal links.
  10. Action links and buttons.
  11. Ways to contact.
  12. Mobile display setting.
  13. Image descriptions.
- Each measured item uses exactly one status: `Good`, `Needs attention`, or `Could not check`, with a one-sentence plain-English explanation.
- If readable text is below 200 words, mark the overall check `Limited`; mark measured items 3–7 and 10 `Could not check`; remove suggestions that depend on unavailable measurements; explain the limitation.
- Suggested answers are available only for Questions 3, 5, and 7, and only when the required supporting measurements are available.
- Do not add measurements or imply that the check evaluates design quality, tone, persuasiveness, or visitor behaviour.

## 5. Check status definitions
Use these meanings consistently:
- **Complete:** The automated check has completed without the PRD's limited-content condition. Individual measurements may still have `Could not check` statuses if a particular measurement fails.
- **Limited:** The page has fewer than 200 words of readable text. Apply the limited-content behaviour in Section 4.
- **Not completed:** The automated check could not produce a usable check result. Show the reason using the applicable proposed message from PRD Section 13.
- **Unresolved:** The PRD does not enumerate every condition that determines when a check is `Not completed`. Do not invent a complete failure taxonomy. For a new failure condition, preserve the error, identify what could not be measured, and request approval for any new user-facing classification or behaviour.

A failed individual measurement does not automatically mean the entire check is `Not completed`.

## 6. Questionnaire
The questionnaire contains exactly these seven questions:
1. First impression: Can a first-time visitor quickly understand what this website is about?
2. Messaging: Can a visitor understand what is being offered and who it is for?
3. Navigation: Can a visitor easily find the information they are looking for?
4. Visual hierarchy: Are the most important information and elements easy to notice?
5. Call to action: Is it clear what the visitor should do next?
6. User experience: Can a visitor use the website without unnecessary confusion?
7. Mobile experience: Is the website easy to understand and use on a mobile device?

- Each question has exactly four answers: `Yes`, `Partly`, `No`, `Not sure`.
- All seven answers are required before report generation.
- Users may keep or change a suggested answer before submission.
- Do not add, remove, reorder, or rewrite questions or answer choices without approval.

## 7. Suggested-answer rules
The draft PRD defines these suggestions:

| Question | Suggested Yes | Suggested Partly | Suggested No |
|---|---|---|---|
| 3. Navigation | A menu exists and no sampled links are broken. | A menu exists but some sampled links are broken, or no menu exists but other internal links do. | No menu and no internal links. |
| 5. Call to action | Action links or buttons exist and a way to contact exists. | Action links exist without a way to contact, or a way to contact exists without action links. | No action links and no way to contact. |
| 7. Mobile experience | Mobile display setting exists. | No suggestion is defined. | Mobile display setting is missing. |

- Do not infer a `Partly` suggestion for Question 7.
- Do not show suggestions if the check did not complete or the page is `Limited`.
- If the supporting measurements do not establish one of the specified conditions, do not invent a suggestion.
- A **suggested answer** is a proposed questionnaire answer derived from specified automated measurements. It is not the user's submitted answer.
- A **changed suggestion** is a suggested answer the user manually changes before submitting.
- The PRD requires changed suggestions to be identified in the report but does not specify the exact presentation or whether the section remains visible when there are no changes. Do not invent those details; request approval.

## 8. Answer-to-report behaviour
- `Yes` → `What is working`: a short positive finding; no recommendation.
- `Partly` or `No` → `Areas to improve`: a question-specific finding and practical next step.
- `Not sure` → `Needs further review`: explain that the user could not confidently assess the area and give a simple way to check.
- Each question must have its own predefined finding and recommendation for each applicable answer. Do not reuse another question's recommendation.
- Where an automated check result supports a finding, state that evidence in plain English.
- If the user changes a suggested answer, identify that change in the report.
- The summary describes the pattern of answers in plain English. Do not create a combined score, grade, or pass/fail verdict.
- The PRD permits counts of individual checks, but not a combined score.

## 9. Report structure
The draft PRD specifies this order for the on-screen report and PDF:
1. Page reviewed: address, final address after permitted redirects if any, date and time.
2. Check status: complete, limited, or not completed; include the reason where relevant.
3. Summary.
4. Check results.
5. What is working.
6. Areas to improve.
7. Needs further review.
8. Changed suggestions.
9. One-line note that multi-page checking is planned for a future version.
10. About this report: one-page automated check plus user answers; not a full or independent audit; reflects the page and date shown.

- Keep `Measured` and `Your answer` visibly distinct.
- The PRD does not specify whether empty report sections should be hidden or shown with an empty-state message. Do not decide this without approval.
- Do not reorder, merge, or rename report sections without approval.
- Do not create a score, grade, ranking, or pass/fail verdict.

## 10. PDF and branding behaviour
- Every report can be downloaded as a PDF without an account.
- PDF content must match the on-screen report and include the date and `Generated with WebAudX`.
- Anonymous PDFs are not stored.
- PDF downloads and branding changes do not count as checks.
- Accounts are only for branding and are offered after the report is displayed.
- Each account may access only its own branding and reports.
- Agency name: maximum 60 characters.
- Logo: PNG, JPG, or SVG, under 1 MB; reject unsafe or unreadable files.
- One brand colour and one of five approved fonts.
- Branding affects new reports and PDFs; previously downloaded PDFs do not change.
- Always retain `Generated with WebAudX`, including branded reports.
- Do not copy the checked website's logo or images into the report.

## 11. V1 exclusions
Do not add these without an explicit scope change:
- Multi-page checking.
- Payments, pricing, or subscriptions.
- Running page scripts or reviewing content available only after scripts run.
- Screenshots or visual analysis.
- Judgments of design, tone, persuasiveness, or visitor behaviour.
- Scores, grades, or pass/fail verdicts.
- Copying website logos or images.
- Shareable report links.
- Team accounts.
- Industry-specific questionnaires or questions beyond the seven.
- Scheduled re-checks.
- Browser extensions, mobile apps, or third-party integrations.
- AI-generated analysis.

## 12. Open product decisions
The PRD lists these as open decisions. Do not treat its recommendations as approvals:
- Sign-in method (the PRD recommends an email sign-in link without a password).
- Signed-in report retention (the PRD recommends 12 months).
- Whether the footer may be removed on a future paid tier.
- Final fonts, logo, and colour.
- Reliability of theme-colour detection; the PRD recommends testing 20 live pages.
- Final plain-English text library.
- The exact presentation of empty report sections and the `Changed suggestions` section.
- The definition of an internal link.
- The complete conditions that produce `Not completed`.

Do not implement a decision that depends on one of these items until it is confirmed.
