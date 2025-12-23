'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAccessDeniedMessage, AdminPage } from '@/lib/permissions';

export default function AccessDeniedPage() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') as AdminPage | null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {page 
              ? getAccessDeniedMessage(page)
              : 'You do not have permission to access this page.'}
          </p>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Need access to this page?
            </p>
            <p className="text-sm text-blue-800">
              Contact the <strong>President</strong> or an <strong>Administrator</strong> to request the appropriate role for your responsibilities.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Admin Dashboard
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Your role determines which admin pages you can access.<br />
            Current roles are managed by system administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
