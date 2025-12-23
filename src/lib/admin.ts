import type { Session } from 'next-auth';

/**
 * Helper function to parse admin emails from environment variable
 * Handles comma-separated emails with potential whitespace, newlines, and quotes
 */
export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) return [];
  
  // Remove surrounding quotes if they exist
  const cleanedEnv = adminEmailsEnv.replace(/^["']|["']$/g, '');
  
  return cleanedEnv
    .split(',')
    .map(email => email.trim())
    .map(email => email.replace(/^["']|["']$/g, '')) // Remove quotes from individual emails
    .filter(email => email.length > 0);
}

/**
 * Check if a given email is in the admin list
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email);
}

export type AdminLikeUser = {
  email?: string | null;
  roles?: string[];
  role?: string | null;
} | null | undefined;

/**
 * Check if a user has admin access based on email or roles
 */
export function isAdmin(user: AdminLikeUser): boolean {
  if (!user) return false;
  
  // Check role-based admin access first (source of truth in DB/session)
  if (Array.isArray(user.roles) && user.roles.includes('ADMIN')) {
    return true;
  }

  // Check email-based admin access (legacy env var fallback)
  if (user.email && isAdminEmail(user.email)) {
    return true;
  }
  
  // Legacy single-role field check
  if (user.role === 'ADMIN') {
    return true;
  }
  
  return false;
}

/**
 * Convenience helper to validate an entire session instead of only the user object
 * Useful for server-side checks where the raw session is available.
 */
export function hasAdminAccess(session: Session | null | undefined): session is Session {
  return Boolean(session?.user && isAdmin(session.user));
}
