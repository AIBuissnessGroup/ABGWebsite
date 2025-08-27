import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';
import { isAdminEmail } from './admin';

const prisma = new PrismaClient();

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
        try {
          // Check if user exists
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          // If user doesn't exist, create them
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                role: isAdminEmail(user.email) ? 'ADMIN' : 'USER'
              }
            });
          }

        return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
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
        if (user.email && isAdminEmail(user.email)) {
          token.role = 'ADMIN';
        } else {
          token.role = 'USER';
        }
      }
      return token;
    },
      async redirect({ url, baseUrl }) {
        // Only allow redirects to same-origin URLs
        if (url.startsWith(baseUrl)) {
          return url;
        }
        return baseUrl;
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