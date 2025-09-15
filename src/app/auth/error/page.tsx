'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return 'Access was denied. Please make sure you are using a @umich.edu email address.';
      case 'Verification':
        return 'Unable to sign in. Please try again.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'There was a problem with the sign-in process. This might be due to using an embedded browser.';
      case 'OAuthAccountNotLinked':
        return 'Email address is already associated with another account.';
      case 'EmailSignin':
        return 'Unable to send email.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unknown error occurred during sign in.';
    }
  };

  const getErrorSolution = (error: string | null) => {
    if (error === 'OAuthSignin' || error === 'OAuthCallback' || error === 'Callback') {
      return (
        <div className="space-y-4">
          <p className="text-gray-300">
            If you're seeing this error, it might be because you're using an embedded browser (like those in social media apps).
          </p>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-blue-200 mb-2">Try these solutions:</h3>
            <ul className="text-blue-100 space-y-2 text-sm">
              <li>• Open this link in your device's default browser (Safari, Chrome, Firefox)</li>
              <li>• If you're in a social media app, tap "Open in Browser" or similar option</li>
              <li>• Copy this URL and paste it in a new browser tab</li>
              <li>• Try using an incognito/private browsing window</li>
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/80 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Sign In Error</h1>
            <p className="text-red-200 mb-6">
              {getErrorMessage(error)}
            </p>
            
            {getErrorSolution(error)}
            
            <div className="mt-8 space-y-4">
              <Link
                href="/auth/signin"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl block text-center"
              >
                Try Sign In Again
              </Link>
              
              <Link
                href="/"
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 block text-center"
              >
                Return Home
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-gray-400 text-sm">
                Need help? Contact{' '}
                <a href="mailto:support@abgumich.org" className="text-blue-300 hover:text-blue-200">
                  support@abgumich.org
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-500/80 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Loading...</h1>
            <p className="text-gray-300">Checking authentication status...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}