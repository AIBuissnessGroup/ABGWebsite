'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Unauthorized() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Message */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-[#BBBBBB] text-sm mb-4">
              You don't have permission to access the admin dashboard.
            </p>
          </div>

          {session?.user ? (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-[#BBBBBB] mb-2">Signed in as:</p>
              <p className="text-white font-medium">{session.user.email}</p>
              <p className="text-xs text-[#5e6472] mt-1">Role: {session.user.role || 'USER'}</p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-[#BBBBBB]">You are not signed in.</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-[#BBBBBB]">
              Only authorized University of Michigan users can access the admin panel.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/signin"
                className="bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-6 rounded-lg transition-all duration-200"
              >
                Try Different Account
              </Link>
              
              <Link
                href="/"
                className="text-[#BBBBBB] hover:text-white text-sm underline"
              >
                ← Back to Website
              </Link>
            </div>
          </div>
        </div>

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-black/20 rounded-lg border border-white/10 text-left">
            <h3 className="text-white font-medium mb-2">Debug Info:</h3>
            <div className="text-xs text-[#BBBBBB] space-y-1">
              <p>Email: {session?.user?.email || 'Not signed in'}</p>
              <p>Role: {session?.user?.role || 'None'}</p>
              <p>Required: ADMIN or SUPER_ADMIN</p>
              <p className="text-yellow-300 mt-2">
                Add your email to ADMIN_EMAILS in .env file
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 