/**
 * Enterprise HTML sanitization and string escaping utility for admin-entered rich text.
 * Strictly whitelists safe presentation tags and removes dangerous scripts, event handlers,
 * and malicious protocol schemes.
 */

// Whitelist of permitted formatting tags
const ALLOWED_TAGS = new Set([
  'p',
  'b',
  'strong',
  'i',
  'em',
  'ul',
  'ol',
  'li',
  'br',
  'span',
]);

/**
 * Escapes characters with special meaning in HTML to prevent XSS.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes an HTML string by preserving whitelisted formatting tags and stripping
 * any dangerous elements, attributes, or protocols (e.g. javascript: schemes, event handlers).
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  // 1. Remove dangerous blocks completely including their content
  let clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 2. Process all tags: keep allowed tags (with attributes stripped of on* handlers and javascript:), strip other tags
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)(\s+[^>]*)?>/g, (match, tag, attributes) => {
    const lowerTag = tag.toLowerCase();

    // If tag is not in whitelist, remove it
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return '';
    }

    // If closing tag, return clean closing tag
    if (match.startsWith('</')) {
      return `</${lowerTag}>`;
    }

    // If self-closing or has no attributes
    if (!attributes || attributes.trim() === '') {
      return lowerTag === 'br' ? '<br />' : `<${lowerTag}>`;
    }

    // Sanitize attributes: strictly strip any inline event handlers (on*) or javascript: URIs
    let safeAttrs = attributes
      .replace(/\s+on[a-zA-Z]+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\s+on[a-zA-Z]+\s*=\s*[^\s>]+/gi, '')
      .replace(/javascript:/gi, 'blocked:');

    // Only allow safe class or style attributes on span/p, otherwise strip all
    if (lowerTag === 'span' || lowerTag === 'p') {
      // Retain basic alignment or formatting classes if clean
      safeAttrs = safeAttrs.replace(/[^a-zA-Z0-9\-_="':;\s]/g, '');
    } else {
      safeAttrs = '';
    }

    return lowerTag === 'br' ? '<br />' : `<${lowerTag}${safeAttrs ? ' ' + safeAttrs.trim() : ''}>`;
  });

  return clean.trim();
}
