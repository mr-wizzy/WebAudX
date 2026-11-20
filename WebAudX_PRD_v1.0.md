# WebAudX: Product Requirements Document, Version 1.0

**Status:** Draft for approval
**Owner:** Mr Whizzy, Prosion Technology Limited

---

## 1. Overview

WebAudX helps a user review the clarity and usability of one web page. The user enters the page's address. WebAudX runs an automated check of that page, asks seven questions, and produces a plain-English report.

The report keeps two kinds of information separate:

- **Measured:** results from the automated check.
- **Your answer:** judgments from the user's answers.

WebAudX is not a full audit. Every report says so.

**Core flow:** Address → Automated check → Seven questions → Predefined rules → Report → PDF → (optional) Branding with account

---

## 2. Users

- **Website owners and small business owners:** want to know what to fix first.
- **Agency owners and freelancers:** want a branded report to share with clients and prospects.

Assume users have no UX or technical knowledge and may use a phone.

---

## 3. User Journey

1. The user opens WebAudX and reads what it checks and what it does not.
2. The user enters a page address.
3. WebAudX checks the format and asks for a correction if needed.
4. WebAudX runs the automated check, with a progress screen.
5. The user sees the check summary, in plain English, or the reason the check could not complete.
6. The user answers seven questions. Questions 3, 5, and 7 show a suggested answer from the check. The user may keep or change it.
7. The user reviews answers and submits. Unanswered questions are highlighted.
8. The user views the report.
9. The user downloads a PDF. No account is needed.
10. Optionally, the user creates an account to brand the report and downloads a branded PDF.

Branding is never required before a result is shown.

---

## 4. Address Input

- The address is required.
- Addresses without `https://` are accepted, and the prefix is added automatically. The adjusted address is shown.
- Only `http://` and `https://` addresses are accepted.
- Validation checks format only. The automated check confirms the page is live.
- The address appears in the report and the PDF.

---

## 5. Automated Check

### 5.1 Scope

- One page: the submitted address, following up to 3 redirects.
- The check reads the page as delivered. It does not run the page's scripts. Content that appears only after scripts run is not measured.
- The check does not submit forms, log in, or interact with the page.
- The only other pages it touches are up to 30 internal links, sampled for broken links.

### 5.2 Measured items

| # | Item | What is recorded | Used for |
|---|---|---|---|
| 1 | Secure connection | Whether the final address is secure | Report |
| 2 | Page loads | Whether a normal page was returned | Check status |
| 3 | Page title | Whether a title exists, and its text | Question 1 |
| 4 | Search summary | Whether a short page summary exists, and its text | Questions 1 and 2 |
| 5 | Main heading | Number and text of main headings | Questions 1 and 2 |
| 6 | Heading structure | Order of headings | Question 4 |
| 7 | Readable text | Approximate visible word count | Check status |
| 8 | Navigation menu | Whether a menu of links exists | Question 3 |
| 9 | Internal links | Number of links to the same site, and how many of 30 sampled links are broken | Question 3 |
| 10 | Action links and buttons | Number using action wording (contact, book, buy, get started, call, request, sign up, subscribe, download, shop) | Question 5 |
| 11 | Ways to contact | Whether a phone link, email link, or contact form exists | Question 5 |
| 12 | Mobile display setting | Whether the page sets how phones size it | Question 7 |
| 13 | Image descriptions | Share of images with a text description | Report |

### 5.3 Suggested answers

| Question | Suggested Yes | Suggested Partly | Suggested No |
|---|---|---|---|
| 3. Navigation | Menu exists (8) and no sampled links are broken (9) | Menu exists but some links are broken, or no menu but other links exist | No menu and no internal links |
| 5. Call to action | Action links or buttons (10) and a way to contact (11) | Action links without a way to contact, or a way to contact without action links | No action links and no way to contact |
| 7. Mobile experience | Mobile display setting exists (12) | Not suggested | Mobile display setting missing (12) |

Suggestions are not shown when the check did not complete or the page is limited.

### 5.4 Limited content

If the page has fewer than **200 words** of readable text, the check is marked **Limited**. Items 3 to 7 and 10 are then marked **Could not check**, suggestions for dependent questions are removed, and the user is told why in plain English.

### 5.5 Check statuses

Each measured item shows one status: **Good**, **Needs attention**, or **Could not check**, with a one-sentence plain-English explanation.

---

## 6. Questionnaire

