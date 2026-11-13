---
name: pdf-and-branding-generation
description: Generate WebAudX report PDFs and apply the defined default or optional agency branding without changing report meaning or previously downloaded PDFs.
---

# PDF and Branding Generation

## Purpose

Guide PDF rendering and the application of WebAudX or agency branding to report outputs. This skill coordinates the workflow; the PRD and project rules define the permitted settings and data-handling behaviour.

## Use this skill when

- Implementing or changing PDF export.
- Applying default WebAudX branding or an account's saved agency branding.
- Validating branding inputs.
- Investigating a difference between the on-screen report and its PDF.

Do not use this skill to change report findings, add paid features, create share links, or redesign the account flow.

## Required inputs

- The assembled report data.
- The report's applicable branding context.
- The approved branding settings and the final approved font list.
- The current PDF implementation and relevant acceptance tests.
- The project rules for logo handling, account isolation, retention, and deletion.

If the final approved font list or another required branding decision is unavailable, report the blocker. Do not invent a substitute list or value.

## Workflow

1. **Determine the branding context**
   - Use default WebAudX branding when no eligible saved agency branding applies.
   - Use agency branding only when the signed-in account has valid saved settings for that account.
   - Do not copy the reviewed webpage's logo, images, or other branding assets.
   - Keep the branding context used for a generated report identifiable so the PDF can use the same context.

2. **Resolve default branding values**
   - Use WebAudX branding as the default brand.
   - Use the reviewed site's theme colour only when the implementation can identify it using the approved detection behaviour.
   - If no usable theme colour is available, use the WebAudX brand colour.
   - Do not substitute a colour selected by guesswork.
   - If the approved theme-colour detection behaviour or WebAudX brand value is unavailable, report the missing decision.

3. **Validate agency branding**
   - Validate the agency name, logo file type and size, brand colour, and font against the approved product requirements.
   - Use only the final approved list of five fonts. If that list has not been approved or cannot be located, stop the font-selection implementation and report the blocker.
   - Pass logo files through the validation and sanitization process defined in `security-and-privacy.md`.
   - Reject unsafe or unreadable logos.
   - Do not assume that every invalid setting should silently fall back to default branding. Follow an approved error and fallback behaviour; if none exists, report the missing decision.

4. **Apply branding to the correct report**
   - Apply agency branding only to reports generated after the account has valid saved branding.
   - Preserve report content, section order, findings, and meaning.
   - Keep the required “Generated with WebAudX” attribution on every report, including branded reports.
   - A later branding change must not alter a PDF that has already been downloaded.
   - Do not alter report findings or questionnaire mappings as part of visual rendering.

5. **Generate the PDF**
   - Render the assembled report data without recalculating inspection results or questionnaire findings.
   - Match the on-screen report's content and section order.
   - Include the page and date context and the required footer.
   - Keep PDF download available without an account.
   - Do not add sections, promotional content, or features outside the approved product requirements.

6. **Handle storage and usage accounting**
   - Apply the anonymous and signed-in report storage rules from the project requirements.
   - Do not store anonymous PDFs when the product rules say they are not retained.
   - Do not count a PDF download as an inspection against the usage limit.
   - Do not create additional storage or retention behaviour.

7. **Verify the output**
   - Compare the PDF with the source report using this checklist:
     - All report sections are present in the required order.
     - Text, findings, recommendations, page address, and date/time match the source report.
     - The selected default or agency branding is applied.
     - The “Generated with WebAudX” footer is present.
     - No extra score, grade, verdict, or unapproved content appears.
   - Test default branding, valid agency branding, unsafe/unreadable logos, and the approved invalid-setting behaviour.
   - Test that branding changes affect new reports only and do not modify previously downloaded PDFs.
   - Test anonymous PDF download and the rule that PDF downloads do not count toward inspection limits.
   - Record any unavailable decision or missing test as a blocker or coverage gap.

## Expected output

A downloadable PDF that represents the assembled on-screen report, uses the applicable approved branding context, includes the required attribution, and follows the project's storage and usage rules.

## Completion criteria

PDF and branding work is verified only when the PDF matches the source report checklist, the applicable branding rules are followed, required download and storage behaviours pass their tests, and no unresolved branding decision has been replaced by an assumption.

## Related project guidance

Locate `product-scope.md`, `security-and-privacy.md`, `user-facing-content.md`, and `testing-and-acceptance.md` in the repository's documented rules location or project-provided files. Do not assume a directory path. If a referenced file is unavailable, report that fact. These rules define product, security, copy, and testing constraints; this skill defines the PDF and branding workflow.
