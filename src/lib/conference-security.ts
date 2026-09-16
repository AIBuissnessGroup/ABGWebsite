/**
 * Security and sanitization utilities for conference ticketing
 */

/**
 * Escapes HTML characters to prevent HTML Injection and XSS in emails and web views
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes regex special characters to prevent MongoDB ReDoS and regex injection
 */
export function escapeRegex(text: string): string {
  if (!text) return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes cell values to prevent CSV Formula Injection (Excel DDE attacks)
 * If a cell starts with =, +, -, @, or tab, prefixes with an apostrophe
 */
export function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');

  // If the cell begins with formula characters, neutralize it
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str}"`;
}

/**
 * Validates and sanitizes text inputs, enforcing maximum character lengths
 */
export function sanitizeStringInput(val: any, maxLength: number = 100): string {
  if (typeof val !== 'string') return '';
  // Remove control characters (except newline) and truncate to maxLength
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

/**
 * Simple in-memory rate limiter for public endpoints (prevents spam / card testing)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Periodic cleanup of stale entries if map gets large
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