Seven required questions. Each has the same four answers: **Yes, Partly, No, Not sure**.

| No. | Area | Question | Evidence shown |
|---:|---|---|---|
| 1 | First impression | Can a first-time visitor quickly understand what this website is about? | Title, main heading, summary |
| 2 | Messaging | Can a visitor understand what is being offered and who it is for? | Main heading, summary |
| 3 | Navigation | Can a visitor easily find the information they are looking for? | Suggested answer |
| 4 | Visual hierarchy | Are the most important information and elements easy to notice? | Heading structure |
| 5 | Call to action | Is it clear what the visitor should do next? | Suggested answer |
| 6 | User experience | Can a visitor use the website without unnecessary confusion? | None |
| 7 | Mobile experience | Is the website easy to understand and use on a mobile device? | Suggested answer |

- Evidence appears beside each question under "What we found on the page."
- All seven answers are required before the report is created.
- The user can change answers before submitting.
- No questions are added in this version.

---

## 7. Processing Rules

| Answer | Report section |
|---|---|
| Yes | What is working |
| Partly | Areas to improve |
| No | Areas to improve |
| Not sure | Needs further review |

- Each question has its own predefined finding and recommendation for each answer. No two questions share a recommendation.
- **Yes:** a short positive finding. No recommendation.
- **Partly or No:** a finding and a practical next step.
- **Not sure:** a note that the area could not be confidently assessed, and a simple way to check it.
- Where a check result supports a finding, the finding states it in plain English.
- Where the user changed a suggested answer, the report says so.
- The summary describes the pattern of answers in plain English. It contains no score, grade, or pass/fail verdict.
- The report may say "5 of 8 checks were good." It must not combine these into one score.

---

## 8. Report

Shown on screen and in the PDF, in this order:

1. Page reviewed: the address, the final address if redirected, and the date and time.
2. Check status: complete, limited, or not completed, with the reason if not completed.
3. Summary.
4. Check results, each marked Good, Needs attention, or Could not check.
5. What is working.
6. Areas to improve, with findings and next steps.
7. Needs further review.
8. Changed suggestions.
9. A one-line note that checking multiple pages will come in a future version.
10. About this report: it combines an automated check of one page with the user's answers, it is not a full or independent audit, and it reflects the page on the date shown.

"Measured" and "Your answer" must be visibly different.

---

## 9. PDF Export

- Every report can be downloaded as a PDF without an account.
- The PDF matches the on-screen report and includes the date and the footer "Generated with WebAudX."
- WebAudX does not store PDFs for users without an account.
- Downloading a PDF does not count against the limit.

---

## 10. Accounts and Branding

### 10.1 Accounts

- An account is needed only to brand reports.
- Sign-in uses email.
- Accounts are offered after a report is shown, never before.
- Each account sees only its own branding and reports.

### 10.2 Agency branding

| Setting | Rule |
|---|---|
| Agency name | Up to 60 characters. Shown as "Prepared by [name]." |
| Logo | PNG, JPG, or SVG, under 1 MB. Shown in the report header. |
| Brand colour | One colour. Used for headings and accents. |
| Font | One of five approved fonts. |

- Branding applies to new reports and PDFs. Previously downloaded PDFs do not change.
- Unsafe or unreadable logo files are rejected with a plain-English message.

### 10.3 Default branding (no account)

- The header and footer use the WebAudX name and logo.
- If the page has a theme colour, it is used as the accent colour. Otherwise WebAudX's colour is used.
- The site's address and title identify the page reviewed.
- The site's logo and images are not copied into the report.

### 10.4 Footer

- "Generated with WebAudX" appears on every report, including branded ones.

---

## 11. Limits and Data

- **Checks:** 10 per 24 hours.
- Anonymous users are limited per connection. Signed-in users are limited per account.
- A check counts once WebAudX has contacted the page. Rejected addresses and unreachable pages do not count.
- Re-running the same address counts as a new check.
- Changing branding and downloading PDFs do not count.
- When the limit is reached, the user sees when they can try again.

**Other limits:**

| Limit | Value |
|---|---|
| Page response time | 10 seconds |
| Page size | 2 MB |
| Redirects followed | 3 |
| Internal links sampled | 30 |
| Readable-text threshold | 200 words |
| Logo size | 1 MB |

**Data:**

- Anonymous users: nothing is kept after the session beyond what the limit needs.
- Signed-in users: branding and reports are kept until deleted by the user, up to 12 months.
- Users can delete reports and their account. Deletion completes within 30 days.
- Operational logs must not contain checked page content or user answers.

