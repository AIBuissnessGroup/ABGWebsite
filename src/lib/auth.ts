import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow UofM email addresses
      if (user.email && user.email.endsWith('@umich.edu')) {
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // Add user ID and role to session from token
        session.user.id = token.sub || '';
        session.user.role = token.role || 'USER';
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        // Check if user should be admin based on email
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        if (user.email && adminEmails.includes(user.email)) {
          token.role = 'ADMIN';
        } else {
          token.role = 'USER';
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}; 