'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { FaLinkedin } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import RoundTracker from '@/components/portal/RoundTracker';
import { getTrackLabel } from '@/lib/tracks';
import type { PortalDashboard, ApplicationStage } from '@/types/recruitment';

const STAGE_INFO: Record<ApplicationStage, { label: string; description: string; color: string }> = {
  not_started: { label: 'Not Started', description: 'Begin your application', color: 'bg-gray-100 text-gray-700' },
  draft: { label: 'In Progress', description: 'Continue your application', color: 'bg-yellow-100 text-yellow-800' },
  submitted: { label: 'Submitted', description: 'Application under initial review', color: 'bg-blue-100 text-blue-800' },
  under_review: { label: 'Under Review', description: 'Our team is reviewing your application', color: 'bg-purple-100 text-purple-800' },
  coffee_chat: { label: 'Coffee Chat Stage', description: 'Book a coffee chat with a member', color: 'bg-amber-100 text-amber-800' },
  interview_round1: { label: 'Interview Round 1', description: 'You have been invited to interview', color: 'bg-indigo-100 text-indigo-800' },
  interview_round2: { label: 'Interview Round 2', description: 'You have advanced to final interviews', color: 'bg-pink-100 text-pink-800' },
  final_review: { label: 'Final Review', description: 'Final decisions are being made', color: 'bg-cyan-100 text-cyan-800' },
  waitlisted: { label: 'Waitlisted', description: 'You are on our waitlist', color: 'bg-orange-100 text-orange-800' },
  accepted: { label: 'Accepted', description: 'Welcome to ABG!', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Not Selected', description: 'Thank you for applying', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Withdrawn', description: 'Application withdrawn', color: 'bg-gray-100 text-gray-500' },
};