**Safety:**

- WebAudX does not check private, local, or internal addresses, including any address a page redirects to.
- WebAudX does not run the checked page's scripts.
- WebAudX identifies itself in its requests with a name and contact address.
- The landing page states that WebAudX should only be used on pages the user owns or has permission to review.

---

## 12. Plain English

Every user-facing word must be understandable without technical training.

- No technical terms in user-facing text, such as HTML, meta tag, viewport, H1, alt text, SSL, redirect, crawl, endpoint, or HTTP status.
- Describe what the user will see, not how it was measured.
- Use short sentences. One idea per sentence.
- Give one next step where possible.
- Every message shown to a user must appear in the approved text library before build.

| Avoid | Use |
|---|---|
| The viewport meta tag is missing. | The page does not set how phones display it. |
| The site returned a 404 error. | The page could not be found. |
| H1 count is zero. | The page does not have a clear main heading. |

---

## 13. Error Messages

Every error explains what happened and what to do next. The assessment continues after any check failure, and the report says what was skipped.

**Address**

| Situation | Message |
|---|---|
| Empty | "Please enter the address of the page you want to review." |
| Wrong format | "This doesn't look like a web address. Check for typing mistakes, such as yourwebsite.com." |
| Not http or https | "WebAudX can only review web pages that start with http:// or https://." |

**Check**

| Situation | Message |
|---|---|
| Address not found | "We could not find this website. Check the address and try again." |
| Too slow | "The page took too long to respond. It may be slow or temporarily unavailable." |
| Blocks automated checks | "This website does not allow automated checks. You can still answer the questions yourself." |
| Error page returned | "The page could not be loaded (error code [code]). Open the address in your browser to check it." |
| File, not a page | "This address leads to a file rather than a web page, so it could not be reviewed." |
| Too large | "This page is too large for WebAudX to review." |
| Redirect loop | "This address keeps sending us elsewhere, so we could not reach the page." |
| Private or local address | "This address cannot be reviewed." |
| Very little text | "We could read only a small amount of text on this page. Some websites load content in ways WebAudX cannot read, so some results are missing." |
| Unexpected error | "Something went wrong while reviewing the page. Please try again in a few minutes." |

**Account and branding**

| Situation | Message |
|---|---|
| Sign-in link expired | "This sign-in link has expired. Request a new one." |
| Logo too large | "This logo is larger than 1 MB. Please upload a smaller file." |
| Logo type not allowed | "Please upload a PNG, JPG, or SVG file." |
| Branding not saved | "Your branding could not be saved. Your changes have not been lost. Please try again." |

**Limits and system**

| Situation | Message |
|---|---|
| Daily limit reached | "You have used your 10 checks for today. You can run another check after [time]." |
| Service unavailable | "WebAudX is temporarily unavailable. Please try again shortly." |
| PDF failed | "We could not create your PDF. Please try again." |

---

## 14. Screens

| Screen | Purpose |
|---|---|
| Landing | Explain WebAudX and collect the address |
| Check progress | Show the check is running |
| Check summary | Show what was measured, or why not |
| Questions | Seven answers, with evidence and suggestions |
| Review | Show answers and missing items |
| Report | Show the report, with PDF download and "Brand this report" |
| Account and branding | Reached only from the report |

All screens work on phones, tablets, and desktops. Each screen has one main task. No animation or dashboard is required.

---

## 15. Out of Scope for V1

- Multi-page checking (future paid feature).
- Payments, pricing, and subscriptions.
- Running the page's scripts or reviewing content that loads only after scripts run.
- Screenshots or visual analysis.
- Judgments of design, tone, persuasiveness, or visitor behaviour.
- Scores, grades, or pass/fail verdicts.
- Copying the checked site's logo or images.
- Report sharing by link.
- Team accounts.
- Industry-specific or role-specific questionnaires.
- Questions beyond the seven.
- Re-checks on a schedule.
- Browser extensions, mobile apps, and third-party integrations.
- AI-generated analysis.

---

## 16. Acceptance Tests

**Core journey**

1. A user can understand what WebAudX checks from the landing page.
2. A user can complete the journey and download a PDF without an account.
3. A user can create an account from the report and set branding.
4. A branded PDF shows the agency's name, logo, colour, and font, and still shows "Generated with WebAudX."
5. The user cannot submit with an unanswered question.
6. A changed suggestion appears in the report.

