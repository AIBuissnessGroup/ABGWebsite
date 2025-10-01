import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    accessToken?: string;
  }
} 