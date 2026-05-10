/**
 * FIX #3 — Security: Input Sanitization Utilities
 *
 * In production these would be server-side. On the client we prevent XSS
 * by stripping HTML tags and limiting dangerous characters from all
 * user-facing string inputs before they are stored in state.
 */

/**
 * Strip HTML tags and trim whitespace from a string.
 * Prevents XSS if content is ever rendered via dangerouslySetInnerHTML.
 */
export const sanitizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/javascript:/gi, '') // strip JS URI scheme
    .trim()
    .slice(0, 500);            // hard cap at 500 chars for text fields
};

/**
 * Sanitize a merchant/description name — allows letters, numbers, punctuation.
 */
export const sanitizeName = (value) => {
  if (typeof value !== 'string') return '';
  return sanitizeText(value).slice(0, 100);
};

/**
 * Validate and sanitize a monetary amount.
 * Returns an integer number of cents, or null if invalid.
 */
export const sanitizeAmount = (value) => {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0 || parsed > 9_999_999_999) return null;
  return Math.round(parsed * 100);
};

/**
 * Validate a date string is in YYYY-MM-DD format and is a real date.
 */
export const sanitizeDate = (value) => {
  if (typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return value;
};

/**
 * Validate email format.
 */
export const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * Content Security Policy meta tag value.
 * Recommended for production — this string can be applied via a <meta> tag
 * or ideally via HTTP headers from your backend.
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",   // 'unsafe-inline' only for dev
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');
