'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlayIcon, ClockIcon, UserIcon, ChatBubbleLeftIcon, FilmIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FloatingShapes from '@/components/FloatingShapes';

// Design System Colors - Austin/SXSW palette
const colors = {
  navy: '#0B1C2D',
  navyLight: '#132639',
  navyDark: '#081624',
  austin: '#bf5a36',
  white: '#FFFFFF',
  gray: '#8B9AAD',
};

// Wireframe Component
function WireframeScreen({ 
  title, 
  description, 
  children, 
  duration,
  purpose 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
  duration?: string;
  purpose?: string;
}) {
  return (
    <div className="mb-16">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-white/60 max-w-2xl">{description}</p>
        </div>
        {duration && (
          <span className="px-3 py-1 rounded-full bg-[#bf5a36]/20 text-[#bf5a36] text-sm font-medium">
            {duration}
          </span>
        )}
      </div>
      {purpose && (
        <p className="text-sm text-white/40 mb-4 italic">Purpose: {purpose}</p>
      )}
      
      {/* Wireframe Container */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video max-w-4xl">
        {/* Grainy texture background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1f35] via-[#0a1628] to-[#0d1f35]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
          }}
        />
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingShapes />
        </div>
        {children}
      </div>
    </div>
  );
}

// Lower Third Component
function LowerThird({ name, role, panel }: { name: string; role: string; panel?: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-[#0B1C2D] to-transparent">
      <div className="absolute bottom-0 left-0 right-0 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-16 bg-[#bf5a36]" />
          <div>
            <h3 className="text-xl font-bold text-white">{name}</h3>
            <p className="text-white/70">{role}</p>
            {panel && <p className="text-white/50 text-sm mt-1">Panel: {panel}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProdScreensPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#00274c]">
      <div className="relative z-10">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#00274c]/95 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sxsw" className="text-white/60 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Production Screens</h1>
                <p className="text-sm text-white/50">SXSW 2026 Livestream Overlays</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-sm">
              For Designers
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Design System Overview */}
        <section className="mb-16 p-8 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">🎨 Design System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Colors */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0B1C2D] border border-white/20" />
                  <div>
                    <p className="text-white text-sm font-medium">Navy Base</p>
                    <p className="text-white/40 text-xs">#0B1C2D</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#081624] border border-white/20" />
                  <div>
                    <p className="text-white text-sm font-medium">Navy Dark</p>
                    <p className="text-white/40 text-xs">#081624</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#bf5a36] border border-white/20" />
                  <div>
                    <p className="text-white text-sm font-medium">Austin Orange</p>
                    <p className="text-white/40 text-xs">#bf5a36 (accent only)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Typography</h3>
              <div className="space-y-2">
                <p className="text-white text-sm">Font: SF Pro / Inter</p>
                <p className="text-white/60 text-sm">Clean sans-serif family</p>
                <p className="text-white/40 text-xs mt-2">Headings: Bold/Semibold</p>
                <p className="text-white/40 text-xs">Body: Regular/Medium</p>
              </div>
            </div>

            {/* Elements */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Elements</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-px bg-white/30" />
                  <p className="text-white/60 text-xs">Thin dividers (1-2px)</p>
                </div>
                <p className="text-white/40 text-xs mt-2">• No drop shadows</p>
                <p className="text-white/40 text-xs">• No glow effects</p>
                <p className="text-white/40 text-xs">• No gaming aesthetics</p>
              </div>
            </div>

            {/* Motion */}
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Motion</h3>
              <div className="space-y-2">
                <p className="text-white/60 text-xs">• Slow animated wave background</p>
                <p className="text-white/60 text-xs">• Smooth 400ms transitions</p>
                <p className="text-white/60 text-xs">• Subtle fade in/out</p>
                <p className="text-white/60 text-xs">• Text slides upward gently</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm">
              <span className="text-white font-semibold">Design Philosophy:</span> 80% whitespace, 15% typography, 5% accent. 
              Feels like Apple keynote, Stripe conference, modern VC summit — not Twitch.
            </p>
          </div>

          {/* Bottom Right Corner Standard */}
          <div className="mt-6 flex gap-4">
            {/* Primary Logo */}
            <div className="flex-1 p-4 rounded-lg bg-[#00274c]/20 border border-[#00274c]/30">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Primary Logo</h3>
              <p className="text-white/60 text-sm mb-4">
                Main ABG logo for prominent placements:
              </p>
              <div className="flex items-start gap-4">
                <img 
                  src="/logo.png" 
                  alt="ABG Logo" 
                  className="h-12 w-auto object-contain"
                />
                <div className="text-white/50 text-xs space-y-1">
                  <p>• <span className="text-white/70">Image:</span> /logo.png</p>
                  <p>• <span className="text-white/70">Use for:</span> Headers, intros</p>
                </div>
              </div>
            </div>
            
            {/* Secondary Logo */}
            <div className="flex-1 p-4 rounded-lg bg-[#bf5a36]/10 border border-[#bf5a36]/30">
              <h3 className="text-sm font-semibold text-[#bf5a36] uppercase tracking-wide mb-3">Secondary Logo (Corner)</h3>
              <p className="text-white/60 text-sm mb-4">
                Watermark for bottom-right corner:
              </p>
              <div className="flex items-start gap-4">
                <img 
                  src="/StickerLogo.png" 
                  alt="ABG Logo" 
                  className="h-16 w-auto object-contain opacity-70"
                />
                <div className="text-white/50 text-xs space-y-1">
                  <p>• <span className="text-white/70">Position:</span> absolute -bottom-2 right-2</p>
                  <p>• <span className="text-white/70">Image:</span> /StickerLogo.png</p>
                  <p>• <span className="text-white/70">Height:</span> h-16, opacity-70</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Screen 1: Soft Opening */}
        <WireframeScreen
          title="1️⃣ Soft Opening Screen"
          description="Elegant holding screen. Sets tone immediately. Plays before event starts."
          duration="10:30 - 11:00 AM"
          purpose="Welcome viewers, build anticipation with countdown"
        >
          <div className="relative h-full flex items-center justify-center p-6">
            
            {/* Main Content - Schedule + Countdown side by side, moved up slightly */}
            <div className="flex items-center gap-12 -mt-8">
              {/* Schedule - Wider */}
              <div className="space-y-2.5 min-w-[340px]">
                <p className="text-white/50 text-xs uppercase tracking-wide mb-3">HAIL TO THE INNOVATORS | Today's Schedule</p>
                {/* Current panel - highlighted */}
                <div className="p-3 rounded-lg bg-[#bf5a36]/20 border border-[#bf5a36]/40 flex items-center justify-between">
                  <div>
                    <p className="text-[#bf5a36] text-xs font-semibold">NOW</p>
                    <p className="text-white text-sm font-medium">Preshow & Networking</p>
                    <p className="text-white/50 text-xs">10:30 AM</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Panel 1: AI Transformation</p>
                    <p className="text-white/50 text-xs">11:00 AM</p>
                  </div>
                  <div className="flex gap-1.5 bg-white rounded px-2 py-1">
                    <div className="w-4 h-4 bg-[#00274c] rounded-sm flex items-center justify-center text-[5px] text-white font-bold">DVP</div>
                    <div className="w-4 h-4 bg-[#4285f4] rounded-sm"></div>
                    <div className="w-4 h-4 bg-[#00274c] rounded-sm flex items-center justify-center text-[5px] text-white font-bold">MS</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Panel 2: Student Builders</p>
                    <p className="text-white/50 text-xs">12:00 PM</p>
                  </div>
                  <div className="flex gap-1.5 bg-white rounded px-2 py-1">
                    <div className="w-4 h-4 bg-[#ff5722] rounded-sm"></div>
                    <div className="w-4 h-4 bg-[#00bcd4] rounded-sm"></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Lunch & Demos</p>
                    <p className="text-white/50 text-xs">1:00 PM</p>
                  </div>
                  <div className="flex gap-1.5 bg-white rounded px-2 py-1">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm"></div>
                    <div className="w-4 h-4 bg-[#000] rounded-sm"></div>
                  </div>
                </div>
              </div>
              
              {/* Countdown - Larger */}
              <div className="text-center px-8">
                <p className="text-white/40 text-sm uppercase tracking-wide mb-3">Starting in</p>
                <p className="text-6xl md:text-7xl font-bold text-white tabular-nums">14:32</p>
              </div>
            </div>
            
            {/* Bottom Left - ABG Logo */}
            <div className="absolute bottom-4 left-4 bg-gray-200 rounded-lg px-4 h-8 flex items-center">
              <img src="/logo.png" alt="ABG Logo" className="h-16 w-auto object-contain -my-4" />
            </div>
          </div>
        </WireframeScreen>

        {/* Screen 2: Panel Lower Third */}
        <WireframeScreen
          title="2️⃣ Panel Lower Third"
          description="Speaker identification overlay during live panels. Shows all speakers + moderator."
          purpose="Identify all panelists and moderator at once"
        >
          {/* Panel view area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="absolute top-4 text-white/30 text-sm">(Panel Camera View)</p>
          </div>
          
          {/* Panel Title - Top Left */}
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <div className="w-1 h-8 bg-[#bf5a36]" />
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">Panel 1</p>
              <p className="text-white font-semibold">The AI Transformation</p>
            </div>
          </div>
          
          {/* Bottom Right - Affiliation Logos */}
          <div className="absolute -bottom-2 right-2">
            <img src="/StickerLogo.png" alt="ABG Logo" className="h-16 w-auto object-contain opacity-70" />
          </div>
          
          {/* Lower Third - All Speakers */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B1C2D] via-[#0B1C2D]/95 to-transparent pt-8 pb-4 px-6">
            
            {/* All Speakers Row */}
            <div className="flex items-center gap-4">
              {/* Moderator */}
              <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#bf5a36]/20 border-2 border-[#bf5a36] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <div>
                  <p className="text-[#bf5a36] text-[10px] uppercase font-semibold">Moderator</p>
                  <p className="text-white text-sm font-medium">Jane Doe</p>
                  <p className="text-white/60 text-xs">ABG President</p>
                </div>
              </div>
              
              {/* Speaker 1 */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white/60 text-xs">1</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">John Smith</p>
                  <p className="text-white/60 text-xs">Partner, DVP</p>
                </div>
              </div>
              
              {/* Speaker 2 */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white/60 text-xs">2</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Sarah Chen</p>
                  <p className="text-white/60 text-xs">CEO, TechCo</p>
                </div>
              </div>
              
              {/* Speaker 3 */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white/60 text-xs">3</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Mike Johnson</p>
                  <p className="text-white/60 text-xs">Founder, AIStart</p>
                </div>
              </div>
            </div>
          </div>
        </WireframeScreen>

        {/* Screen 3: Full Panel Title Slide */}
        <WireframeScreen
          title="3️⃣ Full Panel Title Slide"
          description="Displayed between sessions. Title fades in, subtext slides upward, divider animates outward."
          purpose="Introduce upcoming panel with context"
        >
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#bf5a36] text-sm font-semibold uppercase tracking-widest mb-4">
              PANEL 1
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              The AI Transformation
            </h1>
            
            {/* Divider */}
            <div className="w-32 h-px bg-white/20 my-6" />
            
            <p className="text-white/60 max-w-lg mb-6">
              How students, founders, and operators are building in the age of AI
            </p>
            
            <p className="text-white/40 text-sm">
              11:00 – 11:50 AM CT
            </p>
          </div>
        </WireframeScreen>

        {/* Screen 4: Lunch & Learn Fireside Chat */}
        <WireframeScreen
          title="4️⃣ Lunch & Learn Fireside Chat"
          description="Research to Reality: How Michigan Turns Ideas Into Impact. Panel-style presenter view."
          duration="1:05 PM - 2:05 PM (60 min)"
          purpose="Fireside chat with presenter identification overlay"
        >
          {/* Panel view area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="absolute top-4 text-white/30 text-sm">(Stage Camera View)</p>
          </div>
          
          {/* Session Title - Top Left */}
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <div className="w-1 h-8 bg-[#bf5a36]" />
            <div>
              <p className="text-[#bf5a36]/70 text-xs uppercase tracking-wide">Fireside Chat</p>
              <p className="text-white font-semibold text-sm">Research to Reality: How Michigan Turns Ideas Into Impact</p>
            </div>
          </div>
          
          {/* Bottom Right - Affiliation Logos */}
          <div className="absolute -bottom-2 right-2">
            <img src="/StickerLogo.png" alt="ABG Logo" className="h-16 w-auto object-contain opacity-70" />
          </div>
          
          {/* Lower Third - Presenters */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B1C2D] via-[#0B1C2D]/95 to-transparent pt-8 pb-4 px-6">
            
            {/* Speakers Row */}
            <div className="flex items-center gap-4">
              {/* Moderator */}
              <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                <div className="w-10 h-10 rounded-full bg-[#bf5a36]/20 border-2 border-[#bf5a36] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <div>
                  <p className="text-[#bf5a36] text-[10px] uppercase font-semibold">Moderator</p>
                  <p className="text-white text-sm font-medium">Jane Doe</p>
                  <p className="text-white/60 text-xs">ABG President</p>
                </div>
              </div>
              
              {/* Speaker 1 */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white/60 text-xs">1</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Dr. Sarah Williams</p>
                  <p className="text-white/60 text-xs">VP Research, U-M</p>
                </div>
              </div>
            </div>
          </div>
        </WireframeScreen>

        {/* Screen 5: AI in Action Workshop */}
        <WireframeScreen
          title="5️⃣ AI in Action Workshop"
          description="From Prompt to Prototype: Stage presenter with large screen share overlay."
          duration="2:10 PM - 3:00 PM (50 min)"
          purpose="Workshop view with presenter picture-in-picture and dominant screen share"
        >
          {/* Main Screen Share Area */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Screen Share Placeholder - Takes most of the frame */}
            <div className="w-[85%] h-[75%] rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10 flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-white/20 text-sm mb-2">(Screen Share View)</p>
                <div className="w-64 h-32 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <div className="text-center">
                    <p className="text-white/40 text-xs mb-1">Code Editor / AI Tool</p>
                    <div className="space-y-1 text-left px-4">
                      <div className="h-2 w-32 bg-blue-500/30 rounded" />
                      <div className="h-2 w-24 bg-green-500/30 rounded" />
                      <div className="h-2 w-28 bg-purple-500/30 rounded" />
                    </div>
                  </div>
                </div>
                <p className="text-white/30 text-xs">Real-time AI build in progress...</p>
              </div>
            </div>
          </div>
          
          {/* Session Title - Top Left */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-[#bf5a36]" />
            <div>
              <p className="text-[#bf5a36]/70 text-[10px] uppercase tracking-wide">Workshop</p>
              <p className="text-white font-semibold text-xs">AI in Action: From Prompt to Prototype</p>
            </div>
          </div>
          
          {/* Presenter Picture-in-Picture - Bottom Left */}
          <div className="absolute bottom-4 left-4">
            <div className="relative">
              {/* PiP Frame */}
              <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#bf5a36]/50 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white/30 text-[10px]">(Presenter Camera)</p>
                </div>
              </div>
              {/* Presenter Info */}
              <div className="mt-2 px-1">
                <p className="text-white text-xs font-medium">Alex Chen</p>
                <p className="text-white/50 text-[10px]">AI Developer, ABG</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Right - Affiliation Logos */}
          <div className="absolute -bottom-2 right-2">
            <img src="/StickerLogo.png" alt="ABG Logo" className="h-16 w-auto object-contain opacity-70" />
          </div>
        </WireframeScreen>

        {/* Screen 6: Student Spotlight Intro */}
        <WireframeScreen
          title="6️⃣ Student Spotlight Intro"
          description="Before playing recorded student interviews. Text fades in sequentially."
          purpose="Transition smoothly into pre-recorded content"
        >
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#bf5a36] text-sm font-semibold uppercase tracking-widest mb-6">
              AI Business Group @ SXSW
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              STUDENT SPOTLIGHT
            </h1>
            
            {/* Divider */}
            <div className="w-24 h-px bg-white/20 my-6" />
            
            {/* Student Info */}
            <div className="text-center">
              <p className="text-white text-xl font-semibold mb-1">Alex Rodriguez</p>
              <p className="text-white/70 mb-1">Computer Science, Class of 2027</p>
              <p className="text-white/50 text-sm mb-3">University of Michigan</p>
              <p className="text-[#bf5a36] text-sm font-medium">Project Lead, AI Business Group</p>
            </div>
          </div>
        </WireframeScreen>

        {/* Screen 6b: Student Spotlight Video Playback */}
        <WireframeScreen
          title="6️⃣b Student Spotlight Video"
          description="Video playback with student info and countdown below video."
          purpose="Show pre-recorded student spotlight with contextual info"
        >
          {/* Video Frame - 16:9 aspect ratio (1920x1080) - Smaller, centered higher */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Video Container - Smaller to leave room for info */}
            <div className="w-[75%] h-[65%] rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative overflow-hidden -mt-12">
              <p className="text-white/20 text-sm">(Student Video - 1920x1080)</p>
              
              {/* Video progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className="h-full w-[35%] bg-[#bf5a36]" />
              </div>
            </div>
          </div>
          
          {/* Bottom Left - Student Info */}
          <div className="absolute bottom-4 left-4">
            <p className="text-[#bf5a36] text-[10px] uppercase font-semibold tracking-wider mb-1">Student Spotlight</p>
            <p className="text-white text-sm font-semibold">Alex Rodriguez</p>
            <p className="text-white/60 text-xs">Computer Science, 2027</p>
            <p className="text-white/40 text-[10px] mt-0.5">Project Lead, ABG</p>
          </div>
          
          {/* Bottom Right - Event Notice */}
          <div className="absolute bottom-4 right-4">
            <p className="text-white/50 text-xs">Event Begins After Student Spotlight</p>
          </div>
        </WireframeScreen>

        {/* Screen 7: Transition Bumper */}
        <WireframeScreen
          title="7️⃣ Transition Screen (Cinematic Bumper)"
          description="Quick 5-7 second interstitial. Words appear one at a time. Signature identity."
          duration="5-7 seconds"
          purpose="Create brand recognition between segments"
        >
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            {/* Animated line indicator */}
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {/* Primary Slogan */}
            <div className="space-y-1 mb-6">
              <p className="text-3xl md:text-4xl font-bold text-white tracking-wide">AI SHAPES</p>
              <p className="text-3xl md:text-4xl font-bold text-white tracking-wide">BUSINESS.</p>
              <p className="text-xl md:text-2xl font-semibold text-[#bf5a36] tracking-wide mt-2">WE BUILD AI SOLUTIONS</p>
            </div>
            
            {/* Secondary */}
            <p className="text-white/50 text-sm max-w-md mb-8">
              Redefining what it means to be career ready in an AI driven world.
            </p>
            
            <div className="w-16 h-px bg-white/20 mb-6" />
            
            {/* Brand Close */}
            <div className="text-center">
              <p className="text-white/80 font-semibold mb-1">AI Business Group</p>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Proudly Affiliated With Ross & Engineering</p>
              <p className="text-[#bf5a36] text-lg tracking-wide font-medium">HAIL TO THE INNOVATORS</p>
            </div>
          </div>
        </WireframeScreen>

      </div>
      </div>
    </div>
  );
}
