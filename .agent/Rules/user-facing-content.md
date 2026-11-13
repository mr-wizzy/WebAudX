# WebAudX User-Facing Content Rules

## 1. Authority and copy approval
- The current WebAudX PRD v1.0 is marked **Draft for approval**.
- Text in PRD Sections 12 and 13 is proposed source copy, not approved final copy, until the product owner explicitly approves it.
- Do not describe any user-facing text as approved unless that approval is recorded.
- Do not invent final product copy during implementation.
- The PRD requires every message shown to a user to appear in an approved text library before build.
- The approved text library's filename, location, and format have not been specified. Do not invent them. Ask the product owner to identify or approve the library location before implementation of user-facing copy.

## 2. Audience and plain-English standard
Write for website owners, small business owners, freelancers, and agency owners who may have no UX or technical knowledge and may use a phone.

For each user-facing message:
- Use short sentences.
- Express one main idea per sentence.
- Explain what happened in terms the user can understand.
- State one practical next step when the message describes a problem and a next step is known.
- Do not blame or embarrass the user.
- Do not exaggerate what WebAudX has checked or can conclude.

## 3. Technical language
Avoid technical terms in user-facing text, including:
- HTML.
- Meta tag.
- Viewport.
- H1.
- Alt text.
- SSL.
- Redirect.
- Crawl.
- Endpoint.
- HTTP status.

Use plain descriptions instead. Examples from the draft PRD:
- Avoid: `The viewport meta tag is missing.`
  Use: `The page does not set how phones display it.`
- Avoid: `The site returned a 404 error.`
  Use: `The page could not be found.`
- Avoid: `H1 count is zero.`
  Use: `The page does not have a clear main heading.`

These examples are proposed wording from the draft PRD and are not final approved copy until approved.

## 4. Evidence and accuracy
- Keep `Measured` results visually and verbally distinct from `Your answer`.
- Do not present a user's answer as an automated finding.
- Do not present an automated measurement as proof of overall quality.
- Do not imply WebAudX has completed a full or independent audit.
- Do not describe unmeasured behaviour as verified.
- When a check is limited or incomplete, state what could not be checked using the approved message.
- Do not invent findings, recommendations, measurements, or user answers.
- Do not use a score, grade, ranking, or pass/fail verdict.

## 5. Error-message rules
- Every error must explain what happened.
- Include a next step when the PRD provides one or the product owner has approved one.
- Use PRD Section 13 as the proposed source for defined error situations, pending copy approval.
- If a new error situation arises, do not invent a final message. Record the situation and propose wording for approval.
- Preserve approved placeholders exactly, including `[code]`, `[time]`, and `[name]`, unless the product owner approves a change.
- Do not expose stack traces, internal network details, private addresses, secrets, or implementation diagnostics to users.
- Do not create new error categories or change the meaning of an existing error without approval.

## 6. Copy review checklist
Before requesting approval for a user-facing message, verify each item:
1. The message uses words understandable to a non-technical website owner.
2. It contains no unexplained technical term from Section 3.
3. It explains one main idea.
4. It accurately describes what WebAudX knows and does not know.
5. It does not imply a full audit or independent verification.
6. If there is a known next step, the message states one practical next step.
7. It does not blame, alarm, or exaggerate.
8. It fits the intended interface location without truncation at the screen sizes approved for the product.

The PRD does not specify exact screen dimensions, browser versions, or an accessibility conformance standard. Do not invent those acceptance thresholds; request product-owner approval for them.

## 7. Consistency and maintenance
- Use the same approved wording for the same situation throughout the product.
- When approved copy changes, update the approved text library and every affected interface or report use in the same task.
- Check spelling, punctuation, placeholders, and terminology against the approved text library.
- Do not change copy solely for stylistic preference after approval.
- Do not put new user-facing copy into the product until it has been added to the identified approved text library and approval has been recorded.
