import NextAuth from 'next-auth';

export type UserRole = 
  | 'USER' 
  | 'ADMIN' 
  | 'PROJECT_TEAM_MEMBER' 
  | 'GENERAL_MEMBER' 
  | 'ROUND1' 
  | 'ROUND2' 
  | 'SPECIAL_PRIVS';

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