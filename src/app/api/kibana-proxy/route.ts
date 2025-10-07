import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import https from 'https';
import { URL } from 'url';
import zlib from 'zlib';

// Create an HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Custom fetch function that properly handles HTTPS agent and decompression
async function fetchWithAgent(url: string, options: any = {}) {
  const urlObj = new URL(url);
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: httpsAgent,
    };

    const req = https.request(requestOptions, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url);
        console.log(`Redirecting from ${url} to ${redirectUrl.toString()}`);
        return fetchWithAgent(redirectUrl.toString(), options).then(resolve).catch(reject);
      }

      let data = '';
      let decompressedStream: any = res;
      
      // Handle gzip/deflate/brotli decompression
      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        decompressedStream = zlib.createGunzip();
        res.pipe(decompressedStream);
      } else if (encoding === 'deflate') {
        decompressedStream = zlib.createInflate();
        res.pipe(decompressedStream);
      } else if (encoding === 'br') {
        decompressedStream = zlib.createBrotliDecompress();
        res.pipe(decompressedStream);
      }
      
      decompressedStream.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      
      decompressedStream.on('end', () => {
        resolve({
          ok: res.statusCode! >= 200 && res.statusCode! < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          headers: {
            get: (name: string) => res.headers[name.toLowerCase()],
          },
        });
      });
      
      decompressedStream.on('error', (error: Error) => {
        reject(error);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/app/dashboards';
    
    // Construct the Kibana URL
    const kibanaUrl = `https://159.89.33.25:5602${path}`;
    
    console.log('Kibana proxy request:', { path, kibanaUrl });
    
    // Fetch from Kibana server
    const response = await fetchWithAgent(kibanaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    }) as any;

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
    console.error('Kibana proxy error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      kibanaUrl: `https://159.89.33.25:5602${new URL(request.url).searchParams.get('path') || '/app/dashboards'}`,
    });
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
    
    if (!session?.user || !session.user.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    
    const kibanaUrl = `https://159.89.33.25:5602${path}`;
    const body = await request.text();

    const response = await fetchWithAgent(kibanaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: body,
    }) as any;

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