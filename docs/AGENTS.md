# AGENTS.md — WebAudX

## 1. What This Product Is

WebAudX is a lightweight webpage evaluation tool. It helps website owners, small businesses, freelancers and agencies review the clarity and usability of one webpage.

It combines:
- An automated check of one submitted webpage.
- Seven user questionnaire questions.
- Predefined rules for interpreting answers.
- A plain-English report.
- PDF download without an account.
- Optional agency branding through an account.

WebAudX is not a full professional website audit. Never describe it as one.

### Core user journey

1. User enters a webpage address.
2. WebAudX validates the address.
3. WebAudX runs the automated check.
4. User sees the check summary.
5. User answers seven questions.
6. User reviews and submits the answers.
7. WebAudX generates the report.
8. User downloads the PDF.
9. User may create an account to apply agency branding.

Branding must never be required before the user can see or download the initial report.

### Automated check

The automated check covers these 13 items:

1. Secure connection.
2. Whether the page loads.
3. Page title.
4. Search summary.
5. Main heading.
6. Heading structure.
7. Readable text.
8. Navigation menu.
9. Internal links and sampled broken links.
10. Action links and buttons.
11. Ways to contact the website.
12. Mobile display setting.
13. Image descriptions.

The check covers the submitted webpage and may sample up to 30 internal links for broken links. It follows no more than three redirects.

It reads the page as delivered. It must not execute the submitted webpage's scripts, submit forms, log in, or interact with the page.

If readable text is below 200 words:
- Mark the check as Limited.
- Mark the specified dependent measurements as Could not check.
- Remove suggestions that depend on unavailable measurements.
- Explain the limitation to the user.

### Questionnaire

There are exactly seven questions. Do not add, remove or rewrite questions without approval.

The four permitted answers are:
- Yes
- Partly
- No
- Not sure

Suggested answers are generated only for Questions 3, 5 and 7. Users can change suggestions before submitting.

All seven answers are required.

### Report rules

Keep these two information types visibly separate:

- **Measured:** results from the automated check.
- **Your answer:** the user's questionnaire responses.

Use the following answer mapping:

| Answer | Report section |
|---|---|
| Yes | What is working |
| Partly | Areas to improve |
| No | Areas to improve |
| Not sure | Needs further review |

Each question must have its own predefined finding and recommendation for each response.

- Yes: positive finding, no recommendation.
- Partly or No: finding and practical next step.
- Not sure: explain that the area needs further review and give a simple way to assess it.

If a user changes a suggested answer, the report must identify that change.

The report must not contain a numerical score, grade or pass/fail verdict.

Follow the ten-section report order defined in the PRD. Do not silently change the report structure.

### Important product definitions

Use these terms consistently:

- **V1:** The product version defined by the current approved WebAudX PRD.
- **Automated check:** The inspection of one submitted webpage and up to 30 sampled internal links.
- **Limited check:** A check where readable text is below 200 words and specified measurements cannot be completed.
- **Measured:** Information obtained from the automated inspection.
- **Your answer:** A user's response to one of the seven questionnaire questions.
- **Suggested answer:** A proposed questionnaire response generated from automated check results for Questions 3, 5 or 7.
- **Anonymous user:** A person using WebAudX without signing into an account.
- **Signed-in user:** A person authenticated through a WebAudX account.
- **Agency branding:** The agency name, logo, one brand colour and one approved font.
- **Report:** The generated assessment shown on screen. A PDF is an exported copy of that report.

The PRD is the source of truth for product behaviour, exact questions, report content, limits, error messages and acceptance criteria.

If a requirement is unclear or conflicts with another requirement, stop and ask for clarification. Do not silently invent a resolution.

---

## 2. Stack and Why

### Current decision

The WebAudX PRD does not specify an approved technology stack.

Do not treat TypeScript, React, Next.js, Node.js, PostgreSQL or any other technology as an approved project decision unless it has been explicitly selected.

Before making technical changes:

1. Inspect the existing repository.
2. Identify the framework, language, package manager, dependencies and project structure.
3. Read the existing setup and configuration files.
4. Preserve the established stack and conventions.

If the project has not selected a technology for a required capability, explain the available choices and recommend one with reasons. Wait for approval before introducing a new framework, database or major technology.

### Technical principles

Regardless of the approved stack:

- Run webpage inspection on the server, not in browser code exposed to the user.
- Never execute scripts belonging to the submitted webpage.
- Validate submitted addresses before making network requests.
- Prevent requests to private, local or internal addresses.
- Apply the same address restrictions to every redirect destination.
- Enforce the PRD's response-time, page-size and redirect limits.
- Keep inspection logic, questionnaire logic, report generation and PDF export separated.
- Keep sensitive credentials and server secrets out of frontend code.
- Do not introduce AI-generated analysis. It is outside V1.
- Do not store anonymous PDFs.
- Apply the PRD's account isolation, retention and deletion requirements.

