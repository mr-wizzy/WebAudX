---
name: safe-webpage-inspection
description: Plan, implement, or troubleshoot WebAudX's one-page automated inspection, including permitted redirect handling and the limited internal-link sample used for broken-link checking.
---

# Safe Webpage Inspection

## Purpose

Guide the workflow that turns one submitted webpage address into the WebAudX inspection result. This skill coordinates the stages; the PRD and project rules remain authoritative for product behaviour, security, and limits.

## Use this skill when

- Building or changing the automated inspection pipeline.
- Investigating an inspection failure or limited result.
- Connecting retrieval to the 13 defined measurements.
- Checking that an inspection result is ready for the questionnaire and report workflows.

Do not use this skill to build a general-purpose crawler, inspect additional pages for other purposes, run page scripts, or generate questionnaire findings.

## Required inputs

- The submitted webpage address.
- The applicable PRD requirement and its approval status.
- The current implementation and test setup.
- The current project rules for URL validation, destination safety, retrieval limits, and data handling.

If the relevant requirement is still proposed or an essential rule is unresolved, identify the blocker before implementing behaviour that depends on it.

## Workflow

1. **Resolve the governing requirements**
   - Locate the applicable PRD section and `security-and-privacy.md`.
   - Check whether the relevant requirement or decision is approved.
   - Do not create a second URL-safety policy in this skill.
   - If the definition of an internal link is not approved, do not choose same-host, same-origin, or registrable-domain behaviour yourself. Record the decision needed before implementing the sample.

2. **Validate the submitted address**
   - Pass the submitted address through the project's URL-validation and destination-safety process.
   - Keep address parsing, destination validation, retrieval, and redirect handling as identifiable stages.
   - Preserve the validation outcome so an address rejected before retrieval is distinguishable from a retrieval failure.
   - Apply the current project rules for all prohibited destinations and DNS/redirect checks.

3. **Retrieve the primary page**
   - Retrieve only the one page submitted by the user as the primary page.
   - Follow no more than the PRD's permitted three redirects.
   - Record the submitted address, final address reached, and retrieval outcome.
   - Apply the PRD's response-time and page-size limits using the definitions approved for implementation.
   - Do not execute page scripts, submit forms, log in, or interact with page controls.

4. **Prepare the primary-page content**
   - Pass the retrieved page representation and necessary retrieval metadata to the measurement stage.
   - Keep retrieval metadata distinct from measured results.
   - If retrieval fails, return a Not completed outcome with the reason required by the product behaviour.
   - Do not fabricate page content, measurements, or evidence.

5. **Sample internal links for the broken-link measurement**
   - Use the approved definition of an internal link.
   - Sample no more than 30 internal links from the primary page.
   - Contact sampled links only to perform the defined broken-link check.
   - Do not recursively inspect sampled pages, extract further links from them, or use them for the other 12 measurements.
   - Apply the project's destination-safety checks to every sampled destination before contacting it.
   - If the approved internal-link definition or required safety behaviour is unavailable, stop this stage and report the blocker rather than selecting a definition.

6. **Run the 13 defined measurements**
   - Run only the 13 inspection items listed in the approved product requirements.
   - Keep each item separately identifiable.
   - For each item, return its Good, Needs attention, or Could not check status, together with the evidence and approved plain-English explanation required for the report.
   - Use the primary page for the measurements that concern the submitted page. Use the sampled links only for the broken-link measurement.
   - Do not add measurements or infer design quality, tone, persuasiveness, or visitor behaviour.

7. **Classify the overall inspection outcome**
   - Apply the PRD's 200-word readable-text threshold and its specified dependent-item handling.
   - Classify the result as Complete, Limited, or Not completed according to the authoritative product definition.
   - Preserve the reason for Limited or Not completed.
   - Do not invent a classification for an unresolved failure case. Record the missing decision as a blocker.

8. **Return the inspection result**
   - Return the submitted address and final address, when available.
   - Return the overall status and its reason, when applicable.
   - Return one result for each of the 13 defined items, including status, supporting evidence, and required explanation.
   - Include the retrieval information needed by the report, including the inspection date/time context.
   - Keep questionnaire answers, suggested answers, and final report sections out of this result.

9. **Verify the workflow**
   - Trace each inspection requirement to at least one test or record an explicit test-coverage gap.
   - Verify primary-page retrieval, rejected addresses, failed retrieval, redirect handling and redirect limit, sampled-link limit, sampled-link destination safety, broken-link outcomes, the readable-text threshold, and all defined overall statuses.
   - Include boundary values from the approved limits, not only typical successful cases.
   - Record each test outcome and any unresolved or blocked case using `acceptance-test-workflow.md`.

## Expected output

A structured inspection result containing:

- Submitted address
- Final address, when retrieval reached one
- Inspection date/time context
- Overall status: Complete, Limited, or Not completed
- Reason for a Limited or Not completed result
- Results for all 13 defined inspection items
- Per-item status, supporting evidence, and required plain-English explanation
- Any unresolved requirement or test gap reported separately from the result

## Completion criteria

The inspection workflow is ready for downstream use when the primary page and permitted sampled-link check have been handled within approved limits, all 13 measurements have an explicit result, the overall status follows an approved definition, and required tests have passed. An unresolved requirement or unapproved internal-link definition blocks completion; it must not be replaced with an assumption.

## Related project guidance

Locate `product-scope.md`, `security-and-privacy.md`, and `testing-and-acceptance.md` in the repository's documented rules location or project-provided files. Do not assume their directory path. If a file is unavailable, report that fact and request the authoritative content. This skill describes the inspection workflow and does not duplicate the rules.
