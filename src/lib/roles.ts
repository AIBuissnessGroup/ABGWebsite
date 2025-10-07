import { UserRole } from '@/types/next-auth';

/**
 * All available user roles in the system
 */
export const USER_ROLES: UserRole[] = [
  'USER',
  'ADMIN', 
  'PROJECT_TEAM_MEMBER',
  'GENERAL_MEMBER',
  'ROUND1',
  'ROUND2',
  'SPECIAL_PRIVS'
];

/**
 * Check if a user has a specific role
 */
export function hasRole(userRoles: UserRole[], requiredRole: UserRole): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if a user has admin privileges
 */
export function isAdmin(userRoles: UserRole[]): boolean {
  return userRoles.includes('ADMIN');
}

/**
 * Check if a user is allowed to register for an event based on role requirements
 */
export function canRegisterForEvent(userRoles: UserRole[], requiredRolesAny: UserRole[]): boolean {
  // If no role requirements, anyone can register
  if (!requiredRolesAny || requiredRolesAny.length === 0) {
    return true;
  }
  
  // Check if user has any of the required roles
  return hasAnyRole(userRoles, requiredRolesAny);
}

/**
 * Get a user-friendly display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    'USER': 'User',
    'ADMIN': 'Administrator',
    'PROJECT_TEAM_MEMBER': 'Project Team Member',
    'GENERAL_MEMBER': 'General Member',
    'ROUND1': 'Round 1 Member',
    'ROUND2': 'Round 2 Member',
    'SPECIAL_PRIVS': 'Special Privileges'
  };
  
  return roleNames[role] || role;
}

/**
 * Validate that all roles in the array are valid
 */
export function validateRoles(roles: string[]): UserRole[] {
  return roles.filter(role => USER_ROLES.includes(role as UserRole)) as UserRole[];
}

/**
 * Check if removing a role from a user would leave no admins
 * This requires checking the database for other admin users
 */
export async function wouldRemoveLastAdmin(
  userEmail: string,
  newRoles: UserRole[],
  db: any
): Promise<boolean> {
  // If the new roles still include ADMIN, no problem
  if (newRoles.includes('ADMIN')) {
    return false;
  }
  
  // Check if there are other admin users
  const otherAdmins = await db.collection('users').countDocuments({
    email: { $ne: userEmail },
    roles: 'ADMIN'
  });
  
  return otherAdmins === 0;
}