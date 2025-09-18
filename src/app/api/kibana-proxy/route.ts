import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/app/dashboards';
    
    // Construct the Kibana URL
    const kibanaUrl = `https://159.89.33.25:5602${path}`;
    
    // Fetch from Kibana server
    const response = await fetch(kibanaUrl, {
      headers: {
        'User-Agent': 'ABG-Website-Proxy/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      // Ignore SSL certificate issues for now
      // @ts-ignore
      rejectUnauthorized: false,
    });

    if (!response.ok) {
      throw new Error(`Kibana server responded with ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    // Modify the HTML content to work properly in our context
    const modifiedContent = content
      // Remove X-Frame-Options restrictions
      .replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '')
      // Ensure relative URLs work correctly
      .replace(/src=["']\/([^"']*?)["']/g, `src="https://159.89.33.25:5602/$1"`)
      .replace(/href=["']\/([^"']*?)["']/g, `href="https://159.89.33.25:5602/$1"`)
      // Add base tag to ensure all relative URLs work
      .replace(/<head>/i, '<head><base href="https://159.89.33.25:5602/">');

    return new NextResponse(modifiedContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Explicitly allow framing
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self' *;",
        // Prevent caching to ensure fresh data
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Kibana proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Kibana content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    const kibanaUrl = `https://159.89.33.25:5602${path}`;
    const body = await request.text();

    const response = await fetch(kibanaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': 'ABG-Website-Proxy/1.0',
      },
      body: body,
      // @ts-ignore
      rejectUnauthorized: false,
    });

    const responseData = await response.text();
    
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self' *;",
      },
    });

  } catch (error) {
    console.error('Kibana proxy POST error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy POST request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}