Do not change the existing architecture simply because another approach is available.

---

## 3. Folder Conventions

The actual repository structure is authoritative.

Inspect the existing folders before creating, moving or renaming files. Do not recreate the project structure simply to match an example.

Use these logical responsibilities when organizing new code:

| Area | Responsibility |
|---|---|
| Application routes/pages | Screen routing and page composition |
| Components | Reusable interface elements |
| URL validation | Address format and safety validation |
| Website inspection | Server-side webpage checks |
| Questionnaire | Questions, answers and validation |
| Assessment | Suggested answers and predefined processing rules |
| Report | Report structure and content |
| PDF | PDF export |
| Branding | Account-based agency branding |
| Shared utilities | Reusable non-feature-specific functions |
| Types | Shared data and type definitions |
| Tests | Automated tests |

Keep code close to the feature it belongs to. Avoid placing unrelated functionality in one large file.

Do not create folders simply because they appear in an example. Create a folder when an approved implementation requires it.

---

## 4. Naming Conventions

Follow the existing repository's naming conventions first.

Where no convention exists, use:

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `ReportSummary` |
| Functions | camelCase | `validateAddress` |
| Variables | camelCase | `checkResult` |
| Constants | UPPER_SNAKE_CASE | `MAX_REDIRECTS` |
| Types and interfaces | PascalCase | `InspectionResult` |
| Test files | Match the tested file with a test suffix | `validate-address.test.ts` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |
| CSS classes | kebab-case | `report-summary` |

Use names that describe the actual responsibility of the code.

Do not use vague names such as `data`, `helper`, `stuff` or `manager` when a more specific name is possible.

Do not rename existing files or symbols solely to apply this table if doing so would create unnecessary changes or break existing references.

---

## 5. How to Run and Test

### Running the project

Never assume a command exists.

Before running the project:

1. Inspect the repository's package manager lockfile.
2. Inspect `package.json` or the equivalent project configuration.
3. Read the README and existing setup instructions.
4. Use the installation, development and build commands defined by the project.

Do not invent missing scripts or silently add scripts just to make an assumed command work.

If setup instructions are missing or incorrect, identify the problem before changing them.

### Testing requirements

Every implemented feature must be tested against its relevant acceptance criteria.

At minimum, cover the following areas:

**Address and inspection**
- Empty and invalid addresses.
- Automatic `https://` prefix behaviour.
- Unsupported protocols.
- Private, local and internal addresses.
- Redirects to prohibited destinations.
- Redirect limit.
- Page response-time and page-size limits.
- Inspection failures and error messages.
- All 13 measured items.
- Limited checks below 200 readable words.
- Removal of dependent suggestions when measurements are unavailable.

**Questionnaire and assessment**
- All seven questions.
- All four permitted answers.
- Required-answer validation.
- Suggestions for Questions 3, 5 and 7.
- User changes to suggested answers.
- All-Yes, all-Partly, all-No and all-Not-sure combinations.
- Mixed answer combinations.
- Correct predefined findings and recommendations.

**Report and PDF**
- Correct report section order.
- Clear separation between Measured and Your answer.
- Correct response-to-section mapping.
- Changed suggestions identified.
- No numerical score, grade or pass/fail verdict.
- PDF matches the on-screen report.
- Required date and footer are present.
- Anonymous PDF is not stored.

**Accounts and branding**
- Branding is optional.
- Account creation is offered only after the report is shown.
- Agency name length is limited to 60 characters.
- Only permitted logo formats are accepted.
- Logo size is under 1 MB.
- Only one brand colour is accepted.
- Font selection is restricted to the five approved fonts.
- Accounts cannot access another account's data.
- Deletion and retention rules are respected.

**Usage limits**
- 10 checks per 24 hours.
- A check counts once WebAudX contacts the page.
- Rejected addresses and unreachable pages do not count.
- Re-running an address counts as a new check.
- PDF downloads and branding changes do not count.

**Responsive behaviour**
- Test all seven screens on phone, tablet and desktop layouts.

Use the 26 acceptance tests in the PRD as the authoritative V1 acceptance checklist.

Do not report a test as passed unless it has actually been run and passed. If a test could not be run, state that explicitly.

Do not mark a feature complete while its required tests are failing or have not been run.

---

## 6. Off-Limits

The following are outside V1. Do not implement them unless the product owner explicitly approves a scope change.

