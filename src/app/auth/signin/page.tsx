'use client';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';

export default function SignIn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get('callbackUrl') || '/admin';

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
        router.push(callbackUrl);
      }
    });
  }, [router, callbackUrl]);

  const handleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ABG Admin</h1>
          <p className="text-[#BBBBBB]">Content Management System</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-[#BBBBBB] text-sm">
              Sign in with your University of Michigan account to access the admin dashboard
            </p>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <FaGoogle className="text-xl" />
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#5e6472]">
              Only University of Michigan (@umich.edu) accounts are allowed
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-[#BBBBBB] hover:text-white text-sm underline"
          >
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
} 