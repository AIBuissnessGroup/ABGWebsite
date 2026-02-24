'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AUSTIN_COLOR, ABGLogoBox } from '../components';

// Speaker type
interface Speaker {
  name: string;
  role: string;
  image?: string;
  isModerator?: boolean;
}

function LowerThirdContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const panelNumber = searchParams.get('panel') || '1';
  const panelTitle = searchParams.get('title') || 'The AI Transformation';
  const speakersJson = searchParams.get('speakers');
  
  // Individual speaker params (easier than JSON)
  const modName = searchParams.get('mod_name') || 'Jane Doe';
  const modRole = searchParams.get('mod_role') || 'ABG President';
  const modImage = searchParams.get('mod_image') || '';
  
  const s1Name = searchParams.get('s1_name') || 'John Smith';
  const s1Role = searchParams.get('s1_role') || 'Partner, DVP';
  const s1Image = searchParams.get('s1_image') || '';
  
  const s2Name = searchParams.get('s2_name') || 'Sarah Chen';
  const s2Role = searchParams.get('s2_role') || 'CEO, TechCo';
  const s2Image = searchParams.get('s2_image') || '';
  
  const s3Name = searchParams.get('s3_name') || 'Mike Johnson';
  const s3Role = searchParams.get('s3_role') || 'Founder, AIStart';
  const s3Image = searchParams.get('s3_image') || '';
  
  const s4Name = searchParams.get('s4_name') || 'Lisa Park';
  const s4Role = searchParams.get('s4_role') || 'VP, Google';
  const s4Image = searchParams.get('s4_image') || '';
  
  // Build speakers array from individual params or JSON
  const speakers: Speaker[] = speakersJson 
    ? JSON.parse(decodeURIComponent(speakersJson)) 
    : [
        { name: modName, role: modRole, image: modImage, isModerator: true },
        { name: s1Name, role: s1Role, image: s1Image },
        { name: s2Name, role: s2Role, image: s2Image },
        { name: s3Name, role: s3Role, image: s3Image },
        { name: s4Name, role: s4Role, image: s4Image },
      ];

  return (
    <div 
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Panel Title - Top Left */}
      <div className="absolute top-6 left-8 flex items-center gap-3">
        <div className="w-1 h-10 bg-[#00274c]" />
        <div>
          <p className="text-white/60 text-sm uppercase tracking-wide">Panel {panelNumber}</p>
          <p className="text-white text-xl font-semibold">{panelTitle}</p>
        </div>
      </div>
      
      {/* ABG Logo Box - Bottom Right */}
      <div className="absolute bottom-8 right-8">
        <ABGLogoBox size="small" />
      </div>
      
      {/* Lower Third - All Speakers - positioned higher */}
      <div className="absolute bottom-8 left-0 right-0 px-8">
        {/* All Speakers Row - left aligned */}
        <div className="flex items-center gap-5">
          {speakers.map((speaker, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 ${
                speaker.isModerator ? 'pr-5 border-r border-white/30' : ''
              }`}
            >
              {/* Avatar / Image */}
              <div 
                className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden ${
                  speaker.isModerator 
                    ? 'bg-[#bf5a36]/20 border-2 border-[#bf5a36]' 
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                {speaker.image ? (
                  <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`text-lg font-bold ${speaker.isModerator ? 'text-white' : 'text-white/60'}`}>
                    {speaker.isModerator ? 'M' : speaker.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                {speaker.isModerator && (
                  <p className="text-[#bf5a36] text-xs uppercase font-semibold">Moderator</p>
                )}
                <p className="text-white text-base font-medium">{speaker.name}</p>
                <p className="text-white/60 text-sm">{speaker.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LowerThirdOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen" style={{ background: 'transparent' }} />}>
      <LowerThirdContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- panel: Panel number (default: "1")
- title: Panel title (default: "The AI Transformation")
- speakers: JSON array of speaker objects with name, role, isModerator

Example:
/sxsw/overlay/lower-third?panel=1&title=AI%20Transformation&speakers=[{"name":"Jane","role":"President","isModerator":true}]
*/
