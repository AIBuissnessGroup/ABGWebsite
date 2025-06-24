import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Helper function to log changes (simplified for now)
async function logChange(userId: string, userEmail: string, action: string, resource: string, resourceId?: string, changes?: any) {
  try {
    // For now, just console.log - we'll implement proper audit logging after Prisma is fixed
    console.log('AUDIT LOG:', { userId, userEmail, action, resource, resourceId, changes });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return default join content for now
    const defaultJoinContent = {
      id: 'default',
      title: "JOIN THE FUTURE",
      subtitle: "Ready to shape tomorrow's business landscape? Multiple ways to get involved with ABG's mission to revolutionize how AI and business intersect.",
      option1Title: "BECOME A MEMBER",
      option1Description: "Join our core team and work on cutting-edge AI projects that solve real business problems.",
      option1Benefits: "Direct project involvement\nMentorship opportunities\nIndustry networking\nSkill development",
      option1CTA: "Apply Now",
      option1Link: "#",
      option2Title: "PARTNER WITH US",
      option2Description: "Collaborate on research, sponsor events, or provide mentorship to our growing community.",
      option2Benefits: "Strategic partnerships\nTalent pipeline access\nInnovation collaboration\nBrand visibility",
      option2CTA: "Explore Partnership",
      option2Link: "mailto:partnerships@abg-umich.com",
      option3Title: "STAY CONNECTED",
      option3Description: "Get updates on our latest projects, events, and opportunities in the AI business space.",
      option3Benefits: "Weekly insights\nEvent invitations\nProject showcases\nIndustry updates",
      option3CTA: "Subscribe",
      contactTitle: "QUESTIONS? LET'S CONNECT",
      contactEmail1: "info@abg-umich.com",
      contactEmail2: "partnerships@abg-umich.com",
      contactEmail3: "careers@abg-umich.com",
      isActive: true,
      updatedAt: new Date()
    };

    return NextResponse.json(defaultJoinContent);
  } catch (error) {
    console.error('Error fetching join content:', error);
    return NextResponse.json({ error: 'Failed to fetch join content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();

    // For now, just return the updated data (we'll implement database storage after Prisma is fixed)
    const updatedContent = {
      id: 'default',
      ...data,
      isActive: true,
      updatedAt: new Date()
    };

    // Log the change
    await logChange(
      user.id,
      user.email,
      'UPDATE',
      'join',
      'default',
      { updated: data }
    );

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating join content:', error);
    return NextResponse.json({ error: 'Failed to update join content' }, { status: 500 });
  }
} 