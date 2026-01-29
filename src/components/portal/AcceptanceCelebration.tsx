'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircleIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import { FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { getTrackLabel } from '@/lib/tracks';
import type { ApplicationTrack } from '@/types/recruitment';

interface AcceptanceCelebrationProps {
  userName: string;
  track?: ApplicationTrack;
  cycleName?: string;
  onClose: () => void;
}

export default function AcceptanceCelebration({ 
  userName, 
  track, 
  cycleName,
  onClose 
}: AcceptanceCelebrationProps) {
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showName, setShowName] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    // Staggered animation sequence
    const timers = [
      setTimeout(() => setShowContent(true), 300),
      setTimeout(() => setShowConfetti(true), 600),
      setTimeout(() => setShowName(true), 1200),
      setTimeout(() => setShowDetails(true), 1800),
      setTimeout(() => setShowCTA(true), 2400),
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const seasonName = cycleName?.split(' ')[0] || 'Winter';
  const year = new Date().getFullYear();

  return (
    <div className="acceptance-celebration-modal fixed inset-0 z-50 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00274C] via-[#0a3d6e] to-[#00274C] animate-gradient-shift" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="celebration-orb celebration-orb-1" />
        <div className="celebration-orb celebration-orb-2" />
        <div className="celebration-orb celebration-orb-3" />
        <div className="celebration-orb celebration-orb-4" />
        
        {/* Confetti pieces */}
        {showConfetti && (
          <>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#FFCB05', '#00274C', '#ffffff', '#FFD700', '#87CEEB'][Math.floor(Math.random() * 5)],
                }}
              />
            ))}
          </>
        )}
        
        {/* Sparkle stars */}
        <div className="sparkle-star" style={{ top: '10%', left: '15%', animationDelay: '0s' }}>✦</div>
        <div className="sparkle-star" style={{ top: '20%', right: '20%', animationDelay: '0.5s' }}>✦</div>
        <div className="sparkle-star" style={{ top: '60%', left: '10%', animationDelay: '1s' }}>✦</div>
        <div className="sparkle-star" style={{ top: '70%', right: '15%', animationDelay: '1.5s' }}>✦</div>
        <div className="sparkle-star" style={{ top: '40%', left: '5%', animationDelay: '2s' }}>✦</div>
        <div className="sparkle-star" style={{ bottom: '20%', right: '25%', animationDelay: '0.3s' }}>✦</div>
        <div className="sparkle-star" style={{ top: '15%', left: '45%', animationDelay: '0.8s' }}>✧</div>
        <div className="sparkle-star" style={{ bottom: '30%', left: '30%', animationDelay: '1.2s' }}>✧</div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
        aria-label="Close celebration"
      >
        <XMarkIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo with glow effect */}
        <div className={`transition-all duration-1000 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full scale-150" />
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
              <Image
                src="/logo.png"
                alt="ABG Logo"
                width={80}
                height={80}
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Congratulations text */}
        <div className={`mt-8 transition-all duration-1000 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-lg md:text-xl font-semibold tracking-widest uppercase text-center" style={{ color: '#facc15' }}>
            Congratulations
          </p>
        </div>

        {/* Name with dramatic reveal */}
        <div className={`mt-4 transition-all duration-1000 ${showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center leading-tight" style={{ color: '#ffffff' }}>
            {userName}
          </h1>
        </div>

        {/* Welcome message */}
        <div className={`mt-6 transition-all duration-1000 ${showName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-400/50" />
            <p className="text-xl md:text-2xl font-light text-center" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              You&apos;re officially part of <span className="font-semibold" style={{ color: '#facc15' }}>ABG</span>
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-400/50" />
          </div>
        </div>

        {/* Track badge */}
        {track && (
          <div className={`mt-6 transition-all duration-1000 ${showDetails ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 backdrop-blur-sm rounded-full px-6 py-3 border border-yellow-400/30">
              <CheckCircleIcon className="w-5 h-5" style={{ color: '#facc15' }} />
              <span className="font-semibold" style={{ color: '#ffffff' }}>{getTrackLabel(track)}</span>
            </div>
          </div>
        )}

        {/* Inspiring message */}
        <div className={`mt-8 max-w-2xl transition-all duration-1000 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-center text-base md:text-lg leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Your dedication and hard work throughout the recruitment process has earned you a place among Michigan&apos;s premier applied AI organization. 
            We can&apos;t wait to see what we&apos;ll accomplish together.
          </p>
        </div>

        {/* Member badge */}
        <div className={`mt-8 transition-all duration-1000 ${showDetails ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
            <p className="text-sm text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <span className="font-medium" style={{ color: '#ffffff' }}>AI Business Group</span> • University of Michigan • {seasonName} {year}
            </p>
          </div>
        </div>

        {/* Screenshot CTA */}
        <div className={`mt-10 transition-all duration-1000 ${showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CameraIcon className="w-6 h-6" style={{ color: '#facc15' }} />
              <h3 className="font-semibold text-lg" style={{ color: '#ffffff' }}>Capture This Moment!</h3>
            </div>
            <p className="text-center text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              We encourage you to take a screenshot and share your acceptance with your network, family, and friends. 
              You&apos;ve earned this—celebrate it!
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <FaLinkedin className="w-5 h-5" style={{ color: '#0077b5' }} />
                <span>LinkedIn</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <FaInstagram className="w-5 h-5" style={{ color: '#E4405F' }} />
                <span>Instagram</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <FaTwitter className="w-5 h-5" style={{ color: '#1DA1F2' }} />
                <span>Twitter</span>
              </div>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className={`mt-8 transition-all duration-1000 ${showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={onClose}
            className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 font-bold rounded-xl shadow-lg hover:shadow-yellow-400/25 hover:scale-105 transition-all duration-300"
            style={{ color: '#00274C' }}
          >
            <span className="relative z-10" style={{ color: '#00274C' }}>Continue to Your Portal</span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* Subtle footer */}
        <div className={`mt-8 transition-all duration-1000 ${showCTA ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xs text-center" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            #ABGMember • #UMich • #AIBusinessGroup
          </p>
        </div>
      </div>
    </div>
  );
}
