import { NextRequest, NextResponse } from 'next/server';
import { getAllSiteSettings } from '@/lib/site-content/settings';

export async function GET(request: NextRequest) {
  try {
    const settings = await getAllSiteSettings();
    const { searchParams } = new URL(request.url);
    const keys = searchParams.getAll('key');

    if (keys.length > 0) {
      const filtered = settings.filter((setting) => keys.includes(setting.key));
      return NextResponse.json(filtered);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching public site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
