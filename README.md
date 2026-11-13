# WebAudX

> **Plain-English Webpage Clarity & Usability Reviews**

WebAudX is a lightweight website evaluation tool designed for small business owners, freelancers, and digital agencies. Instead of overwhelming users with dense technical metrics or confusing jargon, WebAudX reviews the clarity, navigation, and usability of a single webpage in minutes.

---

## 📌 Project Overview

WebAudX combines an **automated technical scan** with a **7-question guided user review** to produce an actionable, plain-English report and downloadable PDF.

* **Single-Page Clarity Review:** Focuses on the user experience of one webpage as delivered. It does not run scripts or crawl entire websites.
* **Separation of Evidence:** The generated report strictly distinguishes between **"Measured"** (automated checks) and **"Your answer"** (the reviewer's qualitative judgment).
* **No Jargon or Arbitrary Scores:** Avoids technical acronyms (no mentions of `H1`, `viewport`, `SSL`, or `meta tags`) and eliminates confusing percentage grades or pass/fail verdicts in favor of practical next steps.
* **Free & Open Access:** Up to 10 reviews every 24 hours without requiring payment or an account.
* **Optional Agency Branding:** Agencies and freelancers can optionally sign in with email to apply custom agency branding (agency name, custom logo under 1 MB, brand color, and white-labeled PDF exports).

---

## 🚀 The Core Flow

```
Webpage Address ───► Automated Check ───► 7 Guided Questions ───► Plain-English Report ───► PDF Download
 (HTTP/HTTPS only)     (13 key items)      (With smart clues)     (Working / Areas to fix)    (Free or Branded)
```

1. **Address Input:** Accepts any web address, automatically normalizes `example.com` to `https://example.com`, and blocks private or internal network destinations (SSRF protection).
2. **Automated Check:** Measures 13 foundational items: secure connection, page load, title, search summary, headings, word count, navigation menus, broken internal links, call-to-action buttons, contact methods, mobile display setting, and image descriptions.
3. **Seven Guided Questions:** Quick questions covering first impression, messaging, navigation, visual hierarchy, next steps, user experience, and mobile usability.
4. **Actionable Report:** Deterministically categorizes results into *"What is working"*, *"Areas to improve"*, and *"Needs further review"*.
5. **PDF Export:** Immediate PDF download featuring the standard *"Generated with WebAudX"* watermark, with optional agency re-branding.

---

## 🛠️ Tech Stack

This project is built following strict simplicity, security, and design-token guidelines with **zero unnecessary runtime dependencies**:

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Markup & Structure** | **HTML5** | Semantic, accessible, and responsive markup across mobile, tablet, and desktop viewports. |
| **Styling** | **CSS3 & Design Tokens** | Custom CSS variables mapped 1:1 to Figma tokens defined in `assets/WebAudX-design-tokens.tokens.json`. |
| **Typography** | **Google Fonts** | `Montserrat` (700/800) for all headings; `Inter` (400/500/600) for body copy. |
| **Colors** | **Design System** | Brand Violet (`#8306c1` primary-400), Deep Violet (`#5a0484`), Lavender tint (`#dfd4e6`), and Neutral shades. |
| **Interactivity** | **Vanilla JavaScript (ES6+)** | Client-side format validation, auto-prefixing, state switching, and error simulation without heavy frameworks. |
| **Local Server** | **Python 3** | Lightweight built-in `http.server` for local serving. |
| **Version Control** | **Git & GitHub** | Hosted at [github.com/mr-wizzy/WebAudX](https://github.com/mr-wizzy/WebAudX). |

---

## 📂 Project Structure

```text
WebAudX/
├── .agent/
│   ├── Rules/            # Guardrails for architecture, scope, security, testing & copy
│   └── Skills/           # Execution workflows for inspection, questionnaire & branding
├── assets/
│   ├── WebAudX-design-tokens.tokens.json  # Official Figma design tokens
│   ├── WebAudX-logo.png                   # Primary brand logo
│   └── WebAudX-favicon.png                # Brand favicon
├── docs/
│   └── AGENTS.md                          # Engineering and agent specifications
├── index.html                             # WebAudX landing page
├── signup.html                            # Agency sign-in & branding setup screen
├── WebAudX_PRD_v1.0.md                    # Product Requirements Document (PRD v1.0)
├── .gitignore                             # Ignored files
└── README.md                              # Project documentation
```

---

## 💻 Getting Started Locally

No installation or build step (`npm install` / `build`) is required.

### 1. Clone the repository
```bash
git clone https://github.com/mr-wizzy/WebAudX.git
cd WebAudX
```

### 2. Start a local server
Using Python's built-in server:
```bash
python -m http.server 3000
```

### 3. Open in your browser
* **Landing Page:** [http://localhost:3000/index.html](http://localhost:3000/index.html) (or `http://localhost:3000/`)
* **Agency Sign-In Screen:** [http://localhost:3000/signup.html](http://localhost:3000/signup.html)

*(You can also double-click `index.html` to open it directly via `file://` in any modern web browser).*

---

## 📄 Product Specifications & Governance

For full product rules and acceptance criteria, please review:
* [Product Requirements Document (PRD v1.0)](WebAudX_PRD_v1.0.md)
* [Agent Guidelines](docs/AGENTS.md)
* [Design Tokens](assets/WebAudX-design-tokens.tokens.json)

---

## ⚖️ License & Attribution

&copy; 2026 Prosion Technology Limited. All rights reserved. Every generated report carries the attribution **"Generated with WebAudX"**.
