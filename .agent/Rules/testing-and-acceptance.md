# WebAudX Testing and Acceptance Rules

## 1. Testing authority
- The 26 acceptance tests in WebAudX PRD v1.0 are the acceptance baseline, subject to approval of the draft PRD.
- Do not replace, weaken, or silently reinterpret a PRD acceptance test.
- Additional tests in this file verify stated PRD requirements or the proposed security safeguards in `security-and-privacy.md`. They must not introduce new product features.
- Run only test commands verified in the repository's actual configuration or documentation.
- Never claim a test passed unless it was run and its result was inspected.
- Do not claim a feature is complete while its required acceptance tests are failing or have not been run.
- Use controlled test data and systems. Do not test against websites or systems without permission.

## 2. Test identification for each task
Before implementing a task:
1. Identify the PRD requirement being changed.
2. List the existing acceptance-test IDs affected.
3. Identify the relevant security, privacy, and error-handling checks.
4. Add a focused test for the changed behaviour if no existing test covers it.
5. Do not add unrelated test scope.

After implementation, report each identified test as `Passed`, `Failed`, `Blocked`, or `Not run`, with its evidence.

## 3. PRD acceptance baseline

### Core journey
1. A user can understand what WebAudX checks from the landing page.
2. A user can complete the journey and download a PDF without an account.
3. A user can create an account from the report and set branding.
4. A branded PDF shows the agency's name, logo, colour, and font, and still shows `Generated with WebAudX`.
5. The user cannot submit with an unanswered question.
6. A changed suggestion appears in the report.

### Report
7. All `Yes` answers produce `What is working` with no recommendations.
8. All `Partly` answers produce all seven areas under `Areas to improve`.
9. All `No` answers produce all seven areas under `Areas to improve`.
10. All `Not sure` answers produce all seven areas under `Needs further review`.
11. Mixed answers appear in the correct section.
12. No two questions share a recommendation.
13. The report contains no score, grade, or verdict, and states that it is not a full audit.

### Address and check
14. An empty address cannot be submitted.
15. An address without a prefix is accepted with `https://` added.
16. A private or local address is not checked, and the user sees the specified message.
17. A standard page completes all 13 items and shows suggestions for Questions 3, 5, and 7.
18. A page under 200 words is marked Limited, and dependent suggestions are removed.
19. Each defined check failure shows its message and lets the user continue.
20. At least three live sites built with common website builders are tested, and results are recorded.

### Limits and accounts
21. The eleventh check within 24 hours is refused, with the time to retry.
22. A check rejected before contacting the page does not count.
23. Logos over 1 MB or of an unsupported type are rejected.
24. Each account sees only its own data.
25. Deleted reports and accounts are removed within 30 days.

### Responsiveness
26. All screens work on a phone, a tablet, and a desktop.

## 4. Additional requirement-linked tests

### Inspection limits
- Verify that no more than three redirects are followed.
- Verify that the inspection stops when the configured 10-second response limit is reached. The scope of that timeout (per request or whole inspection) remains an open decision and must be approved before the test's expected result is finalised.
- Verify that a response exceeding 2 MB is rejected. The precise byte-counting basis remains an open decision and must be approved before the test's expected result is finalised.
- Verify that no more than 30 internal links are sampled.
- Verify that fewer than 200 readable words produces `Limited`, marks items 3–7 and 10 `Could not check`, and removes dependent suggestions.
- Verify that a failed individual measurement does not erase unrelated successful measurements.

### URL and network safety
- Verify that prohibited local, loopback, private, link-local, reserved, and internal destinations are rejected before a connection is made, once the proposed destination definition has been approved.
- Verify that every redirect destination is validated before it is contacted.
- Verify that a redirect to a prohibited destination is blocked.
- Verify that a hostname resolving to a mixture of public and prohibited addresses is rejected, once the proposed DNS rule has been approved.
- Verify that the actual connection uses the validated destination and cannot be redirected by a second unvalidated DNS lookup, once the technical mechanism has been approved.
- Verify that sampled internal-link destinations are subject to the same prohibited-destination restrictions.
- Verify that only HTTP and HTTPS schemes are accepted.
- Verify that the inspection does not execute page scripts, submit forms, log in, or interact with page controls.

### Check counting and data
- Verify that a rejected address does not count as a check.
- Verify that an unreachable page does not count as a check.
- Verify that a repeated user-initiated check counts as a new check.
- Verify that PDF downloads and branding changes do not count as checks.
- Verify that the eleventh check inside the approved 24-hour limit window is refused.
- Verify that anonymous session data is not retained after the session except for approved limit-enforcement data.
- Verify that anonymous PDFs are not stored.
- Verify that signed-in reports and branding follow the approved retention period.
- Verify that report and account deletion completes within 30 days.
- Verify that logs contain neither checked page content nor questionnaire answers.
- Verify that one account cannot access another account's reports or branding.

### Logo uploads and PDFs
- Verify that valid PNG, JPG, and SVG logos under 1 MB are accepted.
- Verify that unsupported, oversized, unreadable, or unsafe logos are rejected.
- Verify that an SVG cannot execute scripts or load untrusted external content when displayed.
- Verify that PDF content matches the on-screen report, includes the date, and retains `Generated with WebAudX`.
- Verify that a previously downloaded PDF does not change when branding is later updated.

## 5. Test evidence
For each test, record:
- Test identifier and linked requirement.
- Setup and input.
- Expected result.
- Actual result.
- Status: `Passed`, `Failed`, `Blocked`, or `Not run`.
- Date and environment/build tested.
- Defect or follow-up task, if any.

Do not put sensitive page content, questionnaire answers, secrets, or personal data into operational logs. Test evidence must not expose secrets or unnecessary personal data.

## 6. Failure handling
- Verify that the user sees the proposed plain-English message for each defined failure.
- Verify that the questionnaire can continue after a check failure where the PRD specifies that behaviour.
- Verify that the report identifies measurements that were skipped or could not be completed.
- A failure in one measurement must not silently erase unrelated successful measurements.

## 7. Verification and completion
A task is **verified** only when:
- Its affected acceptance tests have been identified.
- Those tests have actually been run.
- Their results have been inspected.
- Failures and blocked or unrun tests have been disclosed.

A successful build alone does not prove that product behaviour, privacy, or security requirements work.
