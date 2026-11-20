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
   * Generates clean CSS for print and PDF export.
   * Ensures:
   * 1. Top navigation header and generic app footer are excluded.
   * 2. Interactive action buttons (toolbars) are excluded.
   * 3. Repeating branded footer with logo and custom web development contact (08168076603) appears on each printed page.
   * 4. Page breaks are handled cleanly without splitting findings across pages.
   */
  function getPrintStyles() {
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
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
          border-bottom: 2px solid #8306c1;
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
          border: 1px solid #e2d5ec !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          padding: 10pt 12pt !important;
          margin-bottom: 10pt !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .finding-item-box {
          border: 1px solid #e2d5ec !important;
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

        /* 2. Branded Footer for every printed page */
        .pdf-print-page-footer {
          display: flex !important;
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 30pt !important;
          border-top: 1px solid #e2d5ec !important;
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
          color: #8306c1;
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
          color: #8306c1;
        }
      }
    `;
  }

  /**
   * Builds the branded PDF page footer HTML.
   * Displays:
   * - WebAudX logo
   * - "Generated with WebAudX" watermark
   * - Contact for custom web development with phone: 08168076603
   */
  function buildPdfFooterHtml(customBranding) {
    const logoSrc = (customBranding && customBranding.logo) ? customBranding.logo : PDF_CONFIG.logoSrc;
    const watermark = PDF_CONFIG.watermark;
    const contactText = PDF_CONFIG.contactText;

    return `
      <div class="pdf-print-page-footer" id="pdf-branded-footer">
        <div class="pdf-footer-brand-side">
          <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(PDF_CONFIG.logoAlt)}" class="pdf-footer-logo" />
          <span class="pdf-footer-watermark">${escapeHtml(watermark)}</span>
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
  function buildPdfHeaderHtml(report) {
    const submittedAddress = (report && report.sections && report.sections.pageReviewed)
      ? report.sections.pageReviewed.submittedAddress
      : 'Webpage Review';
    const formattedDate = (report && report.sections && report.sections.pageReviewed)
      ? report.sections.pageReviewed.formattedDate
      : new Date().toLocaleDateString();

    return `
      <div class="pdf-print-header" id="pdf-branded-header">
        <div>
          <img src="${escapeHtml(PDF_CONFIG.logoSrc)}" alt="${escapeHtml(PDF_CONFIG.logoAlt)}" />
        </div>
        <div class="pdf-print-header-meta">
          <div><strong>Webpage Usability Report</strong></div>
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
    const headerHtml = buildPdfHeaderHtml(report);
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
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4pt 0; border-bottom: 1px solid #f3eef7; font-size: 9pt;">
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
              <span style="font-size: 8pt; font-weight: 700; color: #8306c1; background: #f3eef7; padding: 1pt 5pt; border-radius: 9999px;">
                Your answer: ${escapeHtml(item.answer)}
              </span>
            </div>
            <p style="font-size: 9pt; color: #4a4a58; margin: 0 0 4pt 0;">${escapeHtml(item.finding)}</p>
        `;

        if (type === 'improve' && item.recommendation) {
          box += `
            <div class="finding-recommendation-box" style="background: #fbf5fe; border-left: 2px solid #8306c1; padding: 4pt 6pt; margin-top: 4pt;">
              <strong style="font-size: 7.5pt; text-transform: uppercase; color: #5a0484; display: block;">Practical next step</strong>
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
            <div style="font-size: 8pt; color: #68687a; margin-top: 4pt; border-top: 1px dashed #e2d5ec; padding-top: 3pt;">
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
    ${getPrintStyles()}
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
      <p style="font-size: 9.5pt; color: #17171d; background: #fbf5fe; border-left: 2px solid #8306c1; padding: 6pt 8pt; margin: 0;">
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
    <div class="report-card" style="background: #fbf5fe;">
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
   * Brands the PDF footer on every page with logo & contact phone 08168076603.
   */
  function exportPdf(report, customBranding) {
    if (typeof window === 'undefined') {
      return generatePrintableHtml(report, customBranding);
    }

    // Ensure the dedicated printable footer and header exist in the DOM
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
    headerEl.innerHTML = `
      <div>
        <img src="${escapeHtml(PDF_CONFIG.logoSrc)}" alt="${escapeHtml(PDF_CONFIG.logoAlt)}" style="max-height: 28pt; width: auto;" />
      </div>
      <div style="text-align: right; font-size: var(--token-font-body-b3-size); line-height: var(--token-font-body-b3-line); color: var(--token-color-neutral-700);">
        <div><strong>Webpage Usability Report</strong></div>
        <div>${escapeHtml(report.sections.pageReviewed.submittedAddress)} &bull; ${escapeHtml(report.sections.pageReviewed.formattedDate)}</div>
      </div>
    `;

    let footerEl = document.getElementById('pdf-branded-footer');
    if (!footerEl) {
      footerEl = document.createElement('div');
      footerEl.id = 'pdf-branded-footer';
      footerEl.className = 'pdf-print-page-footer';
      document.body.appendChild(footerEl);
    }
    footerEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--token-space-2);">
        <img src="${escapeHtml((customBranding && customBranding.logo) || PDF_CONFIG.logoSrc)}" alt="${escapeHtml(PDF_CONFIG.logoAlt)}" class="pdf-footer-logo" style="max-height: 18pt; width: auto;" />
        <span class="pdf-footer-watermark" style="font-weight: 700; color: var(--token-color-primary-400);">${escapeHtml(PDF_CONFIG.watermark)}</span>
      </div>
      <div style="text-align: right;">
        <span style="color: var(--token-color-neutral-1000);">${escapeHtml(PDF_CONFIG.contactText)}</span>
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
