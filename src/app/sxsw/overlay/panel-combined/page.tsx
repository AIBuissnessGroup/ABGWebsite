'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { ABGLogoBox } from '../components';

// Speaker type
interface Speaker {
  name: string;
  role: string;
  image?: string;
  isModerator?: boolean;
}

function PanelCombinedContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters
  const panelNumber = searchParams.get('panel') || '1';
  const panelTitle = searchParams.get('title') || 'The AI Transformation';
  const panelDescription = searchParams.get('description') || 'How students, founders, and operators are building in the age of AI';
  const panelTime = searchParams.get('time') || '11:00 – 11:50 AM CT';
  const introDuration = parseInt(searchParams.get('intro') || '8') * 1000; // seconds for intro
  const autoHide = searchParams.get('autoHide'); // seconds before lower-third hides
  
  // Speaker params
  const modName = searchParams.get('mod_name') || 'Jane Doe';
  const modRole = searchParams.get('mod_role') || 'ABG President';
  const modImage = searchParams.get('mod_image') || '';
  
  const s1Name = searchParams.get('s1_name') || '';
  const s1Role = searchParams.get('s1_role') || '';
  const s1Image = searchParams.get('s1_image') || '';
  
  const s2Name = searchParams.get('s2_name') || '';
  const s2Role = searchParams.get('s2_role') || '';
  const s2Image = searchParams.get('s2_image') || '';
  
  const s3Name = searchParams.get('s3_name') || '';
  const s3Role = searchParams.get('s3_role') || '';
  const s3Image = searchParams.get('s3_image') || '';
  
  const s4Name = searchParams.get('s4_name') || '';
  const s4Role = searchParams.get('s4_role') || '';
  const s4Image = searchParams.get('s4_image') || '';
  
  // Build speakers array (only include non-empty speakers)
  const speakers: Speaker[] = [
    { name: modName, role: modRole, image: modImage, isModerator: true },
    ...(s1Name ? [{ name: s1Name, role: s1Role, image: s1Image }] : []),
    ...(s2Name ? [{ name: s2Name, role: s2Role, image: s2Image }] : []),
    ...(s3Name ? [{ name: s3Name, role: s3Role, image: s3Image }] : []),
    ...(s4Name ? [{ name: s4Name, role: s4Role, image: s4Image }] : []),
  ];
  
  // Phases:
  // 0: Countdown and intro animation
  // 1: Transition out
  // 2: Transparent overlay with lower-third
  // 3: (optional) Hide lower-third
  const [phase, setPhase] = useState(0);
  const [introStep, setIntroStep] = useState(0);
  
  useEffect(() => {
    if (phase === 0) {
      // Intro animation steps
      const steps = [
        800,   // Step 0->1: "3"
        700,   // Step 1->2: "2"
        700,   // Step 2->3: "1"
        600,   // Step 3->4: "LIVE"
        400,   // Step 4->5: Panel number
        400,   // Step 5->6: Title
        300,   // Step 6->7: Divider
        300,   // Step 7->8: Description
        300,   // Step 8->9: Time
        introDuration - 4500, // Hold remaining time
      ];
      let step = 0;
      const runStep = () => {
        if (step < steps.length) {
          setTimeout(() => {
            setIntroStep(s => s + 1);
            step++;
            runStep();
          }, steps[step]);
        } else {
          setPhase(1);
        }
      };
      runStep();
    }
  }, [phase, introDuration]);
  
  useEffect(() => {
    if (phase === 1) {
      const timeout = setTimeout(() => setPhase(2), 500);
      return () => clearTimeout(timeout);
    }
  }, [phase]);
  
  useEffect(() => {
    if (phase === 2 && autoHide) {
      const timeout = setTimeout(() => setPhase(3), parseInt(autoHide) * 1000);
      return () => clearTimeout(timeout);
    }
  }, [phase, autoHide]);

  const isIntro = phase === 0;
  const isTransitioning = phase === 1;
  const isOverlayMode = phase >= 2;
  const isHidden = phase >= 3;

  // Countdown number based on step
  const countdownNum = introStep >= 1 && introStep <= 3 ? (4 - introStep).toString() : null;
  const showLive = introStep === 4;
  const showPanelNum = introStep >= 5;
  const showTitle = introStep >= 6;
  const showDivider = introStep >= 7;
  const showDescription = introStep >= 8;
  const showTime = introStep >= 9;

  // Intro mode - full screen panel title
  if (isIntro || isTransitioning) {
    return (
      <div 
        className={`w-screen h-screen overflow-hidden relative transition-all duration-500 ${
          isTransitioning ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
        }`}
        style={{ 
          background: `linear-gradient(135deg, #0B1C2D 0%, #081624 50%, #0d1f35 100%)`
        }}
      >
        {/* Floating shapes background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#bf5a36]/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-[#00274c]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[60%] left-[60%] w-48 h-48 rounded-full bg-[#bf5a36]/5 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
          {/* Countdown numbers - 3, 2, 1 */}
          <div 
            className={`absolute transition-all duration-300 ${
              countdownNum ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
            }`}
          >
            <span className="text-[180px] font-bold text-white/90 tabular-nums"
              style={{ 
                textShadow: '0 0 60px rgba(191, 90, 54, 0.5)',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {countdownNum}
            </span>
          </div>
          
          {/* LIVE badge */}
          <div 
            className={`absolute transition-all duration-500 ${
              showLive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            <div className="flex items-center gap-4 bg-red-600/90 px-8 py-4 rounded-lg">
              <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
              <span className="text-white text-5xl font-bold tracking-wider">LIVE</span>
            </div>
          </div>
          
          {/* Main content - fades in sequentially */}
          <div className={`flex flex-col items-center ${introStep < 5 ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            <p 
              className={`text-[#bf5a36] text-xl font-semibold uppercase tracking-widest mb-6 transition-all duration-500 ${
                showPanelNum ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              PANEL {panelNumber}
            </p>
            
            <h1 
              className={`text-6xl md:text-8xl font-bold text-white mb-6 transition-all duration-500 ${
                showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {panelTitle}
            </h1>
            
            {/* Divider */}
            <div 
              className={`w-48 h-1 bg-[#bf5a36] my-8 transition-all duration-500 ${
                showDivider ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`}
            />
            
            <p 
              className={`text-white/70 text-2xl max-w-3xl mb-8 transition-all duration-500 ${
                showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {panelDescription}
            </p>
            
            <p 
              className={`text-white/50 text-xl transition-all duration-500 ${
                showTime ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {panelTime}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Overlay mode - transparent with lower-third
  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Panel Title - Top Left */}
      <div 
        className={`absolute top-6 left-8 transition-all duration-500 ${
          isHidden ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="bg-[#0B1C2D]/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg flex items-center gap-3">
          <div className="w-1 h-10 bg-[#bf5a36] rounded-full" />
          <div>
            <p className="text-[#bf5a36] text-xs font-semibold uppercase tracking-wider">Panel {panelNumber}</p>
            <p className="text-white text-lg font-semibold">{panelTitle}</p>
          </div>
        </div>
      </div>
      
      {/* ABG Logo Box - Bottom Right */}
      <div 
        className={`absolute bottom-8 right-8 transition-all duration-500 ${
          isHidden ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <ABGLogoBox size="small" />
      </div>
      
      {/* Lower Third - All Speakers */}
      <div 
        className={`absolute bottom-8 left-0 right-0 px-8 transition-all duration-500 ${
          isHidden ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex items-center gap-4">
          {speakers.map((speaker, index) => (
            <div 
              key={index} 
              className={`bg-[#0B1C2D]/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 shadow-lg flex items-center gap-3 ${
                speaker.isModerator ? 'border-l-2 border-l-[#bf5a36]' : ''
              }`}
            >
              {/* Avatar / Image */}
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                  speaker.isModerator 
                    ? 'bg-[#bf5a36]/20 border-2 border-[#bf5a36]' 
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                {speaker.image ? (
                  <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`text-base font-bold ${speaker.isModerator ? 'text-white' : 'text-white/60'}`}>
                    {speaker.isModerator ? 'M' : speaker.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                {speaker.isModerator && (
                  <p className="text-[#bf5a36] text-[10px] uppercase font-semibold tracking-wider">Moderator</p>
                )}
                <p className="text-white text-sm font-medium">{speaker.name}</p>
                <p className="text-white/60 text-xs">{speaker.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PanelCombined() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <PanelCombinedContent />
    </Suspense>
  );
}

/*
COMBINED: Panel Title Intro + Lower Third Overlay

Combines the panel title intro animation (with 3-2-1 countdown, LIVE badge, and title reveal)
with a transparent lower-third overlay showing all speakers.

URL Parameters:
- panel: Panel number (default: "1")
- title: Panel title
- description: Panel description
- time: Panel time slot
- intro: Seconds for intro screen (default: 8)
- autoHide: Seconds to show lower-third before hiding (optional)

Speaker params (supports moderator + 4 speakers):
- mod_name, mod_role, mod_image: Moderator info
- s1_name, s1_role, s1_image: Speaker 1 info
- s2_name, s2_role, s2_image: Speaker 2 info
- s3_name, s3_role, s3_image: Speaker 3 info
- s4_name, s4_role, s4_image: Speaker 4 info

Flow:
1. Intro (countdown 3-2-1 → LIVE → panel info reveal)
2. Fade transition
3. Transparent overlay with panel title bar + speaker lower-thirds
4. (Optional) Auto-hide after specified seconds

Example:
/sxsw/overlay/panel-combined?panel=1&title=The%20AI%20Transformation&mod_name=John%20Doe&mod_role=ABG%20President&s1_name=Jane%20Smith&s1_role=CEO
*/
