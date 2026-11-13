---
name: questionnaire-and-report-generation
description: Implement or troubleshoot WebAudX's seven-question flow, the permitted suggested answers, answer-to-finding mapping, and on-screen report assembly for any inspection outcome.
---

# Questionnaire and Report Generation

## Purpose

Coordinate the transformation of an inspection outcome and the user's seven answers into the WebAudX on-screen report.

## Use this skill when

- Implementing or changing the questionnaire flow.
- Implementing the suggested answers for the specified questions.
- Mapping submitted answers to findings and recommendations.
- Assembling or troubleshooting the on-screen report.

Do not use this skill to change the approved questions, add inspection measurements, invent answer mappings, or implement PDF and branding output.

## Required inputs

- An inspection result with one of the defined overall outcomes: Complete, Limited, or Not completed.
- The seven questionnaire responses when the user submits the questionnaire.
- The applicable PRD requirements and their approval status.
- The current project rules for product behaviour and approved user-facing text.

The questionnaire/report workflow must not reject an inspection result solely because its status is Limited or Not completed. Preserve that status and follow the approved journey and suggestion-availability rules for that outcome.

## Workflow

1. **Load the inspection context**
   - Confirm that an inspection result exists.
   - Preserve its overall status, reason, submitted address, final address when available, date/time context, and individual measurement results.
   - Do not recalculate or reinterpret inspection measurements in this workflow.

2. **Present the questionnaire**
   - Use the seven questions, their specified order, and the answer choices in the approved product requirements.
   - Keep all seven responses required for submission.
   - Preserve the evidence shown with each question as a separate item from the user's answer.
   - Do not replace missing inspection evidence with a guessed statement.

3. **Determine whether suggestions are available**
   - Suggestions may be generated only for Questions 3, 5, and 7.
   - Generate a suggestion only when the required supporting inspection evidence is available under the approved mapping.
   - For a Limited result, apply the PRD's rule that removes suggestions dependent on measurements that could not be checked.
   - For a Not completed result, do not generate suggestions from unavailable inspection measurements.
   - Do not generate suggestions for Questions 1, 2, 4, or 6.
   - Keep each suggestion distinct from the user's final answer.

4. **Capture the user's answers**
   - Allow the user to accept or change an available suggestion.
   - Validate that all seven questions have one permitted answer before submission.
   - Preserve the final answer for every question.
   - Record whether an available suggestion was changed.
   - Do not treat a suggestion as a submitted answer unless the user accepts it through the defined interaction.

5. **Map answers to findings**
   - Apply the exact answer-to-finding and recommendation mapping defined for each question.
   - Use the defined categories: Yes maps to What is working; Partly and No map to Areas to improve; Not sure maps to Needs further review.
   - Keep measured inspection results visibly distinct from the user's answers.
   - Use the predefined finding and recommendation for the question and answer. Do not compose new advice from general assumptions.

6. **Assemble the report**
   - Use the ten report sections and their order from the approved product requirements.
   - Preserve the inspection status and reason.
   - Preserve the submitted page address, final address when redirected, and inspection date/time.
   - Include changed-suggestion information according to an approved presentation decision.
   - Do not decide whether empty report sections are hidden or shown unless an approved decision specifies the behaviour.
   - If a required presentation decision is unresolved, record it as a blocker rather than choosing a display behaviour.

7. **Check report consistency**
   - For each displayed finding, verify that its source is an inspection result, a user answer, or approved explanatory copy.
   - Confirm that measured results and user answers remain distinguishable.
   - Confirm that the report does not introduce a numerical score, grade, or pass/fail verdict.
   - Pass the assembled report data to the PDF workflow without changing its meaning.

8. **Verify the workflow**
   - Test questionnaire submission with Complete, Limited, and Not completed inspection results.
   - Test all permitted answers for each question and the required-answer validation.
   - Test suggestion availability only for Questions 3, 5, and 7, including unavailable evidence and changed suggestions.
   - Test each question's answer-to-finding mapping and the required report section order.
   - Record missing test coverage or unresolved presentation decisions; do not treat them as passed.

## Expected output

A report data structure containing:

- Submitted and final page address, when available
- Inspection date/time context
- Overall inspection status and reason
- Measured inspection results and their evidence
- Evidence shown alongside questionnaire questions
- Seven final questionnaire answers
- Suggestions for eligible questions when supporting evidence is available
- Whether each available suggestion was changed
- Findings and recommendations mapped from the final answers
- The ten report sections in the required order
- Any unresolved presentation decision reported separately as a blocker

## Completion criteria

The workflow is complete when all seven answers are validated, all three inspection outcomes are handled, suggestions are generated only when permitted evidence exists, answer mappings and report order match the approved requirements, and unresolved presentation decisions have not been guessed.

## Related project guidance

Locate `product-scope.md`, `user-facing-content.md`, and `testing-and-acceptance.md` in the repository's documented rules location or project-provided files. Do not assume a directory path. If a referenced file is unavailable, report that fact. These rules define product and copy constraints; this skill defines the questionnaire and report workflow.
