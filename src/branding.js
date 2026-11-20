/**
 * WebAudX Agency Branding & Logo Processing Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 10 (Accounts and Branding)
 * - WebAudX PRD v1.0 Section 13 (Error Messages)
 * - .agent/Rules/security-and-privacy.md (Section 9 & 10)
 * - .agent/Skills/pdf-and-branding-generation.md
 * - Approved copy from docs/copy-library.json
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const copyLibrary = require('../docs/copy-library.json');
    module.exports = factory(copyLibrary);
  } else {
    root.WebAudXBranding = factory(root.WebAudXCopyLibrary || null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (copyLib) {

  const APPROVED_FONTS = ['Montserrat', 'Inter', 'Roboto', 'Lato', 'Open Sans'];
  const MAX_AGENCY_NAME_LENGTH = 60;
  const MAX_LOGO_SIZE_BYTES = 1048576; // Strict 1 MB limit (PRD Section 10.2 & 11)

  // Approved plain-English error copy from PRD Section 13
  const COPY = {
    LOGO_TOO_LARGE: "This logo is larger than 1 MB. Please upload a smaller file.",
    LOGO_TYPE_NOT_ALLOWED: "Please upload a PNG, JPG, or SVG file.",
    SIGN_IN_EXPIRED: "This sign-in link has expired. Request a new one.",
    BRANDING_NOT_SAVED: "Your branding could not be saved. Your changes have not been lost. Please try again.",
    NAME_TOO_LONG: "Agency name cannot exceed 60 characters.",
    NAME_REQUIRED: "Please enter your agency name.",
    INVALID_COLOR: "Please enter a valid hex colour code, such as #8306c1.",
    INVALID_FONT: "Please select one of the five approved fonts: Montserrat, Inter, Roboto, Lato, or Open Sans."
  };

  /**
   * Validate agency name (up to 60 characters per PRD Section 10.2).
   */
  function validateAgencyName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: COPY.NAME_REQUIRED };
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: COPY.NAME_REQUIRED };
    }
    if (trimmed.length > MAX_AGENCY_NAME_LENGTH) {
      return { valid: false, error: COPY.NAME_TOO_LONG };
    }

    // Strip HTML tags for defense in depth
    const sanitized = trimmed.replace(/<[^>]*>?/gm, '');
    return { valid: true, sanitized: sanitized };
  }

  /**
   * Validate brand accent color (single hex color).
   */
  function validateBrandColor(hex) {
    if (!hex || typeof hex !== 'string') {
      return { valid: false, error: COPY.INVALID_COLOR };
    }
    const cleanHex = hex.trim();
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    if (!hexRegex.test(cleanHex)) {
      return { valid: false, error: COPY.INVALID_COLOR };
    }
    return { valid: true, sanitized: cleanHex.toLowerCase() };
  }

  /**
   * Validate selected font (must be one of 5 approved fonts per PRD Section 10.2).
   */
  function validateFont(font) {
    if (!font || typeof font !== 'string') {
      return { valid: false, error: COPY.INVALID_FONT };
    }
    const trimmed = font.trim();
    if (!APPROVED_FONTS.includes(trimmed)) {
      return { valid: false, error: COPY.INVALID_FONT };
    }
    return { valid: true, sanitized: trimmed };
  }

  /**
   * Sanitize SVG markup to prevent Stored Cross-Site Scripting (XSS).
   * Strips:
   * - <script> blocks
   * - Inline event handlers (onload, onclick, onerror, etc.)
   * - <foreignObject>, <embed>, <object>, <iframe>
   * - javascript: pseudo-protocols
   * - XML DTD external entities
   */
  function sanitizeSvg(svgContent) {
    if (!svgContent || typeof svgContent !== 'string') return '';

    let clean = svgContent;

    // 1. Remove XML declaration and comments if any
    clean = clean.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
    clean = clean.replace(/<!ENTITY[\s\S]*?>/gi, '');
    clean = clean.replace(/<!--[\s\S]*?-->/g, '');

    // 2. Strip dangerous tags
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // 3. Strip all on* event handler attributes
    clean = clean.replace(/\s+on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

    // 4. Strip javascript: and data: pseudo-protocols in href or xlink:href
    clean = clean.replace(/\s+(?:xlink:)?href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, '');
    clean = clean.replace(/\s+(?:xlink:)?href\s*=\s*['"]\s*data:[^'"]*['"]/gi, '');

    // Verify it still looks like an SVG
    if (!/<svg\b[^>]*>/i.test(clean) || !/<\/svg>/i.test(clean)) {
      return '';
    }

    return clean.trim();
  }

  /**
   * Validate and sanitize uploaded logo buffer.
   * Checks:
   * 1. Max size: 1 MB.
   * 2. True format verification via magic bytes (PNG, JPG, SVG).
   * 3. Sanitization of SVG contents.
   *
   * @param {Buffer | Uint8Array | string} data - Buffer or base64 string
   * @param {string} [filename]
   * @returns {{
   *   valid: boolean,
   *   error?: string,
   *   mimeType?: string,
   *   dataUri?: string,
   *   sizeBytes?: number
   * }}
   */
  function validateLogo(data, filename) {
    if (!data) {
      return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
    }

    let buffer;
    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        const parts = data.split(',');
        buffer = Buffer.from(parts[1], 'base64');
      } else {
        buffer = Buffer.from(data, 'utf8');
      }
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (data instanceof Uint8Array) {
      buffer = Buffer.from(data);
    } else {
      return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
    }

    // 1. Strict 1 MB size check (PRD Section 10.2 & 13)
    if (buffer.length > MAX_LOGO_SIZE_BYTES) {
      return { valid: false, error: COPY.LOGO_TOO_LARGE };
    }
    if (buffer.length === 0) {
      return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
    }

    // 2. Binary Magic Bytes Inspection
    // PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer.length >= 8 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
      buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a;

    // JPG/JPEG Magic Bytes: FF D8 FF
    const isJpg = buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    // SVG: Check text representation
    let isSvg = false;
    let sanitizedSvg = null;
    const textSnippet = buffer.toString('utf8', 0, Math.min(buffer.length, 1024)).trim();
    if (textSnippet.includes('<svg') || textSnippet.startsWith('<?xml')) {
      const fullSvgText = buffer.toString('utf8');
      sanitizedSvg = sanitizeSvg(fullSvgText);
      if (sanitizedSvg && sanitizedSvg.length > 0) {
        isSvg = true;
      }
    }

    if (!isPng && !isJpg && !isSvg) {
      return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
    }

    let mimeType = 'image/png';
    let dataUri = '';

    if (isPng) {
      mimeType = 'image/png';
      dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
    } else if (isJpg) {
      mimeType = 'image/jpeg';
      dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } else if (isSvg) {
      mimeType = 'image/svg+xml';
      const cleanBuffer = Buffer.from(sanitizedSvg, 'utf8');
      dataUri = `data:image/svg+xml;base64,${cleanBuffer.toString('base64')}`;
    }

    return {
      valid: true,
      mimeType: mimeType,
      dataUri: dataUri,
      sizeBytes: buffer.length
    };
  }

  /**
   * Validate complete branding settings payload.
   */
  function validateBrandingPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Invalid branding data provided.'] };
    }

    const errors = [];
    const sanitized = {};

    // 1. Agency name
    const nameRes = validateAgencyName(payload.agencyName);
    if (!nameRes.valid) errors.push(nameRes.error);
    else sanitized.agencyName = nameRes.sanitized;

    // 2. Brand color
    const colorRes = validateBrandColor(payload.brandColor || '#8306c1');
    if (!colorRes.valid) errors.push(colorRes.error);
    else sanitized.brandColor = colorRes.sanitized;

    // 3. Font
    const fontRes = validateFont(payload.font || 'Inter');
    if (!fontRes.valid) errors.push(fontRes.error);
    else sanitized.font = fontRes.sanitized;

    // 4. Logo (optional if keeping default/existing)
    if (payload.logo) {
      const logoRes = validateLogo(payload.logo);
      if (!logoRes.valid) errors.push(logoRes.error);
      else sanitized.logo = logoRes.dataUri;
    } else {
      sanitized.logo = null;
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      sanitized: sanitized
    };
  }

  return {
    APPROVED_FONTS,
    MAX_AGENCY_NAME_LENGTH,
    MAX_LOGO_SIZE_BYTES,
    COPY,
    validateAgencyName,
    validateBrandColor,
    validateFont,
    sanitizeSvg,
    validateLogo,
    validateBrandingPayload
  };
});
