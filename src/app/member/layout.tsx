'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldExclamationIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { canAccessMemberDashboard } from '@/lib/roles';
import { isAdmin } from '@/lib/admin';

interface MemberLayoutProps {
  children: React.ReactNode;
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/member');
    }
  }, [session, status, router]);

  // Loading state with Michigan branded glow
  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001730] via-[#00274c] to-[#0a192f] flex flex-col items-center justify-center p-4">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFCB05] to-[#FFE380] animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(255,203,5,0.35)]">
              <span className="text-[#00274c] font-black text-2xl tracking-wider">ABG</span>
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-[#FFCB05]/20 blur-md animate-ping" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-white/90 font-medium text-sm tracking-wide">Authenticating Member Access</p>
            <p className="text-white/40 text-xs">AI Business Group • University of Michigan</p>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in (handled by redirect, render null while redirecting)
  if (!session?.user) {
    return null;
  }

  const userRoles = session.user.roles || [];
  const userIsAdmin = isAdmin(session.user) || userRoles.includes('ADMIN');
  const userIsProjectTeamMember = userRoles.includes('PROJECT_TEAM_MEMBER');
  const isAuthorized = userIsAdmin || userIsProjectTeamMember || canAccessMemberDashboard(userRoles);

  // Unauthorized access screen - tailored specifically to Member Dashboard RBAC requirement
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001730] via-[#00274c] to-[#0a192f] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00274c]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full">
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
            {/* Shield Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
              <ShieldExclamationIcon className="w-9 h-9" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Member Access Required
            </h1>

            <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6">
              This space is exclusively reserved for active <span className="text-[#FFCB05] font-semibold">Project Team Members</span> and <span className="text-[#FFCB05] font-semibold">Administrators</span> of the AI Business Group.
            </p>

            {/* Signed-in Identity Card */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 uppercase tracking-wider font-semibold">Signed in as</span>
                <span className="text-white/40">{session.user.email}</span>
              </div>
              <div className="text-sm font-medium text-white truncate">
                {session.user.name || 'University of Michigan User'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-white/50 mr-1">Current roles:</span>
                {userRoles.length > 0 ? (
                  userRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/80 border border-white/10"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-white/40 italic">No special roles assigned</span>
                )}
              </div>
            </div>

            <p className="text-xs text-white/50 mb-6">
              If you have recently joined an ABG project team, please contact your project manager or an executive board administrator to assign your member permissions.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all duration-200"
              >
                <UserCircleIcon className="w-4 h-4" /> View My Profile
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFCB05] hover:bg-[#FFE380] text-[#00274c] font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <HomeIcon className="w-4 h-4" /> Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authorized: Render member shell
  return (
    <div className="min-h-screen bg-[#071326] text-white flex flex-col">
      {/* Top Member Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#001b3a]/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: ABG Logo + Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FFCB05] to-[#FFE380] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-[#00274c] font-black text-sm tracking-wider">ABG</span>
              </div>
              <span className="font-extrabold text-white text-base tracking-tight group-hover:text-[#FFCB05] transition-colors">
                MEMBER<span className="text-[#FFCB05]">HUB</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-white/30 text-xs">/</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFCB05]/15 text-[#FFCB05] border border-[#FFCB05]/30">
              {userIsAdmin ? 'Administrator' : 'Project Team Member'}
            </span>
          </div>

          {/* Right: Quick Links & User Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userIsAdmin && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-300 hover:text-yellow-100 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-300/30 transition-all"
                title="Switch to Admin Dashboard"
              >
                <WrenchScrewdriverIcon className="w-3.5 h-3.5" /> Admin Panel
              </Link>
            )}

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'Member'}
                  width={22}
                  height={22}
                  className="rounded-full ring-1 ring-white/20"
                />
              ) : (
                <UserCircleIcon className="w-4 h-4 text-[#FFCB05]" />
              )}
              <span className="max-w-[120px] truncate hidden sm:inline">{session.user.name || 'Profile'}</span>
            </Link>

            <Link
              href="/"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Return to Website"
            >
              <HomeIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#001730]/60 py-6 px-4 text-center text-xs text-white/40">
        <p>AI Business Group • Internal Member Workspace • University of Michigan</p>
      </footer>
    </div>
  );
}
