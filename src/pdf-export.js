/**
 * WebAudX PDF Export Engine Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 9 (PDF Export)
 * - WebAudX PRD v1.0 Section 10.4 (Footer Watermark)
 * - User Direction: Exclude page header & app footer, brand footer with logo and contact info: "08168076603"
 * - Acceptance Test 2 (Instantaneous PDF download without an account)
 * - Acceptance Test 4 & 13
 * - Approved copy from docs/copy-library.json
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const copyLibrary = require('../docs/copy-library.json');
    module.exports = factory(copyLibrary);
  } else {
    root.WebAudXPDFExport = factory(root.WebAudXCopyLibrary || null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (copyLib) {

  const copyPdf = (copyLib && copyLib.pdf) ? copyLib.pdf : {
    watermark: 'Generated with WebAudX',
    contact_developer: 'For custom web development, contact: 08168076603',
    phone_number: '08168076603',
    download_button: 'Download PDF',
    report_header_subtitle: 'Single-Page Clarity & Usability Evaluation'
  };

  const PDF_CONFIG = {
    watermark: copyPdf.watermark,
    contactText: copyPdf.contact_developer,
    phoneNumber: copyPdf.phone_number,
    logoSrc: 'assets/WebAudX-logo.png',
    logoAlt: 'WebAudX Logo'
  };

  /**
   * Escape HTML utility to prevent injection in generated documents.
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Parse hex string into { r, g, b } components.
   */
  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return { r: 131, g: 6, b: 193 };
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num) || clean.length !== 6) return { r: 131, g: 6, b: 193 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  /**
   * Derive a coordinated theme color palette from an agency's selected brand accent color.
   */
  function getThemePalette(brandColor) {
    const color = (brandColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(brandColor.trim()))
      ? brandColor.trim()
      : '#8306c1';
    const { r, g, b } = hexToRgb(color);

    const bgLight = `rgba(${r}, ${g}, ${b}, 0.06)`;
    const badgeBg = `rgba(${r}, ${g}, ${b}, 0.12)`;
    const border = `rgba(${r}, ${g}, ${b}, 0.22)`;
    const borderDashed = `rgba(${r}, ${g}, ${b}, 0.35)`;
    const rDark = Math.max(0, Math.round(r * 0.72));
    const gDark = Math.max(0, Math.round(g * 0.72));
    const bDark = Math.max(0, Math.round(b * 0.72));
    const darkText = `rgb(${rDark}, ${gDark}, ${bDark})`;

    return {
      primary: color,
      bgLight,
      badgeBg,
      border,
      borderDashed,
      darkText
    };
  }

  /**
   * Check whether an output has agency custom branding applied.
   */
  function isAgencyBranded(customBranding) {
    if (!customBranding) return false;
    return Boolean(
      (customBranding.agencyName && customBranding.agencyName.trim().length > 0) ||
      customBranding.logo ||
      (customBranding.brandColor && customBranding.brandColor.toLowerCase() !== '#8306c1') ||
      (customBranding.contactEmail && customBranding.contactEmail.trim().length > 0) ||
      (customBranding.contactPhone && customBranding.contactPhone.trim().length > 0)
    );
  }

  /**
   * Generates clean CSS for print and PDF export.
   * Ensures:
   * 1. Top navigation header and generic app footer are excluded.
   * 2. Interactive action buttons (toolbars) are excluded.
   * 3. Repeating branded footer with custom web development contact appears on each printed page.
   * 4. For agency branded outputs, theme dynamically adopts agency brand color.
   * 5. Page breaks are handled cleanly without splitting findings across pages.
   */
  function getPrintStyles(customBranding) {
    const fontFamily = (customBranding && customBranding.font)
      ? `'${customBranding.font}', sans-serif`
      : `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const brandColor = (customBranding && customBranding.brandColor)
      ? customBranding.brandColor
      : '#8306c1';
    const palette = getThemePalette(brandColor);

    return `
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 16mm 14mm;
      }

      @media print {
        /* 1. Strictly exclude top site navigation header and generic app footer */
        header,
        footer,
        .brand-link,
        .btn-ghost,
        .report-toolbar,
        .questionnaire-actions-bar,
        .review-actions-bar,
        .btn-submit,
        .btn-secondary,
        #screen-landing,
        #screen-progress,
        #screen-summary,
        #screen-questions,
        #screen-review,
        .no-print {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        body {
          background: #ffffff !important;
          color: #17171d !important;
          font-family: ${fontFamily} !important;
          font-size: 10pt !important;
          line-height: 1.4 !important;
          margin: 0 !important;
          padding: 0 0 45pt 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        #screen-report,
        .report-section {
          display: block !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Dedicated Print Report Header */
        .pdf-print-header {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid ${palette.primary};
          padding-bottom: 8pt;
          margin-bottom: 12pt;
        }

        .pdf-print-header img {
          max-height: 28pt;
          width: auto;
        }

        .pdf-print-header-meta {
          text-align: right;
          font-size: 8pt;
          color: #68687a;
        }

        /* Report Cards in Print */
        .report-card {
          background: #ffffff !important;
          border: 1px solid ${palette.border} !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          padding: 10pt 12pt !important;
          margin-bottom: 10pt !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .finding-item-box {
          border: 1px solid ${palette.border} !important;
          background: #fbfbfe !important;
          border-radius: 6px !important;
          padding: 8pt !important;
          margin-bottom: 6pt !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .finding-recommendation-box,
        .finding-checkmethod-box {
          border-radius: 4px !important;
          padding: 6pt !important;
          margin-top: 4pt !important;
          font-size: 9pt !important;
        }

        .finding-recommendation-box {
          background: ${palette.bgLight} !important;
          border-left: 2px solid ${palette.primary} !important;
        }

        .finding-recommendation-box strong {
          color: ${palette.darkText} !important;
        }

        /* 2. Branded Footer for every printed page */
        .pdf-print-page-footer {
          display: flex !important;
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 30pt !important;
          border-top: 1px solid ${palette.border} !important;
          background: #ffffff !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 4pt 0 0 0 !important;
          font-size: 8pt !important;
          color: #4a4a58 !important;
          z-index: 99999 !important;
        }

        .pdf-footer-brand-side {
          display: flex;
          align-items: center;
          gap: 6pt;
        }

        .pdf-footer-logo {
          max-height: 18pt;
          width: auto;
        }

        .pdf-footer-watermark {
          font-weight: 700;
          color: ${palette.primary};
        }

        .pdf-footer-contact-side {
          text-align: right;
        }

        .pdf-footer-contact-text {
          color: #17171d;
          font-weight: 500;
        }

        .pdf-footer-phone-number {
          font-weight: 700;
          color: ${palette.primary};
        }
      }
    `;
  }

  /**
   * Builds the branded PDF page footer HTML.
   * Displays:
   * - Unbranded: WebAudX logo + "Generated with WebAudX"
   * - Agency Branded: Logo removed, leaving only the tool name "WebAudX"
   * - Contact for custom web development with phone
   */
  function buildPdfFooterHtml(customBranding) {
    const phone = (customBranding && customBranding.contactPhone) ? customBranding.contactPhone : PDF_CONFIG.phoneNumber;
    const contactText = `For custom web development, contact: ${phone}`;
    const brandColor = (customBranding && customBranding.brandColor) || '#8306c1';
    const palette = getThemePalette(brandColor);
    const branded = isAgencyBranded(customBranding);

    // For agency branded outputs, remove the logo from the footer of every page. Leave only the tool name: WebAudX.
    const brandSideHtml = branded
      ? `<span class="pdf-footer-watermark" style="font-weight: 700; color: ${escapeHtml(palette.primary)};">WebAudX</span>`
      : `
        <img src="${escapeHtml(PDF_CONFIG.logoSrc)}" alt="${escapeHtml(PDF_CONFIG.logoAlt)}" class="pdf-footer-logo" />
        <span class="pdf-footer-watermark" style="font-weight: 700; color: ${escapeHtml(palette.primary)};">${escapeHtml(PDF_CONFIG.watermark)}</span>
      `;

    return `
      <div class="pdf-print-page-footer" id="pdf-branded-footer" style="border-top-color: ${escapeHtml(palette.border)};">
        <div class="pdf-footer-brand-side">
          ${brandSideHtml}
        </div>
        <div class="pdf-footer-contact-side">
          <span class="pdf-footer-contact-text">${escapeHtml(contactText)}</span>
        </div>
      </div>
    `.trim();
  }

  /**
   * Builds the clean PDF page header HTML.
   * Replaces top navigation with a professional audit report title bar.
   */
  function buildPdfHeaderHtml(report, customBranding) {
    const submittedAddress = (report && report.sections && report.sections.pageReviewed)
      ? report.sections.pageReviewed.submittedAddress
      : 'Webpage Review';
    const formattedDate = (report && report.sections && report.sections.pageReviewed)
      ? report.sections.pageReviewed.formattedDate
      : new Date().toLocaleDateString();

    const headerLogo = (customBranding && customBranding.logo)
      ? customBranding.logo
      : PDF_CONFIG.logoSrc;
    const headerLogoAlt = (customBranding && customBranding.agencyName)
      ? (customBranding.agencyName + ' Logo')
      : PDF_CONFIG.logoAlt;

    const brandColor = (customBranding && customBranding.brandColor) || '#8306c1';
    const preparedByHtml = (customBranding && customBranding.agencyName)
      ? `<div style="font-size: 8.5pt; font-weight: 600; color: ${escapeHtml(brandColor)};">Prepared by ${escapeHtml(customBranding.agencyName)}</div>`
      : '';

    const contactParts = [];
    if (customBranding && customBranding.contactEmail) contactParts.push(escapeHtml(customBranding.contactEmail));
    if (customBranding && customBranding.contactPhone) contactParts.push(escapeHtml(customBranding.contactPhone));
    const contactMetaHtml = contactParts.length > 0
      ? `<div style="font-size: 8pt; color: #4a4a58;">Contact: ${contactParts.join(' &bull; ')}</div>`
      : '';

    return `
      <div class="pdf-print-header" id="pdf-branded-header" style="border-bottom-color: ${escapeHtml(brandColor)};">
        <div>
          <img src="${escapeHtml(headerLogo)}" alt="${escapeHtml(headerLogoAlt)}" />
        </div>
        <div class="pdf-print-header-meta">
          <div><strong>Webpage Usability Report</strong></div>
          ${preparedByHtml}
          ${contactMetaHtml}
          <div>${escapeHtml(submittedAddress)} &bull; ${escapeHtml(formattedDate)}</div>
        </div>
      </div>
    `.trim();
  }

  /**
   * Generates a complete, standalone printable HTML document for the given report data.
   * Can be printed, saved, or opened in a new tab/iframe.
   *
   * @param {object} report - The assembled report from WebAudXReportEngine
   * @param {object} [customBranding] - Optional agency branding settings
   * @returns {string} Standalone HTML document string
   */
  function generatePrintableHtml(report, customBranding) {
    if (!report || !report.sections) {
      throw new Error('A valid assembled report is required to generate printable PDF HTML.');
    }

    const s = report.sections;
    const brandColor = (customBranding && customBranding.brandColor) || '#8306c1';
    const palette = getThemePalette(brandColor);
    const headerHtml = buildPdfHeaderHtml(report, customBranding);
    const footerHtml = buildPdfFooterHtml(customBranding);

    // Build 13 Measurements table/list
    let measurementsHtml = '';
    (s.checkResults || []).forEach(m => {
      let badgeStyle = 'background: #e6f9ed; color: #0d6832; border: 1px solid #9fe5b9;';
      let icon = '✓';
      if (m.status === 'Needs attention') {
        badgeStyle = 'background: #fff8e6; color: #8a5b00; border: 1px solid #fedf89;';
        icon = '!';
      } else if (m.status === 'Could not check') {
        badgeStyle = 'background: #f3f3f7; color: #68687a; border: 1px solid #d4d4e0;';
        icon = '—';
      }

      measurementsHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4pt 0; border-bottom: 1px solid ${palette.border}; font-size: 9pt;">
          <div>
            <strong>${m.id}. ${escapeHtml(m.name)}:</strong>
            <span style="color: #4a4a58;">${escapeHtml(m.explanation || '')}</span>
          </div>
          <span style="display: inline-block; padding: 1pt 6pt; border-radius: 9999px; font-size: 8pt; font-weight: 700; ${badgeStyle}">
            ${icon} ${escapeHtml(m.status)}
          </span>
        </div>
      `;
    });

    // Helper to render findings
    function renderFindingItems(items, type) {
      if (!items || items.length === 0) {
        const fallback = type === 'working' ? 'None in this review.'
          : (type === 'improve' ? 'No immediate areas to improve were identified.' : 'All areas were assessed.');
        return `<p style="font-size: 9pt; color: #68687a; font-style: italic; margin: 0;">${fallback}</p>`;
      }

      return items.map(item => {
        let box = `
          <div class="finding-item-box">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3pt;">
              <strong style="color: #17171d; font-size: 9pt;">${escapeHtml(item.area)}</strong>
              <span style="font-size: 8pt; font-weight: 700; color: ${palette.primary}; background: ${palette.badgeBg}; padding: 1pt 5pt; border-radius: 9999px;">
                Your answer: ${escapeHtml(item.answer)}
              </span>
            </div>
            <p style="font-size: 9pt; color: #4a4a58; margin: 0 0 4pt 0;">${escapeHtml(item.finding)}</p>
        `;

        if (type === 'improve' && item.recommendation) {
          box += `
            <div class="finding-recommendation-box" style="background: ${palette.bgLight}; border-left: 2px solid ${palette.primary}; padding: 4pt 6pt; margin-top: 4pt;">
              <strong style="font-size: 7.5pt; text-transform: uppercase; color: ${palette.darkText}; display: block;">Practical next step</strong>
              <span style="font-size: 8.5pt; color: #17171d;">${escapeHtml(item.recommendation)}</span>
            </div>
          `;
        } else if (type === 'review' && item.checkMethod) {
          box += `
            <div class="finding-checkmethod-box" style="background: #fffbf0; border-left: 2px solid #f79009; padding: 4pt 6pt; margin-top: 4pt;">
              <strong style="font-size: 7.5pt; text-transform: uppercase; color: #b54708; display: block;">How to check this</strong>
              <span style="font-size: 8.5pt; color: #17171d;">${escapeHtml(item.checkMethod)}</span>
            </div>
          `;
        }

        if (item.supportingCheck) {
          box += `
            <div style="font-size: 8pt; color: #68687a; margin-top: 4pt; border-top: 1px dashed ${palette.borderDashed}; padding-top: 3pt;">
              <span style="background: #68687a; color: #fff; font-size: 6.5pt; text-transform: uppercase; padding: 1pt 3pt; border-radius: 2px; margin-right: 4pt;">Measured</span>
              <span>${escapeHtml(item.supportingCheck)}</span>
            </div>
          `;
        }

        box += `</div>`;
        return box;
      }).join('');
    }

    // Build changed suggestions list
    let changedHtml = '<p style="font-size: 9pt; color: #68687a; font-style: italic; margin: 0;">All suggested answers were accepted.</p>';
    if (s.changedSuggestions && s.changedSuggestions.length > 0) {
      changedHtml = '<ul style="margin: 0; padding-left: 14pt; font-size: 9pt; color: #17171d;">';
      s.changedSuggestions.forEach(ch => {
        changedHtml += `<li style="margin-bottom: 2pt;"><strong>${escapeHtml(ch.area)}:</strong> WebAudX suggested <em>${escapeHtml(ch.suggested)}</em>, and you chose <strong>${escapeHtml(ch.userChoice)}</strong>.</li>`;
      });
      changedHtml += '</ul>';
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WebAudX Report - ${escapeHtml(s.pageReviewed.submittedAddress)}</title>
  <style>
    ${getPrintStyles(customBranding)}
  </style>
</head>
<body>
  ${headerHtml}

  <div class="report-content">
    <!-- Section 1: Page Reviewed -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 6pt 0;">1. Page Reviewed</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; font-size: 9pt;">
        <div><strong>Reviewed Address:</strong> ${escapeHtml(s.pageReviewed.submittedAddress)}</div>
        ${s.pageReviewed.redirected ? `<div><strong>Final Address:</strong> ${escapeHtml(s.pageReviewed.finalAddress)}</div>` : ''}
        <div><strong>Date and Time:</strong> ${escapeHtml(s.pageReviewed.formattedDate)}</div>
      </div>
    </div>

    <!-- Section 2: Check Status -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 4pt 0;">2. Check Status</h3>
      <div style="font-size: 9pt;">
        <strong>Status:</strong> ${escapeHtml(s.checkStatus.status)}
        ${s.checkStatus.reason ? `<p style="margin: 3pt 0 0 0; color: #4a4a58;">${escapeHtml(s.checkStatus.reason)}</p>` : ''}
      </div>
    </div>

    <!-- Section 3: Summary -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 4pt 0;">3. Summary</h3>
      <p style="font-size: 9.5pt; color: #17171d; background: ${palette.bgLight}; border-left: 2px solid ${escapeHtml(palette.primary)}; padding: 6pt 8pt; margin: 0;">
        ${escapeHtml(s.summary)}
      </p>
    </div>

    <!-- Section 4: Check Results -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 6pt 0;">4. Check Results</h3>
      ${measurementsHtml}
    </div>

    <!-- Section 5: What is working -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 6pt 0;">5. What Is Working</h3>
      ${renderFindingItems(s.whatIsWorking, 'working')}
    </div>

    <!-- Section 6: Areas to improve -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 6pt 0;">6. Areas to Improve</h3>
      ${renderFindingItems(s.areasToImprove, 'improve')}
    </div>

    <!-- Section 7: Needs further review -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 6pt 0;">7. Needs Further Review</h3>
      ${renderFindingItems(s.needsFurtherReview, 'review')}
    </div>

    <!-- Section 8: Changed suggestions -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 6pt 0;">8. Changed Suggestions</h3>
      ${changedHtml}
    </div>

    <!-- Section 9: Multi-page checking -->
    <div class="report-card" style="background: ${palette.bgLight};">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 4pt 0;">9. Multi-Page Checking</h3>
      <p style="font-size: 9pt; color: #4a4a58; margin: 0;">${escapeHtml(s.multiPageNote)}</p>
    </div>

    <!-- Section 10: About this report -->
    <div class="report-card">
      <h3 style="font-size: 11pt; color: #17171d; margin: 0 0 4pt 0;">10. About This Report</h3>
      <p style="font-size: 8.5pt; color: #68687a; margin: 0;">${escapeHtml(s.aboutThisReport)}</p>
    </div>
  </div>

  ${footerHtml}
</body>
</html>`;
  }

  /**
   * Triggers native print/PDF export in browser.
   * Excludes the website header and footer.
   * Brands the PDF footer on every page with contact phone.
   */
  function exportPdf(report, customBranding) {
    if (typeof window === 'undefined') {
      return generatePrintableHtml(report, customBranding);
    }

    const brandColor = (customBranding && customBranding.brandColor) || '#8306c1';
    const palette = getThemePalette(brandColor);
    const branded = isAgencyBranded(customBranding);
    const headerLogo = (customBranding && customBranding.logo) || PDF_CONFIG.logoSrc;
    const headerLogoAlt = (customBranding && customBranding.agencyName)
      ? (customBranding.agencyName + ' Logo')
      : PDF_CONFIG.logoAlt;
    const preparedByHtml = (customBranding && customBranding.agencyName)
      ? `<div style="font-size: var(--token-font-body-b2-size); line-height: var(--token-font-body-b2-line); font-weight: 600; color: ${escapeHtml(palette.primary)};">Prepared by ${escapeHtml(customBranding.agencyName)}</div>`
      : '';

    const contactParts = [];
    if (customBranding && customBranding.contactEmail) contactParts.push(escapeHtml(customBranding.contactEmail));
    if (customBranding && customBranding.contactPhone) contactParts.push(escapeHtml(customBranding.contactPhone));
    const contactMetaHtml = contactParts.length > 0
      ? `<div style="font-size: var(--token-font-body-b3-size); line-height: var(--token-font-body-b3-line); color: var(--token-color-neutral-700);">Contact: ${contactParts.join(' &bull; ')}</div>`
      : '';

    // Ensure the dedicated printable header exists in the DOM
    let headerEl = document.getElementById('pdf-branded-header');
    if (!headerEl) {
      headerEl = document.createElement('div');
      headerEl.id = 'pdf-branded-header';
      headerEl.className = 'pdf-print-header';
      const screenReport = document.getElementById('screen-report');
      if (screenReport) {
        screenReport.insertBefore(headerEl, screenReport.firstChild);
      }
    }
    headerEl.style.borderBottomColor = palette.primary;
    headerEl.innerHTML = `
      <div>
        <img src="${escapeHtml(headerLogo)}" alt="${escapeHtml(headerLogoAlt)}" style="max-height: 28pt; width: auto;" />
      </div>
      <div style="text-align: right; font-size: var(--token-font-body-b3-size); line-height: var(--token-font-body-b3-line); color: var(--token-color-neutral-700);">
        <div><strong>Webpage Usability Report</strong></div>
        ${preparedByHtml}
        ${contactMetaHtml}
        <div>${escapeHtml(report.sections.pageReviewed.submittedAddress)} &bull; ${escapeHtml(report.sections.pageReviewed.formattedDate)}</div>
      </div>
    `;

    // Ensure the dedicated printable footer exists in the DOM
    let footerEl = document.getElementById('pdf-branded-footer');
    if (!footerEl) {
      footerEl = document.createElement('div');
      footerEl.id = 'pdf-branded-footer';
      footerEl.className = 'pdf-print-page-footer';
      document.body.appendChild(footerEl);
    }
    const footerPhone = (customBranding && customBranding.contactPhone) ? customBranding.contactPhone : PDF_CONFIG.phoneNumber;
    const footerContactText = `For custom web development, contact: ${footerPhone}`;

    // For agency branded outputs, remove the logo from the footer of every page. Leave only the tool name: WebAudX.
    const brandSideHtml = branded
      ? `<span class="pdf-footer-watermark" style="font-weight: 700; color: ${escapeHtml(palette.primary)};">WebAudX</span>`
      : `
        <img src="${escapeHtml(PDF_CONFIG.logoSrc)}" alt="${escapeHtml(PDF_CONFIG.logoAlt)}" class="pdf-footer-logo" style="max-height: 18pt; width: auto;" />
        <span class="pdf-footer-watermark" style="font-weight: 700; color: ${escapeHtml(palette.primary)};">${escapeHtml(PDF_CONFIG.watermark)}</span>
      `;

    footerEl.style.borderTopColor = palette.border;
    footerEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--token-space-2);">
        ${brandSideHtml}
      </div>
      <div style="text-align: right;">
        <span style="color: var(--token-color-neutral-1000);">${escapeHtml(footerContactText)}</span>
      </div>
    `;

    // Trigger standard browser print dialog
    window.print();
  }

  return {
    PDF_CONFIG,
    getPrintStyles,
    buildPdfHeaderHtml,
    buildPdfFooterHtml,
    generatePrintableHtml,
    exportPdf
  };
});
