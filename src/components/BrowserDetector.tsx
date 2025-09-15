'use client';

import { useEffect, useState } from 'react';

interface BrowserDetectorProps {
  onEmbeddedBrowser?: () => void;
  children: React.ReactNode;
}

export default function BrowserDetector({ onEmbeddedBrowser, children }: BrowserDetectorProps) {
  const [isEmbeddedBrowser, setIsEmbeddedBrowser] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    
    // Detect common embedded browsers
    const embeddedBrowsers = [
      /Instagram/i,
      /FBAN/i, // Facebook app
      /FBAV/i, // Facebook app
      /TwitterMobile/i,
      /Line/i,
      /WhatsApp/i,
      /LinkedInApp/i,
      /Snapchat/i,
      /TikTok/i,
      /WeChat/i,
      /MicroMessenger/i,
      /YahooMobile/i,
      /GSA/i, // Google Search App
    ];

    const isEmbedded = embeddedBrowsers.some(regex => regex.test(userAgent));
    
    // Also check for WebView indicators
    const isWebView = /; wv\)/i.test(userAgent) || 
                      (window.navigator as any).standalone === false ||
                      /Version\/[\d.]+.*Safari/i.test(userAgent) === false;

    if (isEmbedded || isWebView) {
      setIsEmbeddedBrowser(true);
      setShowWarning(true);
      onEmbeddedBrowser?.();
    }
  }, [onEmbeddedBrowser]);

  if (showWarning && isEmbeddedBrowser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/80 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Browser Compatibility Notice</h1>
              <p className="text-yellow-200 mb-6">
                You're using an embedded browser that may not be compatible with Google sign-in.
              </p>
              
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-200 mb-2">To continue, please:</h3>
                <ul className="text-blue-100 space-y-2 text-sm text-left">
                  <li>• Tap the "..." or menu button in your app</li>
                  <li>• Select "Open in Browser" or "Open in Safari/Chrome"</li>
                  <li>• Or copy this URL and paste it in your browser</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.share) {
                      navigator.share({ url });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert('URL copied to clipboard! Paste it in your browser.');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Copy Link to Open in Browser
                </button>
                
                <button
                  onClick={() => setShowWarning(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}