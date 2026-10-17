'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  SparklesIcon,
  QrCodeIcon,
  UserCircleIcon,
  FolderGit2Icon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export default function MemberDashboardPage() {
  const { data: session } = useSession();

  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.includes('ADMIN');
  const isProjectMember = userRoles.includes('PROJECT_TEAM_MEMBER');

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00274c] via-[#003870] to-[#0a2540] border border-white/15 p-6 sm:p-10 shadow-2xl">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#FFCB05]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFCB05]/20 text-[#FFCB05] border border-[#FFCB05]/30">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Business Group Internal Member Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFCB05] to-[#FFE380]">
                {session?.user?.name ? session.user.name.split(' ')[0] : 'Member'}
              </span>{' '}
              👋
            </h1>

            <p className="text-white/75 text-sm sm:text-base max-w-2xl leading-relaxed">
              Your central command center for AI Business Group projects, meeting check-ins, internal resources, and team collaboration.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-white/60">
              <span>📅 {currentDate}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 text-green-400">
                <CheckBadgeIcon className="w-4 h-4" />
                Active Cohort Status: Verified
              </span>
            </div>
          </div>

          {/* Quick status pill card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[240px] flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">Assigned Role</span>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFCB05] animate-pulse" />
              {isAdmin ? 'Administrator' : isProjectMember ? 'Project Team Member' : 'Member'}
            </div>
            <p className="text-xs text-white/60">
              {isAdmin
                ? 'Full administrative privileges across projects and platform.'
                : 'Granted access to project repositories, team syncs, and internal tools.'}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1: Meeting Check-in */}
        <Link
          href="/checkin"
          className="group relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFCB05]/50 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFCB05]/15 text-[#FFCB05] flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCodeIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#FFCB05] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Launch →
            </span>
          </div>
          <h2 className="font-bold text-white text-base mb-1">Meeting Check-in</h2>
          <p className="text-xs text-white/60">Check into all-hands, committee meetings, or project standups via code.</p>
        </Link>

        {/* Action 2: Team Member Profile */}
        <Link
          href="/profile"
          className="group relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCircleIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Edit →
            </span>
          </div>
          <h2 className="font-bold text-white text-base mb-1">My Member Profile</h2>
          <p className="text-xs text-white/60">Update bio, LinkedIn, GitHub, and active project team tags.</p>
        </Link>

        {/* Action 3: Browse Projects */}
        <Link
          href="/projects"
          className="group relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CodeBracketIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Explore →
            </span>
          </div>
          <h2 className="font-bold text-white text-base mb-1">Active Projects</h2>
          <p className="text-xs text-white/60">Explore all engineering, research, and client consulting initiatives.</p>
        </Link>

        {/* Action 4: Calendar & Events */}
        <Link
          href="/events"
          className="group relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/50 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDaysIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Schedule →
            </span>
          </div>
          <h2 className="font-bold text-white text-base mb-1">Events & Calendar</h2>
          <p className="text-xs text-white/60">Upcoming workshops, tech talks, speaker series, and networking nights.</p>
        </Link>
      </section>

      {/* Main Dashboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Project Workspace & Sprint Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Project Team Hub */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFCB05]/20 text-[#FFCB05] flex items-center justify-center">
                  <FolderGit2Icon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Project Workstream Hub</h3>
              </div>
              <Link
                href="/profile"
                className="text-xs font-semibold text-[#FFCB05] hover:text-[#FFE380] hover:underline"
              >
                Manage project tag in Profile →
              </Link>
            </div>

            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              As a verified project team member, you are authorized to represent your team on the public directory, contribute to sprint deliverables, and access project resources.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/25 border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-xs uppercase font-semibold tracking-wider text-[#FFCB05]">Contribution Guidelines</span>
                <p className="text-xs text-white/70 leading-relaxed">
                  Keep your bio, GitHub link, and project assignments up to date on your profile page to ensure your work appears correctly on the public website.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 pt-1 font-medium"
                >
                  Edit your profile details →
                </Link>
              </div>

              <div className="bg-black/25 border border-white/10 rounded-xl p-4 space-y-2">
                <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">Meeting Attendance</span>
                <p className="text-xs text-white/70 leading-relaxed">
                  Active attendance tracking is recorded for all weekly team syncs and general meetings. Use the check-in portal when attending sessions.
                </p>
                <Link
                  href="/checkin"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 pt-1 font-medium"
                >
                  Open check-in portal →
                </Link>
              </div>
            </div>
          </div>

          {/* Card: Upcoming Meeting & Attendance Hub */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <CalendarDaysIcon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Cohort Schedule & Attendance</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                Winter 2026
              </span>
            </div>

            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Meeting check-ins open 15 minutes prior to scheduled session times and require location or meeting-specific passcodes.
            </p>

            <div className="border border-white/10 rounded-xl bg-black/20 divide-y divide-white/10">
              <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Weekly General All-Hands Meeting</h4>
                  <p className="text-xs text-white/60">Ross School of Business • Room R1240 / Hybrid</p>
                </div>
                <Link
                  href="/checkin"
                  className="px-3 py-1.5 rounded-lg bg-[#FFCB05] hover:bg-[#FFE380] text-[#00274c] text-xs font-bold transition-colors"
                >
                  Check In
                </Link>
              </div>

              <div className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Project Workstream Standup</h4>
                  <p className="text-xs text-white/60">Coordinated by Project Managers • Weekly Syncs</p>
                </div>
                <span className="text-xs text-white/40 italic">Check with Project Lead</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Internal Links & Community Resources */}
        <div className="space-y-6">
          {/* Card: Community & Collaboration Links */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#FFCB05]" />
              Internal Communication
            </h3>

            <p className="text-xs text-white/60 leading-relaxed">
              Stay connected with your project team and committee leads across internal channels.
            </p>

            <div className="space-y-2">
              <a
                href="https://join.slack.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-black/25 hover:bg-black/40 border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-white/90 group"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">💬</span> ABG Slack Workspace
                </span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-white/40 group-hover:text-white" />
              </a>

              <a
                href="https://github.com/AIBuissnessGroup"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-black/25 hover:bg-black/40 border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-white/90 group"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">🐙</span> GitHub Organization
                </span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-white/40 group-hover:text-white" />
              </a>

              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-black/25 hover:bg-black/40 border border-white/10 hover:border-white/20 transition-all text-xs font-medium text-white/90 group"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">📁</span> Shared Drive & Templates
                </span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-white/40 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Card: Admin Shortcut (if admin) */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-400/20 rounded-2xl p-6 backdrop-blur-md space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Admin Control</span>
              <h4 className="text-sm font-bold text-white">Executive Back-Office</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                As an administrator, you have access to the full management dashboard for cycles, forms, members, and analytics.
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold text-xs shadow-md transition-all"
              >
                Open Admin Dashboard →
              </Link>
            </div>
          )}

          {/* Card: Member Support */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Need Help?</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Have questions regarding team assignments, attendance, or role permissions? Contact the VP of Technology or President on Slack.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
