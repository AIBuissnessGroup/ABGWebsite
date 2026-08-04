import { getDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Public endpoint — no auth required. Returns the active website theme flags.
export async function GET() {
  try {
    const db = await getDb();
    const setting = await db
      .collection('SiteSettings')
      .findOne({ key: 'theme_f1_2026_fall' });

    return NextResponse.json({
      // null = no explicit record stored; clients should keep their own default
      f1_2026_fall: setting != null ? (setting.value === 'true' || setting.value === true) : null,
    });
  } catch (error) {
    console.error('Error fetching theme setting:', error);
    // Return null on error so clients keep their own default
    return NextResponse.json({ f1_2026_fall: null });
  }
}
