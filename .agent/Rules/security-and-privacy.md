# WebAudX Security and Privacy Rules

## 1. Authority and approval
- The current WebAudX PRD v1.0 is marked **Draft for approval**. Its security and privacy requirements are proposed until approved.
- The requirements below restate the draft PRD and make implementation checks explicit. They do not authorize a weaker implementation.
- Technical choices not specified by the PRD must be reviewed and approved before implementation.
- The additional safeguards in this file are proposed implementation controls. They must not be represented as already implemented or as explicit PRD decisions.

## 2. Allowed address schemes
- Accept only `http://` and `https://` addresses.
- If an address has no scheme and passes format validation, the draft PRD specifies adding `https://` and showing the adjusted address to the user.
- Reject all other schemes and non-web resources.
- Do not fetch local files or use a browser or network protocol other than the approved HTTP/HTTPS inspection flow.

## 3. Prohibited network destinations
For this rule, a **prohibited destination** means any destination that resolves to or routes to:
- A loopback address.
- A private-use IPv4 or IPv6 address.
- A link-local address.
- An unspecified, reserved, multicast, or otherwise non-publicly routable address.
- A local-only hostname or internal service name.
- A cloud or hosting metadata service address.
- Any other destination that is not a publicly routable web destination.

This is an implementation definition proposed to make the PRD's phrase “private, local, or internal addresses” testable. Obtain product-owner and technical approval before treating this expanded definition as final.

## 4. Destination validation and redirects
- Validate the initial address before making a network request.
- Resolve hostnames and validate every resulting IP address before connecting. If a hostname resolves to a mixture of public and prohibited destinations, reject it.
- Prevent DNS rebinding and time-of-check/time-of-use gaps: the address actually used for the connection must be the address that was validated. Do not perform a fresh unvalidated resolution during connection.
- Revalidate every redirect destination before following it. Never follow a redirect into a prohibited destination.
- Follow no more than three redirects.
- Do not allow a redirect to change the request into a prohibited scheme or resource type.
- Do not treat a hostname as safe solely because its text looks public.
- Tests must demonstrate that prohibited destinations are rejected before a connection is made, including when reached through a redirect.
- The exact implementation mechanism must be selected through technical review; this file does not prescribe a library or framework.

## 5. Page inspection boundaries
- The primary target is one submitted page.
- The only additional destinations the draft PRD permits are up to 30 sampled internal links, solely for the broken-link measurement.
- The PRD does not define “internal link.” Do not choose same hostname, same origin, or same registrable domain as the definition without product-owner approval.
- Do not execute page scripts.
- Do not submit forms, log in, click controls, or interact with the page.
- Do not access private, local, or internal destinations, including redirect destinations and sampled-link destinations.
- Identify WebAudX in inspection requests with a name and contact address.
- The landing page must tell users to check only pages they own or have permission to review.

## 6. Enforced request limits
Enforce the draft PRD's limits:
- Page response time: 10 seconds.
- Page size: 2 MB.
- Redirects followed: no more than 3.
- Internal links sampled: no more than 30.
- Readable-text threshold: 200 words.
- Agency logo: under 1 MB.

The PRD does not specify whether the 10-second response limit applies per request or to the complete inspection. Do not silently choose; obtain approval before implementation.

The PRD does not specify whether the 2 MB page-size limit applies to the initial response body, decoded body, or another measurement. Do not silently choose; obtain technical and product-owner approval.

## 7. Check counting and rate limits
- The draft PRD specifies 10 checks per 24 hours.
- An **anonymous user** is a person using WebAudX without signing in.
- A **signed-in user** is a person authenticated to an individual WebAudX account.
- Anonymous users are limited per connection; signed-in users are limited per account.
- A check counts once WebAudX has contacted the page.
- Rejected addresses and unreachable pages do not count.
- Re-running the same address counts as a new check.
- Branding changes and PDF downloads do not count.
- When the limit is reached, show when the user can try again.

The PRD does not define:
- The exact technical identifier for an anonymous connection.
- Whether the 24-hour period is rolling or calendar-based.
- How shared networks, changing addresses, or proxy services affect anonymous limits.

Do not invent these definitions. Obtain approval and document the selected implementation before coding the rate-limit behaviour.

## 8. Data minimisation, retention and deletion
- For anonymous users, retain nothing after the session except information required to enforce the check limit.
- For signed-in users, branding and reports may be retained until deleted by the user, up to 12 months, subject to approval of the PRD's open retention decision.
- Users must be able to delete reports and their account. The draft PRD specifies completion within 30 days.
- Do not log checked page content or questionnaire answers.
- Do not collect or retain data that is not required by an approved product requirement.
- Do not store PDFs for anonymous users.
- Do not claim deletion is complete until the applicable deletion process has been verified.

## 9. Account isolation
- Accounts are offered only after a report is displayed and are used for report branding.
- Each account may access only its own branding and reports.
- Check account ownership and authorization on every operation that reads, changes, or deletes account data.
- Do not rely only on hiding interface controls to enforce access restrictions.
- Tests must attempt cross-account access and confirm that one account cannot read, change, or delete another account's data.
- Protect authentication tokens, secrets, and private configuration.

## 10. Logo upload safety
- Accept only PNG, JPG, or SVG files under 1 MB, as specified by the draft PRD.
- Validate the actual file content, not only the filename or declared content type.
- Reject unsupported, unsafe, or unreadable files and show the corresponding proposed plain-English message.
- SVG files must be processed so that scripts and untrusted external content cannot execute or load when the logo is displayed.
- Tests must cover a valid file, unsupported format, oversized file, unreadable file, and SVG content containing active or external content.
- The PRD does not specify an SVG sanitization library or storage location. Do not select either without technical review and approval.

## 11. Logging and error disclosure
- Operational logs must not contain checked page content or questionnaire answers.
- Do not expose private addresses, internal network details, secrets, stack traces, or sensitive implementation details in user-facing errors.
- Log only fields explicitly approved for operational diagnosis and rate-limit enforcement.
- The PRD does not enumerate permitted log fields. Define and approve that field list before implementing persistent operational logging.
- Do not claim that a page is safe, secure, or fully audited based only on the WebAudX check.

## 12. Proposed additional safeguards
The following are implementation safeguards proposed to support the PRD's security intent. They are not additional product features:
- Do not increase request volume beyond the specified page and link limits through retries or background jobs.
- Do not make concurrent requests as a way to bypass request or check limits.
- Do not expose internal network diagnostics to the user.
- Apply the same destination restrictions to the primary page, redirect targets, and sampled internal links.

Any change to these safeguards must be reviewed against the security requirements and explicitly approved.
