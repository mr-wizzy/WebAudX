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
    INVALID_FONT: "Please select one of the five approved fonts: Montserrat, Inter, Roboto, Lato, or Open Sans.",
    INVALID_CONTACT_EMAIL: "Please enter a valid contact email address.",
    INVALID_CONTACT_PHONE: "Please enter a valid phone number (e.g. 08168076603 or +1 555-019-2834)."
  };

  /**
   * Cross-environment binary and string conversion helpers.
   * Runs seamlessly in both Node.js and browser environments without ReferenceErrors.
   */
  function base64ToUint8(base64Str) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64Str, 'base64');
    }
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }

  function utf8ToUint8(str) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8');
    }
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str);
    }
    const encoded = unescape(encodeURIComponent(str));
    const bytes = new Uint8Array(encoded.length);
    for (let i = 0; i < encoded.length; i++) {
      bytes[i] = encoded.charCodeAt(i);
    }
    return bytes;
  }

  function uint8ToBase64(bytes) {
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(bytes)) {
      return bytes.toString('base64');
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function uint8ToUtf8(bytes, maxBytes) {
    const slice = (maxBytes && bytes.length > maxBytes) ? bytes.subarray(0, maxBytes) : bytes;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(slice)) {
      return slice.toString('utf8');
    }
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(slice);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(slice).toString('utf8');
    }
    let binary = '';
    for (let i = 0; i < slice.length; i++) {
      binary += String.fromCharCode(slice[i]);
    }
    return decodeURIComponent(escape(binary));
  }

  /**
   * Validate contact email (optional, max 100 characters).
   */
  function validateContactEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: true, sanitized: '' };
    }
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      return { valid: true, sanitized: '' };
    }
    if (trimmed.length > 100) {
      return { valid: false, error: 'Contact email cannot exceed 100 characters.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: COPY.INVALID_CONTACT_EMAIL };
    }
    const sanitized = trimmed.replace(/<[^>]*>?/gm, '');
    return { valid: true, sanitized: sanitized };
  }

  /**
   * Validate contact phone (optional, max 30 characters).
   */
  function validateContactPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { valid: true, sanitized: '' };
    }
    const trimmed = phone.trim();
    if (trimmed.length === 0) {
      return { valid: true, sanitized: '' };
    }
    if (trimmed.length > 30) {
      return { valid: false, error: 'Contact phone number cannot exceed 30 characters.' };
    }
    const phoneRegex = /^[0-9+\s\-().]{5,30}$/;
    if (!phoneRegex.test(trimmed)) {
      return { valid: false, error: COPY.INVALID_CONTACT_PHONE };
    }
    const sanitized = trimmed.replace(/<[^>]*>?/gm, '');
    return { valid: true, sanitized: sanitized };
  }

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

    let bytes;
    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        const commaIndex = data.indexOf(',');
        if (commaIndex === -1) {
          return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
        }
        try {
          bytes = base64ToUint8(data.substring(commaIndex + 1));
        } catch (e) {
          return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
        }
      } else {
        bytes = utf8ToUint8(data);
      }
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      bytes = data;
    } else if (data instanceof Uint8Array) {
      bytes = data;
    } else {
      return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
    }

    // 1. Strict 1 MB size check (PRD Section 10.2 & 13)
    if (bytes.length > MAX_LOGO_SIZE_BYTES) {
      return { valid: false, error: COPY.LOGO_TOO_LARGE };
    }
    if (bytes.length === 0) {
      return { valid: false, error: COPY.LOGO_TYPE_NOT_ALLOWED };
    }

    // 2. Binary Magic Bytes Inspection
    // PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
    const isPng = bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;

    // JPG/JPEG Magic Bytes: FF D8 FF
    const isJpg = bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    // SVG: Check text representation
    let isSvg = false;
    let sanitizedSvg = null;
    const textSnippet = uint8ToUtf8(bytes, Math.min(bytes.length, 1024)).trim();
    if (textSnippet.includes('<svg') || textSnippet.startsWith('<?xml')) {
      const fullSvgText = uint8ToUtf8(bytes);
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
      dataUri = `data:image/png;base64,${uint8ToBase64(bytes)}`;
    } else if (isJpg) {
      mimeType = 'image/jpeg';
      dataUri = `data:image/jpeg;base64,${uint8ToBase64(bytes)}`;
    } else if (isSvg) {
      mimeType = 'image/svg+xml';
      const cleanBytes = utf8ToUint8(sanitizedSvg);
      dataUri = `data:image/svg+xml;base64,${uint8ToBase64(cleanBytes)}`;
    }

    return {
      valid: true,
      mimeType: mimeType,
      dataUri: dataUri,
      sizeBytes: bytes.length
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

    // 5. Contact Email (optional)
    if (payload.contactEmail !== undefined && payload.contactEmail !== null) {
      const emailRes = validateContactEmail(payload.contactEmail);
      if (!emailRes.valid) errors.push(emailRes.error);
      else sanitized.contactEmail = emailRes.sanitized;
    } else {
      sanitized.contactEmail = '';
    }

    // 6. Contact Phone (optional)
    if (payload.contactPhone !== undefined && payload.contactPhone !== null) {
      const phoneRes = validateContactPhone(payload.contactPhone);
      if (!phoneRes.valid) errors.push(phoneRes.error);
      else sanitized.contactPhone = phoneRes.sanitized;
    } else {
      sanitized.contactPhone = '';
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
    validateContactEmail,
    validateContactPhone,
    sanitizeSvg,
    validateLogo,
    validateBrandingPayload
  };
});
