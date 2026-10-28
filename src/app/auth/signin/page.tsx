'use client';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { FaGoogle } from 'react-icons/fa';

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const [devLoadingRole, setDevLoadingRole] = useState<string | null>(null);
  console.log('SignIn page callbackUrl:', callbackUrl);

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];
      if (
        roles.includes('ADMIN') ||
        roles.includes('PROJECT_TEAM_MEMBER') ||
        (session?.user as any)?.role === 'ADMIN' ||
        (session?.user as any)?.role === 'SUPER_ADMIN'
      ) {
        router.push(callbackUrl);
      }
    });
  }, [router, callbackUrl]);

  const handleSignIn = () => {
    signIn('google', { 
      callbackUrl,
      redirect: false
    }).then((result) => {
      if (result?.error) {
        console.error('Sign in error:', result.error);
        // If there's an error, try opening in new window
        window.open(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`, '_blank');
      } else if (result?.url) {
        window.location.href = result.url;
      }
    });
  };

  const handleDevSignIn = async (role: string) => {
    try {
      setDevLoadingRole(role);
      const result = await signIn('dev-login', {
        role,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        console.error('Dev sign in error:', result.error);
        setDevLoadingRole(null);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Dev sign in exception:', err);
      setDevLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Login to AI Business Group</h1>
          <p className="text-[#BBBBBB]">Must use @umich.edu email</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome</h2>
            <p className="text-[#BBBBBB] text-sm">
              Sign in with your University of Michigan account.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 !text-gray-900 font-medium py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <FaGoogle className="text-xl !text-gray-900" />
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#5e6472]">
              Only University of Michigan (@umich.edu) accounts are allowed
            </p>
          </div>

          {/* Dev Fast-Login (Tree-shaken and excluded in production builds) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-white/15">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFCB05]/20 text-[#FFCB05] border border-[#FFCB05]/30">
                  🛠️ Local Dev Fast-Login
                </span>
              </div>
              <p className="text-white/60 text-xs text-center mb-4 leading-relaxed">
                Committee bypass for local development. Skips Google OAuth & connects directly.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={devLoadingRole !== null}
                  onClick={() => handleDevSignIn('PROJECT_TEAM_MEMBER')}
                  className="w-full flex items-center justify-center gap-2 bg-[#FFCB05] hover:bg-[#FFE380] text-[#00274c] font-bold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-sm cursor-pointer"
                >
                  {devLoadingRole === 'PROJECT_TEAM_MEMBER' ? (
                    'Connecting...'
                  ) : (
                    <span>🔑 Sign in as Project Team Member</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={devLoadingRole !== null}
                  onClick={() => handleDevSignIn('ADMIN')}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg border border-white/20 transition-all duration-200 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {devLoadingRole === 'ADMIN' ? 'Connecting...' : '🛡️ Sign in as Admin'}
                </button>

                <button
                  type="button"
                  disabled={devLoadingRole !== null}
                  onClick={() => handleDevSignIn('USER')}
                  className="w-full flex items-center justify-center gap-2 bg-black/30 hover:bg-black/50 text-white/70 hover:text-white py-2 px-3 rounded-lg border border-white/10 transition-all duration-200 disabled:opacity-50 text-xs cursor-pointer"
                >
                  {devLoadingRole === 'USER' ? 'Connecting...' : '👤 Sign in as Regular User (Test Unauthorized)'}
                </button>
              </div>
            </div>
          )}
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

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}