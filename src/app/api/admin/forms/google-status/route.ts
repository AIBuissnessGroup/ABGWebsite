import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check what's available
    const hasApiKey = !!process.env.GOOGLE_FORMS_API_KEY;
    const hasOAuthToken = !!session.accessToken;

    // Test API key if available
    let apiKeyWorks = false;
    if (hasApiKey) {
      try {
        // Test with a simple API call (this will fail but we can check the error type)
        const testResponse = await fetch(`https://forms.googleapis.com/v1/forms/test?key=${process.env.GOOGLE_FORMS_API_KEY}`);
        // If we get 400, API key is valid but form doesn't exist (expected)
        // If we get 403, API key is invalid or API not enabled
        apiKeyWorks = testResponse.status === 400;
      } catch (error) {
        console.log('API key test failed:', error);
      }
    }

    // Test OAuth token if available
    let oauthWorks = false;
    if (hasOAuthToken) {
      try {
        const testResponse = await fetch('https://forms.googleapis.com/v1/forms/test', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json',
          }
        });
        // Similar logic - 400 means token works, 401/403 means issues
        oauthWorks = testResponse.status === 400;
      } catch (error) {
        console.log('OAuth test failed:', error);
      }
    }

    return NextResponse.json({
      status: {
        hasApiKey,
        hasOAuthToken,
        apiKeyWorks,
        oauthWorks,
        userEmail: session.user.email
      },
      recommendations: [
        ...(!hasOAuthToken ? ['Re-authenticate to get Google Forms API access'] : []),
        ...(!hasApiKey && !oauthWorks ? ['Set up GOOGLE_FORMS_API_KEY as fallback'] : []),
        ...(!apiKeyWorks && hasApiKey ? ['Check if Google Forms API is enabled in Google Cloud Console'] : [])
      ]
    });

  } catch (error) {
    console.error('Error checking Google Forms API status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}