import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoClient } from 'mongodb';
import { isAdminEmail } from './admin';

const client = new MongoClient(process.env.DATABASE_URL!);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // These parameters help prevent the disallowed_useragent error
          include_granted_scopes: "true",
        }
      },
      // Additional configuration to handle user agent issues
      httpOptions: {
        timeout: 10000,
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow UofM email addresses
      if (user.email && user.email.endsWith('@umich.edu')) {
        try {
          await client.connect();
          const db = client.db();
          const usersCollection = db.collection('users');
          
          // Check if user exists
          let dbUser = await usersCollection.findOne({
            email: user.email
          });

          // If user doesn't exist, create them
          if (!dbUser) {
            await usersCollection.insertOne({
              email: user.email,
              name: user.name || '',
              image: user.image || null,
              role: isAdminEmail(user.email) ? 'ADMIN' : 'USER',
              profile: {
                major: null,
                school: null,
                graduationYear: null,
                phone: null
              },
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        } finally {
          await client.close();
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
      console.log('Auth redirect called with:', { url, baseUrl });
      
      // Handle same-origin URLs
      if (url.startsWith(baseUrl)) {
        console.log('Redirecting to:', url);
        return url;
      }
      
      // Handle relative URLs (like /recruitment#recruitment-timeline)
      if (url.startsWith('/')) {
        const fullUrl = baseUrl + url;
        console.log('Redirecting to relative URL:', fullUrl);
        return fullUrl;
      }
      
      console.log('Defaulting to baseUrl:', baseUrl);
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
