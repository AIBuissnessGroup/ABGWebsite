import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    adminEmailsExists: !!process.env.ADMIN_EMAILS,
    adminEmailsLength: process.env.ADMIN_EMAILS?.length || 0,
    adminEmailsFirst50: process.env.ADMIN_EMAILS?.substring(0, 50) || 'undefined',
    nodeEnv: process.env.NODE_ENV
  });
}
