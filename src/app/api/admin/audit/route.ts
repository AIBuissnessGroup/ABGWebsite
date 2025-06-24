import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      return user.email && user.email.endsWith('@umich.edu');
    },
    async session({ session, token }: any) {
      if (session?.user && token) {
        session.user.id = token.sub || '';
        session.user.role = token.role || 'USER';
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        token.role = user.email && adminEmails.includes(user.email) ? 'ADMIN' : 'USER';
      }
      return token;
    },
  },
  session: { strategy: 'jwt' as const },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return mock audit logs until we can fix Prisma client
    const mockAuditLogs = [
      {
        id: '1',
        userEmail: session.user.email,
        action: 'UPDATE',
        resource: 'hero',
        timestamp: new Date().toISOString(),
        changes: 'Updated main title and description'
      },
      {
        id: '2',
        userEmail: session.user.email,
        action: 'CREATE',
        resource: 'project',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        changes: 'Created new AI project'
      },
      {
        id: '3',
        userEmail: session.user.email,
        action: 'UPDATE',
        resource: 'team',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        changes: 'Added new team member'
      },
      {
        id: '4',
        userEmail: session.user.email,
        action: 'DELETE',
        resource: 'event',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        changes: 'Removed past event'
      },
      {
        id: '5',
        userEmail: session.user.email,
        action: 'UPDATE',
        resource: 'about',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        changes: 'Updated organization description'
      }
    ];

    return NextResponse.json(mockAuditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
} 