import { UserRole } from '@/types/next-auth';

/**
 * Role-Based Access Control (RBAC) for Admin Pages
 * Maps admin dashboard pages to the roles that can access them
 */

export type AdminPage = 
  | 'dashboard'
  | 'users'
  | 'permissions'
  | 'settings'
  | 'audit'
  | 'analytics'
  | 'events'
  | 'recruitment'
  | 'recruitment-portal'
  | 'recruitment-timeline'
  | 'coffee-chats'
  | 'interviews'
  | 'forms'
  | 'waitlists'
  | 'member-levels'
  | 'projects'
  | 'team'
  | 'about'
  | 'join'
  | 'hero'
  | 'content'
  | 'newsletter'
  | 'notifications'
  | 'newsroom'
  | 'internships'
  | 'companies'
  | 'changelog';

/**
 * Permission map: which roles can access which admin pages
 */
export const PAGE_PERMISSIONS: Record<AdminPage, UserRole[]> = {
  // Core admin pages - only full admins
  'dashboard': ['ADMIN', 'PRESIDENT'],
  'users': ['ADMIN', 'PRESIDENT'],
  'permissions': ['ADMIN', 'PRESIDENT'],
  'settings': ['ADMIN', 'PRESIDENT', 'VP_TECHNOLOGY'],
  'audit': ['ADMIN', 'PRESIDENT'],
  'analytics': ['ADMIN', 'PRESIDENT', 'VP_OPERATIONS', 'VP_MARKETING', 'VP_RECRUITMENT'],
  
  // Events - VP External, VP Operations, VP Marketing, VP Conferences
  'events': ['ADMIN', 'PRESIDENT', 'VP_EXTERNAL', 'VP_OPERATIONS', 'VP_MARKETING', 'VP_CONFERENCES'],
  
  // Recruitment - VP Recruitment, VP Operations
  'recruitment': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  'recruitment-portal': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  'recruitment-timeline': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  'coffee-chats': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  'interviews': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  'waitlists': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  'member-levels': ['ADMIN', 'PRESIDENT', 'VP_RECRUITMENT', 'VP_OPERATIONS'],
  
  // Forms - can be accessed by multiple VPs
  'forms': ['ADMIN', 'PRESIDENT', 'VP_OPERATIONS', 'VP_RECRUITMENT', 'VP_EXTERNAL'],
  
  // Projects - VP Operations, VP Technology, VP Education
  'projects': ['ADMIN', 'PRESIDENT', 'VP_OPERATIONS', 'VP_TECHNOLOGY', 'VP_EDUCATION'],
  
  // Team management - VP Operations, VP Recruitment
  'team': ['ADMIN', 'PRESIDENT', 'VP_OPERATIONS', 'VP_RECRUITMENT'],
  
  // Content management - VP Marketing, VP Operations
  'about': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_OPERATIONS'],
  'join': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_OPERATIONS', 'VP_RECRUITMENT'],
  'hero': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_OPERATIONS'],
  'content': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_OPERATIONS'],
  'newsroom': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_EXTERNAL'],
  
  // Communications - VP Marketing, VP External
  'newsletter': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_EXTERNAL', 'VP_OPERATIONS'],
  'notifications': ['ADMIN', 'PRESIDENT', 'VP_MARKETING', 'VP_EXTERNAL', 'VP_OPERATIONS'],
  
  // Internships & Companies - VP External, VP Sponsorships
  'internships': ['ADMIN', 'PRESIDENT', 'VP_EXTERNAL', 'VP_SPONSORSHIPS', 'VP_OPERATIONS'],
  'companies': ['ADMIN', 'PRESIDENT', 'VP_EXTERNAL', 'VP_SPONSORSHIPS', 'VP_OPERATIONS'],
  
  // Changelog - VP Technology, VP Operations
  'changelog': ['ADMIN', 'PRESIDENT', 'VP_TECHNOLOGY', 'VP_OPERATIONS'],
};

/**
 * Check if a user has permission to access a specific admin page
 */
export function canAccessAdminPage(userRoles: UserRole[], page: AdminPage): boolean {
  // ADMIN role has access to everything
  if (userRoles.includes('ADMIN')) {
    return true;
  }
  
  // Check if user has any of the required roles for this page
  const requiredRoles = PAGE_PERMISSIONS[page];
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Get all admin pages a user can access
 */
export function getAccessibleAdminPages(userRoles: UserRole[]): AdminPage[] {
  return (Object.keys(PAGE_PERMISSIONS) as AdminPage[]).filter(page => 
    canAccessAdminPage(userRoles, page)
  );
}

/**
 * Check if user has any admin access at all
 */
export function hasAnyAdminAccess(userRoles: UserRole[]): boolean {
  // Check if user has ADMIN role
  if (userRoles.includes('ADMIN')) {
    return true;
  }
  
  // Check if user has any VP/executive role
  const execRoles: UserRole[] = [
    'PRESIDENT',
    'VP_EXTERNAL',
    'VP_OPERATIONS',
    'VP_EDUCATION',
    'VP_MARKETING',
    'VP_CONFERENCES',
    'VP_FINANCE',
    'VP_COMMUNITY',
    'VP_SPONSORSHIPS',
    'VP_RECRUITMENT',
    'VP_TECHNOLOGY',
  ];
  
  return execRoles.some(role => userRoles.includes(role));
}

/**
 * Get user-friendly error message when access is denied
 */
export function getAccessDeniedMessage(page: AdminPage): string {
  const requiredRoles = PAGE_PERMISSIONS[page];
  const roleNames = requiredRoles.map(role => {
    switch(role) {
      case 'ADMIN': return 'Administrator';
      case 'PRESIDENT': return 'President';
      case 'VP_EXTERNAL': return 'VP External Affairs';
      case 'VP_OPERATIONS': return 'VP Operations';
      case 'VP_EDUCATION': return 'VP Education';
      case 'VP_MARKETING': return 'VP Marketing';
      case 'VP_CONFERENCES': return 'VP Conferences';
      case 'VP_FINANCE': return 'VP Finance';
      case 'VP_COMMUNITY': return 'VP Community';
      case 'VP_SPONSORSHIPS': return 'VP Sponsorships';
      case 'VP_RECRUITMENT': return 'VP Recruitment';
      case 'VP_TECHNOLOGY': return 'VP Technology';
      default: return role;
    }
  });
  
  if (roleNames.length === 1) {
    return `Access restricted to ${roleNames[0]} only.`;
  } else if (roleNames.length === 2) {
    return `Access restricted to ${roleNames[0]} and ${roleNames[1]}.`;
  } else {
    const lastRole = roleNames.pop();
    return `Access restricted to ${roleNames.join(', ')}, and ${lastRole}.`;
  }
}
