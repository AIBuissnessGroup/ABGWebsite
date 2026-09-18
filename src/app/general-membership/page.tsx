import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  PresentationChartLineIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  MegaphoneIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Footer from '@/components/Footer';
import FloatingShapes from '@/components/FloatingShapes';

export const metadata: Metadata = {
  title: 'General Membership | AI Business Group (ABG)',
  description:
    'Become a General Member of the AI Business Group at the University of Michigan. Access general meetings, high-profile speaker panels, and hands-on committee leadership experience.',
};

export default function GeneralMembershipPage() {
  const committees = [
    {
      name: 'Tech Committee',
      icon: CodeBracketIcon,
      accent: 'from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30',
      badge: 'Engineering & Product',
      description:
        'Build and maintain ABG’s web infrastructure, develop proprietary AI tooling, automate internal operations, and architect interactive digital platforms for club initiatives.',
      skills: ['Full-Stack Development', 'AI Tooling', 'System Architecture', 'DevOps & Cloud'],
    },
    {
      name: 'Marketing Committee',
      icon: MegaphoneIcon,
      accent: 'from-purple-500/20 to-pink-500/20 text-pink-300 border-pink-500/30',
      badge: 'Brand & Creative',
      description:
        'Lead club brand strategy, spearhead campus-wide promotional campaigns, produce viral video/creative content, and drive social media engagement across LinkedIn and Instagram.',
      skills: ['Brand Strategy', 'Graphic Design', 'Social Media Growth', 'Campaign Production'],
    },
    {
      name: 'Client Acquisition',
      icon: BriefcaseIcon,
      accent: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30',
      badge: 'Business Development',
      description:
        'Initiate outreach to prospective enterprise partners, engage corporate sponsors, negotiate client relationships, and identify real-world AI use cases for project engagements.',
      skills: ['B2B Sales & Outreach', 'Corporate Pitching', 'Partnership Development', 'Contract Scoping'],
    },
    {
      name: 'Finance Committee',
      icon: CurrencyDollarIcon,
      accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
      badge: 'Treasury & Operations',
      description:
        'Manage club treasury and semester budgeting, oversee revenue from sponsorships and membership dues, track resource allocation, and optimize organizational expenditures.',
      skills: ['Financial Modeling', 'Budgeting & Treasury', 'Sponsorship Management', 'Resource Optimization'],
    },
    {
      name: 'Conference Committee',
      icon: CalendarDaysIcon,
      accent: 'from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/30',
      badge: 'Flagship Event',
      description:
        'Orchestrate Michigan’s premier AI Business Conference. Secure keynote speakers, coordinate multi-panel logistics, oversee catering and venue operations, and manage sponsor relations.',
      skills: ['Event Planning', 'Speaker Curation', 'Large-Scale Logistics', 'VIP Coordination'],
    },
  ];

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35] text-white pt-24 sm:pt-28 pb-0 overflow-hidden">
      {/* Floating Background Shapes */}
      <FloatingShapes variant="dense" opacity={0.06} />

      {/* Background ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-500/10 blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/portal/application"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-blue-300/80 hover:text-white transition-colors"
          >
            ← Back to Track Selection
          </Link>
        </div>

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <SparklesIcon className="w-4 h-4 text-blue-400" />
            University of Michigan • AI Business Group
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Become an ABG <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">General Member</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#BBBBBB] leading-relaxed mb-8">
            Immerse yourself in cutting-edge AI discussions, connect with industry leaders from top global firms, and build hands-on leadership experience on our internal committees with <strong className="text-white">no formal track application required</strong>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#pay-dues"
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] flex items-center gap-2"
            >
              <span>Join & Pay Dues ($50)</span>
              <ArrowRightIcon className="w-4 h-4" />
            </a>
            <a
              href="#committees"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium border border-white/20 transition-all backdrop-blur-sm"
            >
              Explore Committees ↓
            </a>
          </div>
        </section>

        {/* Key Quick Pillars Banner */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 sm:mb-20">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-400/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <PresentationChartLineIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">General Meetings</h3>
            <p className="text-sm text-[#BBBBBB] leading-relaxed">
              Explore diverse AI frameworks, real-world case studies, prompt engineering techniques, and business model transformations in member-led interactive sessions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-400/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Open Speaker Series & Panels</h3>
            <p className="text-sm text-[#BBBBBB] leading-relaxed">
              Gain exclusive access to guest speakers and panels featuring professionals from industry titans like <strong>J.P. Morgan</strong>, <strong>Goldman Sachs</strong>, <strong>ServiceNow</strong>, and more.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-400/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Hands-On Committee Roles</h3>
            <p className="text-sm text-[#BBBBBB] leading-relaxed">
              Contribute directly to club operations across 5 specialized committees (Tech, Marketing, Client Acquisition, Finance, and Conference) to build real resume-ready leadership.
            </p>
          </div>
        </section>

        {/* Transparent Expectations: General Member vs Project Member */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Understanding the Membership Structure</h2>
            <p className="text-[#BBBBBB] max-w-2xl mx-auto text-sm sm:text-base">
              We believe in complete transparency so every member gets the most out of their experience at ABG.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* General Member Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-900/30 to-blue-950/40 border-2 border-blue-400/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                Open to All Students
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">General Member</h3>
              <p className="text-xs text-blue-300 font-medium mb-6">No application required • $50 semester dues</p>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Access to all General Meetings and practical AI knowledge sessions</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Access to open industry speaker events & panels (JPM, Goldman Sachs, ServiceNow, etc.)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Eligibility to join and gain experience on any of our 5 internal committees</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Networking and social events with the entire ABG student body</span>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-white/10 text-white/60">
                  <XCircleIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Does not participate in corporate client consulting projects (reserved for selective track teams)</span>
                </div>
              </div>
            </div>

            {/* Project Team Member Card */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-sm relative">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gray-300 text-xs font-semibold">
                Selective Track
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Project Team Member</h3>
              <p className="text-xs text-gray-400 font-medium mb-6">Application & interview process required</p>

              <div className="space-y-3.5 text-sm text-[#BBBBBB]">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Direct placement on a real corporate consulting engagement with an industry client</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Weekly client sprint deliverables, technical development, and executive presentations</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Mentorship from Project Managers and senior executive members</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-white/90">Full access to all General Member events, general meetings, and speaker series</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 leading-relaxed">
                  💡 <em>Note: General Membership is an excellent foundation for students who plan to apply for Project Team tracks in subsequent recruitment cycles!</em>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Committees Section */}
        <section id="committees" className="mb-20 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Hands-On Experience
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Internal Committees</h2>
            <p className="text-[#BBBBBB] max-w-2xl mx-auto text-sm sm:text-base">
              As an ABG General Member, you can get actively involved in running the organization. Join a committee that aligns with your passions and career goals.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {committees.map((comm) => {
              const Icon = comm.icon;
              return (
                <div
                  key={comm.name}
                  className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${comm.accent} flex items-center justify-center border`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/80 border border-white/10">
                        {comm.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{comm.name}</h3>
                    <p className="text-sm text-[#BBBBBB] leading-relaxed mb-6">
                      {comm.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Key Skills Built:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {comm.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Payment & Venmo Section */}
        <section id="pay-dues" className="mb-20 scroll-mt-24">
          <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-[#0c2242] to-[#122e54] border-2 border-blue-400/40 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-3xl mb-4">
                🤝
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Finalize Your General Membership</h2>
              <p className="text-blue-200/80 text-sm sm:text-base">
                Membership dues cover venue bookings, speaker hospitality, technical sessions, and social events throughout the entire semester.
              </p>
            </div>

            {/* Pricing Box */}
            <div className="bg-black/30 border border-white/15 rounded-2xl p-6 mb-8 text-center">
              <span className="text-xs uppercase font-semibold text-blue-300 tracking-wider">Semester Dues</span>
              <div className="text-5xl font-extrabold text-white my-2">$50<span className="text-lg font-normal text-white/60"> / semester</span></div>
              <p className="text-xs text-white/70">
                Directly payable via Venmo to our Finance Director
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-blue-400" />
                Payment Instructions:
              </h4>
              <ol className="space-y-2.5 list-decimal pl-5 text-white/90">
                <li>
                  Open Venmo and send <strong>$50.00</strong> to handle:{' '}
                  <a
                    href="https://venmo.com/u/seangretz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 hover:underline inline-block font-semibold"
                  >
                    @seangretz
                  </a>
                </li>
                <li>
                  In the Venmo memo/description, <strong className="text-amber-300">must include</strong>:
                  <div className="mt-1.5 p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-blue-200">
                    [Your Full Name] • [Uniqname / @umich.edu email] • ABG General Dues
                  </div>
                </li>
                <li>
                  Once your payment is verified, you will receive an official welcome email with Slack access and the committee selection form!
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href="https://venmo.com/u/seangretz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-[#008CFF] hover:bg-[#0077db] text-white font-bold text-center text-lg transition-all shadow-xl shadow-[#008CFF]/20 flex items-center justify-center gap-2"
              >
                <span>Open Venmo (@seangretz)</span>
                <ArrowRightIcon className="w-5 h-5" />
              </a>
              <p className="text-center text-xs text-white/50">
                Need alternative payment arrangements? Reach out to us at{' '}
                <a href="mailto:ContactABG@umich.edu" className="text-blue-300 hover:underline">
                  ContactABG@umich.edu
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Global Footer */}
      <Footer />
    </main>
  );
}
