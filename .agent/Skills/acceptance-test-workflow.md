---
name: acceptance-test-workflow
description: Trace WebAudX requirements to tests, run the required checks, and record evidence without confusing a completed test record with a verified feature.
---

# Acceptance Test Workflow

## Purpose

Provide a repeatable process for verifying WebAudX changes against their approved requirements and recording the evidence. This skill defines the verification workflow; it does not create or approve product requirements.

## Use this skill when

- An implementation change is ready for verification.
- A change may affect an existing user journey or system behaviour.
- Preparing a release-readiness verification record.
- Investigating a failed, blocked, or unrun test.

Do not use this skill to redefine requirements, approve product decisions, or describe untested behaviour as verified.

## Required inputs

- The feature or change being verified.
- The approved requirement source and its acceptance criteria.
- The implementation changes and affected user/system flows.
- The current test environment and repository test instructions.

If the requirement is still proposed or its approval cannot be established, report that status. Tests may be run as exploratory checks, but they must not be represented as proof of compliance with an approved requirement.

## Definitions

- **Acceptance criterion:** An observable condition that must be true for an approved requirement to be satisfied.
- **Requirement coverage:** A traceable link from each in-scope acceptance criterion to one or more tests or an explicitly recorded test gap.
- **Regression test:** A test of existing behaviour that could be affected by the change because it shares a changed component, interface, data contract, or user journey.
- **Test result:** The outcome for one executed or attempted test: Passed, Failed, Blocked, or Not run.
- **Verified:** Every in-scope acceptance criterion has adequate test coverage, all required tests have been run, and all required tests have passed.
- **Not verified:** Any in-scope criterion is uncovered, or any required test is Failed, Blocked, Not run, or lacks sufficient evidence.
- **Test record complete:** Every selected test has a recorded result and evidence or a stated reason it could not be completed. A complete test record does not mean the feature is verified.

## Workflow

1. **Confirm the requirement and scope**
   - Locate the approved requirement and list its acceptance criteria.
   - Identify the implementation changes associated with the requirement.
   - Identify the user journey, system flow, components, interfaces, and data contracts directly changed.
   - If approval status is unclear, record the uncertainty and do not claim requirement compliance.

2. **Inspect the actual test setup**
   - Read the repository instructions and current test configuration.
   - Identify the test framework, available test commands, required environment variables, and dependencies from the repository itself.
   - Run only commands that are documented or confirmed to exist.
   - Do not invent command names, scripts, test files, or test results.

3. **Build a requirement-to-test map**
   - Create one row for every in-scope acceptance criterion.
   - Link each criterion to at least one test that asserts its expected observable behaviour.
   - Inspect the test assertions; a test title alone does not establish coverage.
   - If no suitable test exists, record a coverage gap and identify the test that must be added or the reason testing is blocked.
   - Do not silently omit a criterion because the existing suite has no test for it.

4. **Select regression tests**
   - Include existing tests for each changed component or interface.
   - Include tests for direct consumers and providers of a changed interface or data contract.
   - Include existing tests for the same user journey where the changed behaviour is used.
   - Record why a potentially affected area is excluded if it has no shared component, interface, data contract, or journey with the change.
   - Do not expand the test scope to unrelated product areas.

5. **Include required test conditions**
   - For each criterion, identify the expected successful case.
   - Add boundary and failure cases when the requirement defines a limit, rejection, error, or alternate outcome.
   - For conditional behaviour, test both the condition being met and not met.
   - Derive test values from the approved requirement. If a necessary boundary or expected outcome is not defined, record the missing decision rather than inventing it.
   - Keep proposed tests distinct from tests already present in the repository.

6. **Run the tests**
   - Execute the selected tests in the supported environment.
   - Record the exact command or test identifier and the observed output.
   - Do not report a test as passed based only on a successful build, code inspection, or the absence of an error message.
   - Do not change production behaviour solely to make a test pass unless the change is traced to an approved requirement.

7. **Record each test result**
   - Use exactly one result for each test: Passed, Failed, Blocked, or Not run.
   - For Passed, record the evidence showing the expected result occurred.
   - For Failed, record expected behaviour, actual behaviour, and reproducible evidence.
   - For Blocked, record the blocking condition and what is required to remove it.
   - For Not run, record why it was not run.
   - Keep the test record complete even when the feature is not verified.

8. **Determine verification status**
   - Mark the change **Verified** only when every in-scope criterion maps to adequate test coverage and every required test has been run and passed.
   - Mark it **Not verified** if any criterion is uncovered or any required test is Failed, Blocked, Not run, or lacks sufficient evidence.
   - List all coverage gaps and failed, blocked, or unrun tests.
   - Do not convert a blocked or failed result into a pass by documenting it.

9. **Report the outcome**
   - Summarize the requirement scope and approval status.
   - Include the requirement-to-test map, commands, results, and evidence.
   - State separately whether the test record is complete and whether the change is verified.
   - Identify unresolved product decisions and environment blockers.

## Expected output

A verification record containing:

- Feature or change tested
- Requirement source and approval status
- In-scope acceptance criteria
- Requirement-to-test map
- Regression tests selected and the reason for selection
- Exact test identifiers or commands used
- Result and evidence for every test
- Coverage gaps, failures, blockers, and unrun tests
- Test record status: Complete or Incomplete
- Verification status: Verified or Not verified

## Completion criteria

The workflow's record is complete when every selected test has a result and supporting evidence or a stated reason it could not be completed. The feature is Verified only when every in-scope acceptance criterion is covered and every required test has passed. These are separate outcomes.

## Related project guidance

Locate `testing-and-acceptance.md` and the other project rules relevant to the tested behaviour in the repository's documented rules location or project-provided files. Do not assume a directory path. If a referenced file is unavailable, report that fact and do not invent its requirements. This skill defines the verification procedure and does not duplicate the project rules.
