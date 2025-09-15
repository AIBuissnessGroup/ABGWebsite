import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/abg-website';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip maintenance check for static assets, admin routes, auth, and maintenance page itself
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/admin/settings') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname === '/maintenance' ||
    pathname.includes('.') || // static files like .css, .js, .png, etc
    pathname.startsWith('/api/') // Skip API routes entirely to avoid conflicts
  ) {
    return NextResponse.next();
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    
    const maintenanceSetting = await db.collection('SiteSettings').findOne({ key: 'maintenance_mode' });
    await client.close();
    
    console.log('Middleware - maintenance check:', { 
      pathname, 
      maintenanceValue: maintenanceSetting?.value,
      shouldRedirect: maintenanceSetting?.value === 'true' 
    });
    
    if (maintenanceSetting?.value === 'true') {
      // Redirect to maintenance page
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error('Middleware - Error checking maintenance status:', error);
    // Continue normally if database is unavailable
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