export default function PortalDashboardPage() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="portal-spinner"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="portal-alert portal-alert-error rounded-xl p-6 text-center">
        <ExclamationCircleIcon className="w-12 h-12 portal-icon-error mx-auto mb-3" />
        <p className="text-red-700">{error || 'Something went wrong'}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard.activeCycle) {
    return (
      <div className="portal-card portal-empty-state">
        <CalendarDaysIcon className="portal-empty-state-icon" />
        <h2 className="portal-empty-state-title">No Active Recruitment</h2>
        <p className="portal-empty-state-description max-w-md mx-auto">
          There is no active recruitment cycle at the moment. Check back later or follow us on social media for updates!
        </p>
      </div>
    );
  }

  const cycle = dashboard.activeCycle;
  const application = dashboard.application;
  const stageInfo = application ? STAGE_INFO[application.stage] : STAGE_INFO.not_started;

  return (
    <div className="space-y-6">
      {/* LinkedIn-Shareable Welcome Card - Show for accepted applicants */}
      {application?.stage === 'accepted' && (
        <div className="relative overflow-hidden">
          {/* Main Shareable Card */}
          <div 
            id="linkedin-share-card"
            className="relative rounded-2xl p-8 overflow-hidden"
          >
            {/* Background Image Layer */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/IMG_0819.jpeg)', filter: 'blur(1px)' }}
            ></div>
            
            {/* Gradient Overlay on top of image */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00274c]/80 via-[#1e3a5f]/70 to-[#00274c]/80"></div>
            
            {/* Decorative Elements - Brighter */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-yellow-400/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/40 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-400/15 to-blue-400/15 rounded-full blur-3xl"></div>
            
            {/* Falling Snowflakes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="snowflake absolute text-xs" style={{ left: '5%', animationDelay: '0s' }}>❄</div>
              <div className="snowflake absolute text-sm" style={{ left: '15%', animationDelay: '1s' }}>❄</div>
              <div className="snowflake absolute text-xs" style={{ left: '25%', animationDelay: '2s' }}>❄</div>
              <div className="snowflake absolute text-base" style={{ left: '35%', animationDelay: '0.5s' }}>❄</div>
              <div className="snowflake absolute text-xs" style={{ left: '45%', animationDelay: '1.5s' }}>❄</div>
              <div className="snowflake absolute text-sm" style={{ left: '55%', animationDelay: '2.5s' }}>❄</div>
              <div className="snowflake absolute text-xs" style={{ left: '65%', animationDelay: '0.8s' }}>❄</div>
              <div className="snowflake absolute text-base" style={{ left: '75%', animationDelay: '1.8s' }}>❄</div>
              <div className="snowflake absolute text-sm" style={{ left: '85%', animationDelay: '2.2s' }}>❄</div>
              <div className="snowflake absolute text-xs" style={{ left: '95%', animationDelay: '0.3s' }}>❄</div>
              <div className="snowflake absolute text-xs" style={{ left: '10%', animationDelay: '3s' }}>❄</div>
              <div className="snowflake absolute text-sm" style={{ left: '30%', animationDelay: '3.5s' }}>❄</div>
              <div className="snowflake absolute text-xs" style={{ left: '50%', animationDelay: '4s' }}>❄</div>
              <div className="snowflake absolute text-base" style={{ left: '70%', animationDelay: '4.5s' }}>❄</div>
              <div className="snowflake absolute text-sm" style={{ left: '90%', animationDelay: '5s' }}>❄</div>
            </div>
            
            {/* Animated Stars/Sparkles */}
            <div className="linkedin-star-gold absolute top-8 right-12 text-2xl animate-pulse">✦</div>
            <div className="linkedin-star-gold absolute top-20 right-28 text-lg animate-pulse delay-300">✦</div>
            <div className="linkedin-star-gold absolute bottom-12 right-20 text-xl animate-pulse delay-500">✦</div>
            <div className="linkedin-star-blue absolute top-16 left-16 text-lg animate-pulse delay-700">✧</div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header with Logo */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                    <Image 
                      src="/logo.png" 
                      alt="ABG Logo" 
                      width={48} 
                      height={48} 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm tracking-wider uppercase">AI Business Group</p>
                    <p className="linkedin-text-muted text-xs">University of Michigan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="linkedin-text-muted text-xs">{cycle.name?.split(' ')[0] || 'Winter'} {new Date().getFullYear()}</p>
                </div>
              </div>

              {/* Main Message */}
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/20 to-white/30 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-semibold text-sm">Official Member</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  Welcome to ABG!
                </h1>
                
                <p className="text-xl font-medium mb-2">
                  {session?.user?.name || 'New Member'}
                </p>
                
                <p className="linkedin-text-muted max-w-md mx-auto text-sm">
                  Thrilled to join the AI Business Group at the University of Michigan as a new member!
                </p>
              </div>

              {/* Track Badge */}
              {application?.track && (
                <div className="flex justify-center mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
                    <p className="font-semibold">{getTrackLabel(application.track)}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <p className="linkedin-text-subtle text-xs">abgumich.org</p>
                <div className="linkedin-text-subtle flex items-center gap-3 text-xs">
                  <span>#ABGMember</span>
                  <span>#UMich</span>
                  <span>#AIBusinessGroup</span>
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Share Prompt - Below the card */}
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-[#0077b5] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FaLinkedin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Share Your Achievement!</h3>
                  <p className="text-gray-600 text-sm">
                    Screenshot the card above and share it on LinkedIn! Tag us!
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white/70 rounded-lg border border-blue-100">
              <p className="text-gray-600 text-xs">
                <span className="font-medium text-gray-700">Suggested caption:</span> &quot;Excited to announce that I&apos;ve been accepted into the AI Business Group at the University of Michigan! Looking forward to working on impactful AI projects with this incredible team. 🎉 #ABG #UMich #AIBusinessGroup&quot;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Original Accepted Info (less prominent, for details) */}
      {application?.stage === 'accepted' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 mb-1">Next Steps</h3>
              <p className="text-green-700 text-sm">
                Please check your email for onboarding information and next steps. We&apos;re excited to have you on the team!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interview Round 1 Banner - Show instructions for R1 */}
      {application?.stage === 'interview_round1' && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CalendarDaysIcon className="w-8 h-8 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-indigo-800 mb-2">
                You Have Been Invited to Interview Round 1
              </h2>
              <p className="text-indigo-700 mb-3">
                Congratulations! Your application has been selected for the first round of interviews.
              </p>
              <p className="text-indigo-700 mb-2 font-semibold">
                Next Steps:
              </p>
              <ol className="list-decimal list-inside text-indigo-700 space-y-1 mb-3">
                <li>Go to the <span className="font-semibold">Schedule</span> tab above</li>
                <li>Select a time slot for your Round 1 interview</li>
                <li>Add the interview to your Google Calendar</li>
              </ol>
              <p className="text-indigo-600 text-sm">
                Make sure to select a time that works for you as soon as possible!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interview Round 2 Banner - Show instructions for R2 */}
      {application?.stage === 'interview_round2' && (
        <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CalendarDaysIcon className="w-8 h-8 text-pink-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-pink-800 mb-2">
                You Have Advanced to Interview Round 2
              </h2>
              <p className="text-pink-700 mb-3">
                Great job! You have made it to the final round of interviews.
              </p>
              <div className="bg-pink-100 border border-pink-300 rounded-lg p-3 mb-3">
                <p className="text-pink-800 font-semibold mb-1">⚠️ Important:</p>
                <p className="text-pink-700">
                  Your calendar must be clear on <span className="font-bold">January 30th afternoon</span> if you wish to interview.
                </p>
              </div>
              <p className="text-pink-700 mb-2 font-semibold">
                Next Steps:
              </p>
              <ol className="list-decimal list-inside text-pink-700 space-y-1 mb-3">
                <li>Go to the <span className="font-semibold">Schedule</span> tab above</li>
                <li>Select your Round 2 interview time slot</li>
                <li>Add the interview to your Google Calendar</li>
              </ol>
              <p className="text-pink-600 text-sm">
                This is the final step before decisions are made. Good luck!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Banner - Show prominently for rejected applicants */}
      {application?.stage === 'rejected' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ExclamationCircleIcon className="w-8 h-8 text-red-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Thank You for Applying
              </h2>
              <p className="text-red-700 mb-3">
                After careful consideration, we regret to inform you that we are unable to move forward with your application at this time. 
                We received many strong applications this cycle and the decision was very difficult.
              </p>
              <p className="text-red-600 text-sm mb-2">
                Please note that due to the high volume of applications, we are unable to provide individual feedback.
              </p>
              <p className="text-red-600 text-sm">
                We encourage you to apply again in future recruitment cycles. Thank you for your interest in ABG!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* General Membership Option - Show for rejected applicants or as alternative */}
      {application?.stage === 'rejected' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-8 h-8 text-blue-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-800 mb-2">
                We encourage you to join ABG as a General Member
              </h2>
              <p className="text-blue-700 mb-3">
                You can still be part of the ABG community! General members have access to our events 
                and networking opportunities.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://www.venmo.com/u/ABG-UM" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium !text-white"
                >
                  <span style={{ color: '#ffffff' }}>Pay Dues & Join</span>
                  <ArrowRightIcon className="w-4 h-4" style={{ color: '#ffffff' }} />
                </a>
                <span className="text-blue-600 text-sm">via Venmo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round Tracker - Show progress through recruitment rounds */}
      {dashboard.roundTracker && application && !['not_started', 'withdrawn'].includes(application.stage) && (
        <RoundTracker tracker={dashboard.roundTracker} />
      )}

      {/* Welcome Header */}
      <div className="portal-welcome-banner">
        <h1>Welcome to {cycle.name}</h1>
        <p>
          {cycle.applicationDueAt 
            ? `Applications due by ${new Date(cycle.applicationDueAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}`
            : 'Application period open'}
        </p>
      </div>

      {/* Application Status */}
      <div className="portal-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1 portal-text-primary">Application Status</h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
                {application?.track && (
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                    {getTrackLabel(application.track)}
                  </span>
                )}
              </div>
              <p className="portal-text-secondary mt-2">{stageInfo.description}</p>
            </div>
            
            {(!application || application.stage === 'not_started' || application.stage === 'draft') && (
              <Link
                href="/portal/application"
                className="portal-btn-primary flex items-center gap-2"
              >
                {application?.stage === 'draft' ? 'Continue' : 'Start'} Application
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>

          {application?.submittedAt && (
            <p className="text-sm portal-text-muted mt-4">
              Submitted on {new Date(application.submittedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {application && !['rejected', 'withdrawn'].includes(application.stage) && (
          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span>Progress</span>
            </div>
            <div className="flex gap-1">
              {['submitted', 'under_review', 'interview_round1', 'interview_round2', 'accepted'].map((stage, idx) => {
                const stages = ['submitted', 'under_review', 'interview_round1', 'interview_round2', 'accepted'];
                const currentIdx = stages.indexOf(application.stage);
                const isComplete = idx <= currentIdx;
                const isCurrent = stage === application.stage;
                
                return (
                  <div
                    key={stage}
                    className={`flex-1 h-2 rounded ${
                      isComplete 
                        ? isCurrent 
                          ? 'bg-blue-600' 
                          : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upcoming Events */}
        <Link
          href="/portal/events"
          className="portal-card p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold portal-text-primary">Events</h3>
          </div>
          <p className="text-sm portal-text-secondary">
            {dashboard.upcomingEvents.length > 0
              ? `${dashboard.upcomingEvents.length} upcoming event${dashboard.upcomingEvents.length > 1 ? 's' : ''}`
              : 'No upcoming events'}
          </p>
          {dashboard.upcomingEvents.length > 0 && (
            <p className="text-xs portal-text-muted mt-1">
              Next: {dashboard.upcomingEvents[0].title} on{' '}
              {new Date(dashboard.upcomingEvents[0].startAt).toLocaleDateString()}
            </p>
          )}
        </Link>

        {/* Scheduled Meetings */}
        <Link
          href="/portal/schedule"
          className="portal-card p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold portal-text-primary">Schedule</h3>
          </div>
          <p className="text-sm portal-text-secondary">
            {dashboard.myBookings.length > 0
              ? `${dashboard.myBookings.length} scheduled meeting${dashboard.myBookings.length > 1 ? 's' : ''}`
              : 'No meetings scheduled'}
          </p>
          {dashboard.availableSlots.length > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              {dashboard.availableSlots.length} slots available to book
            </p>
          )}
        </Link>

        {/* Application */}
        <Link
          href="/portal/application"
          className="portal-card p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold portal-text-primary">Application</h3>
          </div>
          <p className="text-sm portal-text-secondary">
            {application?.stage === 'submitted' 
              ? 'View your submitted application'
              : application?.stage === 'draft'
              ? 'Continue your draft'
              : 'Start your application'}
          </p>
        </Link>
      </div>

      {/* RSVPs */}
      {dashboard.myRsvps.length > 0 && (
        <div className="portal-card overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold portal-text-primary">Your RSVPs</h3>
          </div>
          <div className="divide-y">
            {dashboard.myRsvps.map((rsvp) => (
              <div key={rsvp._id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium portal-text-primary">{rsvp.eventTitle || 'Event'}</p>
                  <p className="text-sm portal-text-muted">
                    {/* Event date would come from joined data */}
                    RSVP'd on {new Date(rsvp.rsvpAt).toLocaleDateString()}
                  </p>
                </div>
                {rsvp.attendedAt ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircleIcon className="w-4 h-4" />
                    Attended
                  </span>
                ) : (
                  <span className="text-sm portal-text-muted">Confirmed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
