import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET() {
  try {
    const session = await getServerSession();
    
    console.log('Session:', session);
    console.log('Admin emails:', process.env.ADMIN_EMAILS);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'No session found',
        session: session 
      }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email);
    
    return NextResponse.json({ 
      success: true,
      user: session.user,
      isAdmin,
      adminEmails,
      message: 'Authentication test successful'
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 