**Report**

7. All "Yes" answers produce "What is working" with no recommendations.
8. All "Partly" answers produce all seven areas under "Areas to improve."
9. All "No" answers produce all seven areas under "Areas to improve."
10. All "Not sure" answers produce all seven areas under "Needs further review."
11. Mixed answers appear in the correct section.
12. No two questions share a recommendation.
13. The report contains no score, grade, or verdict, and states that it is not a full audit.

**Address and check**

14. An empty address cannot be submitted.
15. An address without a prefix is accepted with `https://` added.
16. A private or local address is not checked, and the user sees the message in Section 13.
17. A standard page completes all 13 items and shows suggestions for Questions 3, 5, and 7.
18. A page under 200 words is marked Limited, and dependent suggestions are removed.
19. Each failure in Section 13 shows its message and lets the user continue.
20. At least three live sites built with common website builders are tested, and results recorded.

**Limits and accounts**

21. The eleventh check within 24 hours is refused, with the time to retry.
22. A check rejected before contacting the page does not count.
23. Logos over 1 MB or of an unsupported type are rejected.
24. Each account sees only its own data.
25. Deleted reports and accounts are removed within 30 days.

**Responsiveness**

26. All screens work on a phone, a tablet, and a desktop.

---

## 17. Open Decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | Sign-in method | Email sign-in link, no password |
| 2 | Report retention for signed-in users | 12 months |
| 3 | Whether the footer can be removed on a future paid tier | Decide before pricing |
| 4 | Final fonts, logo, and colour | Confirm with design |
| 5 | Reliability of theme colour detection | Test on 20 live pages before launch |
| 6 | Final plain-English text library | Approve before build |

---

## 18. Product Roadmap and Versioning

### 18.1 Version 1.0 (Current MVP Release)
- The approved 13 automated checks and 7 usability questions.
- Address input with HTTPS auto-prefixing and SSRF defense.
- Deterministic 10-section report generation with zero numerical scores, letter grades, or pass/fail verdicts.
- Anonymous and branded client-side printable PDF generation with "Generated with WebAudX" watermark.
- Optional agency accounts with custom branding (name, logo, brand colour, font).
- Rate limiting of 10 checks per 24 hours per connection/account.

### 18.2 Version 1.1 (Static Quality and Governance Checks — Group A)
*Status: Explicitly approved by product owner for v1.1 implementation following v1.0 release.*
Expands automated page checks while strictly adhering to the zero-script, safe-inspection architecture:
1. **SEO Basics (Canonical & Search Indexing Directives)**:
   - Check if `<link rel="canonical" href="...">` is present and valid.
   - Check `<meta name="robots" content="...">` for restrictive indexing directives (e.g. `noindex`).
2. **Form Accessibility**:
   - Check whether input fields (`<input>`, `<select>`, `<textarea>`) have associated `<label>` tags or `aria-label` attributes for screen readers.
3. **Analytics and Conversion Setup**:
   - Check for the presence of standard analytics and tracking tags (Google Analytics 4 / Google Tag Manager `gtag.js`, Meta Pixel, Plausible) in delivered HTML.
4. **Privacy Governance**:
   - Check whether the page provides a visible link to a Privacy Policy (link or anchor text matching `/privacy` or "Privacy Policy").

### 18.3 Version 2.0 (Deep Auditing and Infrastructure Expansion — Group B)
*Status: Scheduled for v2.0 architectural expansion.*
These capabilities require dynamic browser execution, multi-page crawling, or third-party service infrastructure:
1. **Core Web Vitals and Real Page Speed**:
   - Automated measurement of Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP) via headless browser execution or Google PageSpeed Insights API integration.
2. **Deep Accessibility Auditing**:
   - Automated WCAG AA/AAA color contrast ratio verification, keyboard tab order, and visible focus indicator checks.
3. **Interactive Form Testing**:
   - Automated validation testing and submission testing on public forms.
4. **Privacy Consent and Cookie Banner Verification**:
   - Dynamic evaluation of client-side Consent Management Platforms (CMPs) and cookie banner execution.
5. **Multi-Page Website Auditing**:
   - Crawling and aggregating scores/findings across entire sites or multi-page sitemaps.
6. **Cross-Browser and Real-Device Matrix Testing**:
   - Automated layout rendering verification across real phone/tablet hardware and multiple browser rendering engines (WebKit, Blink, Gecko).

