'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ABGLogoBox } from '../components';

function WorkshopLiveContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const workshopTitle = searchParams.get('title') || 'AI in Action: From Prompt to Prototype';
  const presenterName = searchParams.get('presenter') || 'Alex Chen';
  const presenterRole = searchParams.get('role') || 'AI Developer, ABG';
  const statusText = searchParams.get('status') || 'Real-time AI build in progress...';
  const toolName = searchParams.get('tool') || 'Code Editor / AI Tool';
  const showStatus = searchParams.get('showStatus') !== 'false';

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Floating geometric shapes background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large triangle - top left area */}
        <div 
          className="absolute top-[15%] left-[25%] w-0 h-0 opacity-20"
          style={{
            borderLeft: '80px solid transparent',
            borderRight: '80px solid transparent',
            borderBottom: '140px solid #3a5a7c',
          }}
        />
        
        {/* Small triangle - bottom center */}
        <div 
          className="absolute bottom-[12%] left-[42%] w-0 h-0 opacity-15 rotate-180"
          style={{
            borderLeft: '35px solid transparent',
            borderRight: '35px solid transparent',
            borderBottom: '60px solid #3a5a7c',
          }}
        />
        
        {/* Circles - various positions */}
        <div className="absolute top-[22%] right-[8%] w-4 h-4 rounded-full bg-[#4a6a8c]/30" />
        <div className="absolute top-[55%] right-[12%] w-5 h-5 rounded-full border-2 border-[#4a6a8c]/25" />
        <div className="absolute bottom-[25%] left-[18%] w-3 h-3 rounded-full border border-[#4a6a8c]/20" />
        <div className="absolute bottom-[18%] right-[6%] w-8 h-8 rounded-full border border-[#4a6a8c]/15" />
        
        {/* Diamonds (rotated squares) */}
        <div className="absolute top-[30%] right-[15%] w-8 h-8 border-2 border-[#4a6a8c]/20 rotate-45" />
        <div className="absolute top-[50%] right-[10%] w-6 h-6 border border-[#4a6a8c]/15 rotate-45" />
        <div className="absolute bottom-[35%] right-[20%] w-5 h-5 border border-[#4a6a8c]/20 rotate-45" />
        
        {/* Squares */}
        <div className="absolute bottom-[22%] right-[18%] w-10 h-10 border border-[#4a6a8c]/15 rounded-sm" />
        <div className="absolute top-[65%] right-[25%] w-6 h-6 border border-[#4a6a8c]/20 rounded-sm" />
      </div>
      
      {/* Top Left - Workshop Title */}
      <div className="absolute top-6 left-6 flex items-start gap-3">
        <div className="w-1 h-14 bg-[#00274c] rounded-full" />
        <div>
          <p className="text-[#00274c] text-sm font-semibold uppercase tracking-widest mb-1">Workshop</p>
          <p className="text-white text-xl font-semibold max-w-md">{workshopTitle}</p>
        </div>
      </div>
      
      {/* Center - Screen Share Placeholder Area (just labels, actual content from vMix) */}
      {showStatus && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-white/40 text-lg mb-4">(Screen Share View)</p>
          <div className="bg-[#1a2a3a]/60 backdrop-blur-sm rounded-lg px-8 py-6 border border-white/10">
            <p className="text-white/80 text-lg font-medium mb-3">{toolName}</p>
            <div className="flex flex-col gap-2 mb-4">
              <div className="h-1.5 w-48 bg-gradient-to-r from-blue-400/50 to-blue-400/20 rounded-full" />
              <div className="h-1.5 w-40 bg-gradient-to-r from-green-400/50 to-green-400/20 rounded-full" />
              <div className="h-1.5 w-44 bg-gradient-to-r from-purple-400/50 to-purple-400/20 rounded-full" />
            </div>
          </div>
          <p className="text-white/50 text-base mt-6 italic">{statusText}</p>
        </div>
      )}
      
      {/* Bottom Left - Presenter Camera Box (placeholder) */}
      <div className="absolute bottom-6 left-6">
        <div className="w-44 h-32 bg-[#1a2a3a]/50 rounded-lg border-2 border-[#bf5a36]/60 flex items-center justify-center mb-3">
          <p className="text-white/30 text-sm">(Presenter Camera)</p>
        </div>
        <div>
          <p className="text-white text-base font-semibold">{presenterName}</p>
          <p className="text-white/60 text-sm">{presenterRole}</p>
        </div>
      </div>
      
      {/* Bottom Right - ABG Branding */}
      <div className="absolute bottom-6 right-6">
        <ABGLogoBox size="normal" />
      </div>
    </div>
  );
}

export default function WorkshopLiveOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <WorkshopLiveContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- title: Workshop title (default: "AI in Action: From Prompt to Prototype")
- presenter: Presenter name (default: "Alex Chen")
- role: Presenter role (default: "AI Developer, ABG")
- status: Status text below screen share (default: "Real-time AI build in progress...")
- tool: Tool name shown in center (default: "Code Editor / AI Tool")
- showStatus: Show center placeholder text (default: true, set to "false" to hide)

Example:
/sxsw/overlay/workshop-live?title=Building%20with%20Claude&presenter=Jane%20Doe&tool=Claude%20API

This is a TRANSPARENT overlay to be composited over:
1. Screen share (center)
2. Presenter camera (positioned in bottom-left corner via vMix)

The overlay provides:
- Workshop title (top-left)
- Floating geometric shapes
- Center placeholder (hide with showStatus=false when actual screen share is shown)
- Presenter name card (bottom-left)
- ABG branding (bottom-right)
*/