- Multi-page website checking.
- Payments, pricing and subscriptions.
- Running scripts from submitted webpages.
- Reviewing content that only appears after those scripts run.
- Screenshots or visual analysis.
- Judgments of design quality, tone, persuasiveness or visitor behaviour.
- Numerical scores, grades or pass/fail verdicts.
- Copying the submitted website's logo or images.
- Report sharing through public links.
- Team accounts.
- Industry-specific or role-specific questionnaires.
- Additional questionnaire questions.
- Scheduled checks.
- Browser extensions.
- Mobile applications.
- Third-party integrations.
- AI-generated analysis.

### Security restrictions

These restrictions are mandatory:

- Never inspect private, local or internal addresses.
- Never follow a redirect to a private, local or internal address.
- Never execute scripts from a submitted webpage.
- Never submit forms or log in to a submitted webpage.
- Never expose server secrets or credentials in frontend code.
- Never log checked webpage content or user questionnaire answers.
- Never bypass the PRD's inspection limits.
- Identify WebAudX in inspection requests with a name and contact address.
- Preserve the landing-page notice that users should only review pages they own or have permission to review.

### Change control

Do not:

- Add product features outside the V1 PRD.
- Change the seven questions or their answer options.
- Change the predefined assessment rules.
- Change the report structure or response mapping.
- Replace the approved stack or architecture without approval.
- Add dependencies without first explaining their purpose and obtaining approval.
- Remove existing functionality without approval.
- Claim that planned, partially implemented or untested functionality is complete.

Visual and usability improvements are permitted only when they preserve the approved product flow, requirements and scope.

If a requested change affects product behaviour, security, data handling, cost, architecture or V1 scope, explain the impact and obtain approval before implementation.

---

## 7. Where to Look for More

Use these sources in this order:

1. **Current approved WebAudX PRD:** authoritative source for product requirements, user journey, inspection rules, questionnaire, report, limits, security and acceptance tests.
2. **Existing repository:** authoritative source for the actual technology stack, folder structure, dependencies, commands and implementation.
3. **README:** project setup, environment configuration and development instructions.
4. **Design specifications and approved assets:** authoritative source for approved visual design decisions.
5. **Task list or implementation plan:** current implementation priorities and task status.

Do not assume that a file exists because it is mentioned here. Check the repository.

### Open PRD decisions

The PRD contains decisions that must not be silently treated as finalized:

- Sign-in method.
- Signed-in report retention period.
- Whether the WebAudX footer can be removed in a future paid version.
- Final fonts, logo and colour.
- Reliability of theme-colour detection.
- Final approval of the plain-English text library.

Use only explicitly approved decisions. If an open decision blocks implementation, identify it and request a decision.

---

## 8. Release Roadmap & Scope Allocation

By explicit product owner approval, the scope allocation across versions is confirmed:

### Version 1.0 (Current MVP)
- Single-page clarity review based on 13 baseline checks and 7 questionnaire answers.
- 10-section report generation with zero scores or letter grades.
- PDF generation with standard watermark.
- Optional agency accounts and custom branding.
- Rate limits (10 checks per 24 hours).

### Version 1.1 (Static Quality & Governance Checks — Group A)
*Approved for development following v1.0 release.*
Expands automated page checks using lightweight static HTML parsing without script execution or external services:
1. **SEO Basics**: Canonical link tag verification and Search indexing / Robots directive (`meta name="robots"`).
2. **Form Accessibility**: Associated `<label>` verification for form inputs.
3. **Analytics Setup**: Detection of analytics tags (GA4, GTM, Meta Pixel, Plausible).
4. **Privacy Governance**: Visible Privacy Policy link verification.

### Version 2.0 (Deep Auditing & Infrastructure Expansion — Group B)
*Scheduled for v2.0 architectural expansion.*
Requires dynamic browser execution, multi-page crawling, or third-party service infrastructure:
1. Core Web Vitals and real page speed (LCP, CLS, INP via headless browser or PageSpeed API).
2. Deep accessibility auditing (WCAG AA/AAA color contrast, keyboard tab navigation, visible focus).
3. Interactive form testing (submitting test data and error validation).
4. Privacy consent and cookie banner verification (dynamic CMP evaluation).
5. Multi-page website auditing (crawling whole websites).
6. Cross-browser and real-device matrix testing.

---

### Final instruction

Build the product defined by the approved WebAudX PRD, within the existing approved technical architecture.

Do not guess, silently expand scope, invent requirements or claim unverified progress.

When uncertain, inspect the source documents and repository first. If the answer is still unclear, ask before making the change.
