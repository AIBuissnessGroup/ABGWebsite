'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { SXSWLivestreamConfig, SXSWPanel } from '@/types/events';
import { PlayIcon, SignalIcon } from '@heroicons/react/24/outline';

interface SXSWLivestreamPlayerProps {
  livestream?: SXSWLivestreamConfig;
  eventDate: Date;
  currentPanel?: SXSWPanel;
  showCountdown?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function SXSWLivestreamPlayer({ 
  livestream, 
  eventDate,
  currentPanel,
  showCountdown = false
}: SXSWLivestreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [countdownLoaded, setCountdownLoaded] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!showCountdown) return;
    
    setCountdownLoaded(true);
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(eventDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [showCountdown, eventDate]);

  useEffect(() => {
    // Initialize HLS player when stream is live and we have a URL
    if (livestream?.status === 'live' && livestream?.hlsUrl && videoRef.current) {
      initializeHls(livestream.hlsUrl);
    }
  }, [livestream?.status, livestream?.hlsUrl]);

  const initializeHls = (url: string) => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous instance if exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    setIsLoading(true);
    setHasError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hlsRef.current = hls;
      
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        // Auto-play when manifest is ready
        video.play().catch(() => {
          // Auto-play blocked, user needs to interact
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHasError(true);
          setIsLoading(false);
          console.error('HLS fatal error:', data);
          
          // Try to recover
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              // Cannot recover
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  // Render different states
  const renderContent = () => {
    const status = livestream?.status || 'upcoming';

    // Upcoming state - show countdown/waiting message
    if (status === 'upcoming') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8">
          {/* Countdown Timer - Featured at top */}
          {showCountdown && countdownLoaded && (
            <div className="w-full max-w-md mb-4 sm:mb-6">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                {[
                  { value: timeLeft.days, label: 'Days' },
                  { value: timeLeft.hours, label: 'Hrs' },
                  { value: timeLeft.minutes, label: 'Min' },
                  { value: timeLeft.seconds, label: 'Sec' },
                ].map(({ value, label }) => (
                  <div key={label} className="sxsw-countdown-box">
                    <div className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white tabular-nums">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="text-[8px] xs:text-[9px] sm:text-xs text-white/50 uppercase tracking-wide mt-0.5 sm:mt-1">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">
            Livestream Coming Soon
          </h3>
          <p className="text-white/60 text-sm sm:text-base max-w-sm mb-2">
            Join us on {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-white/50 text-[10px] xs:text-xs sm:text-sm leading-relaxed">
            <span className="block sm:inline">Preshow begins at 9:30 AM CDT</span>
            <span className="hidden sm:inline"> • </span>
            <span className="block sm:inline">First panel at 11:00 AM CDT</span>
          </p>
        </div>
      );
    }

    // Ended state - show replay message
    if (status === 'ended') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/60" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
            Livestream Has Ended
          </h3>
          <p className="text-white/60 text-sm max-w-xs">
            Thank you for joining us! Recordings will be available soon on our YouTube channel.
          </p>
        </div>
      );
    }

    // Live state - show video player
    if (status === 'live') {
      // Missing URL
      if (!livestream?.hlsUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <SignalIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Stream Starting Soon
            </h3>
            <p className="text-white/60 text-sm">
              The stream is being prepared. Please wait...
            </p>
          </div>
        );
      }

      // Error state
      if (hasError) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <SignalIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Stream Unavailable
            </h3>
            <p className="text-white/60 text-sm mb-4">
              Having trouble connecting to the stream.
            </p>
            <button
              onClick={() => livestream?.hlsUrl && initializeHls(livestream.hlsUrl)}
              className="px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors min-h-[44px]"
            >
              Try Again
            </button>
          </div>
        );
      }

      // Video player
      return (
        <>
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          
          {/* Play button overlay (before user interaction) */}
          {!isPlaying && !isLoading && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 cursor-pointer"
              onClick={handlePlay}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            controls={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </>
      );
    }

    return null;
  };

  return (
    <div className="sxsw-video-container relative bg-gradient-to-br from-[#0a1628] to-[#0d1f35]">
      {renderContent()}
    </div>
  );
}
