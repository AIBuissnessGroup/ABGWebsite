import NextAuth from 'next-auth';

export type UserRole = 
  | 'USER' 
  | 'ADMIN' 
  | 'PROJECT_TEAM_MEMBER' 
  | 'GENERAL_MEMBER' 
  | 'ROUND1' 
  | 'ROUND2' 
  | 'SPECIAL_PRIVS'
  | 'PRESIDENT'
  | 'VP_EXTERNAL'
  | 'VP_OPERATIONS'
  | 'VP_EDUCATION'
  | 'VP_MARKETING'
  | 'VP_CONFERENCES'
  | 'VP_FINANCE'
  | 'VP_COMMUNITY'
  | 'VP_SPONSORSHIPS'
  | 'VP_RECRUITMENT'
  | 'VP_TECHNOLOGY'
  | 'ADVISOR';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: UserRole[];
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    roles: UserRole[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles: UserRole[];
    accessToken?: string;
  }
} 