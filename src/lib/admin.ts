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