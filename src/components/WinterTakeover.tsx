'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowRightIcon,
  RocketLaunchIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAppsOpenCountdown } from '@/hooks/useAppsOpenCountdown';

// ============================================
// PHASE TYPES
// ============================================
type TakeoverPhase = 
  | 'pre-launch'     // Before launch - countdown with building snow
  | 'snow-cover'     // Snow covers screen white
  | 'freeze'         // Ice/freeze 3D effect
  | 'rewind'         // 3D photo rewind from last semester
  | 'its-time'       // "IT'S TIMEEEEE" animation
  | 'ice-break'      // Ice shatters
  | 'video'          // Launch video plays
  | 'crossoff'       // Cross off old methods
  | 'features-scroll'// Features scroll fast
  | 'ready-countdown'// 3, 2, 1 countdown before portal
  | 'portal-intro'   // Introduce portal
  | 'redirect';      // Redirect to portal

// ============================================
// REWIND PHOTOS - Static list for production (fallback)
// In dev mode, use ?reloadImages=true to fetch fresh list from API
// ============================================
const STATIC_REWIND_PHOTOS = [
  '/images/rewind/2xWvtNk_.jpeg',
  '/images/rewind/BOOq72E4.jpeg',
  '/images/rewind/DSC01090.jpg',
  '/images/rewind/DSC01091.jpg',
  '/images/rewind/IMG_0007.jpg',
  '/images/rewind/IMG_0447.jpg',
  '/images/rewind/IMG_0448.jpg',
  '/images/rewind/IMG_0463.jpg',
  '/images/rewind/IMG_0556.jpg',
  '/images/rewind/IMG_1346.jpg',
  '/images/rewind/IMG_1348.jpg',
  '/images/rewind/IMG_1653.jpg',
  '/images/rewind/IMG_1820.jpg',
  '/images/rewind/IMG_1826.jpg',
  '/images/rewind/IMG_1829.jpg',
  '/images/rewind/IMG_1849.jpg',
  '/images/rewind/IMG_1852.jpg',
  '/images/rewind/IMG_2071.jpg',
  '/images/rewind/IMG_2096.jpg',
  '/images/rewind/IMG_3513.jpg',
  '/images/rewind/IMG_3554.jpg',
  '/images/rewind/IMG_3626.jpg',
  '/images/rewind/IMG_3721.jpg',
  '/images/rewind/IMG_3733.jpg',
  '/images/rewind/IMG_3734.jpg',
  '/images/rewind/IMG_3748.jpg',
  '/images/rewind/IMG_4478.jpg',
  '/images/rewind/IMG_4488.jpg',
  '/images/rewind/IMG_4639.jpg',
  '/images/rewind/IMG_5556.jpg',
  '/images/rewind/IMG_6008.jpg',
  '/images/rewind/IMG_6631.jpg',
  '/images/rewind/IMG_6688.jpg',
  '/images/rewind/IMG_7592.png',
  '/images/rewind/IMG_7946.jpg',
  '/images/rewind/IMG_9242.jpg',
  '/images/rewind/IMG_9394 (1).jpg',
  '/images/rewind/IMG_9395.jpg',
  '/images/rewind/IMG_9396.jpg',
  '/images/rewind/IMG_9398.jpg',
  '/images/rewind/IMG_9399.jpg',
  '/images/rewind/IMG_9402.jpg',
  '/images/rewind/IMG_9403.jpg',
  '/images/rewind/IMG_9404.jpg',
  '/images/rewind/IMG_9405.jpg',
  '/images/rewind/IMG_9407.jpg',
  '/images/rewind/IMG_9993.jpg',
  '/images/rewind/IMG_9995.jpg',
  '/images/rewind/image (4).png',
  '/images/rewind/uUoqSn5l.jpeg',
  '/images/rewind/yxsirqt4.jpeg',
];

// Hook to get rewind photos - dynamically loads in dev mode with ?reloadImages=true
const useRewindPhotos = () => {
  const [photos, setPhotos] = useState<string[]>(STATIC_REWIND_PHOTOS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we're in dev mode and should reload images
    const isDev = process.env.NODE_ENV === 'development';
    const urlParams = new URLSearchParams(window.location.search);
    const shouldReload = urlParams.get('reloadImages') === 'true';
    
    if (isDev && shouldReload) {
      setIsLoading(true);
      fetch('/api/rewind-images')
        .then(res => res.json())
        .then(data => {
          if (data.images && data.images.length > 0) {
            setPhotos(data.images);
            console.log(`[Dev] Loaded ${data.images.length} rewind images from disk`);
          }
        })
        .catch(err => {
          console.error('Failed to load rewind images:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  return { photos, isLoading };
};

// Helper to create staggered delays for stomp effect
const getStompDelay = (index: number, total: number): number => {
  // Consistent gap between stomps - each photo gets its moment
  // Starts slower, speeds up slightly at the end
  const baseGap = 0.35; // seconds between each stomp
  const speedUp = 1 - (index / total) * 0.3; // Speeds up slightly toward end
  return index * baseGap * speedUp;
};

// ============================================
// STOMP PHOTO COMPONENT - Slams onto screen like a title card
// ============================================
const StompPhoto = ({ 
  src, 
  index, 
  total 
}: { 
  src: string;
  index: number;
  total: number;
}) => {
  const [imgError, setImgError] = useState(false);
  
  // Don't render if image failed to load
  if (imgError) return null;
  
  // Calculate display duration - visible for ~0.3s then next one slams on top
  const stompDelay = 2 + getStompDelay(index, total); // 2s for title first
  
  // Use a grid-based approach with jitter for better spread
  // Divide screen into a grid and place each photo in a different cell with random offset
  const gridCols = 8;
  const gridRows = 6;
  const totalCells = gridCols * gridRows; // 48 cells
  
  // Assign each photo to a cell using scrambled index
  const scrambledIndex = (index * 31 + 17) % totalCells; // Scramble order
  const cellX = scrambledIndex % gridCols;
  const cellY = Math.floor(scrambledIndex / gridCols);
  
  // Cell size as percentage
  const cellWidth = 100 / gridCols;  // ~12.5%
  const cellHeight = 100 / gridRows; // ~16.6%
  
  // Add jitter within cell using prime-based randomness
  const jitterSeed1 = ((index * 7919 + 127) % 1000) / 1000;
  const jitterSeed2 = ((index * 6271 + 389) % 1000) / 1000;
  const jitterSeed3 = ((index * 8863 + 521) % 1000) / 1000;
  
  // Jitter within 80% of cell to avoid edges
  const jitterX = (jitterSeed1 - 0.5) * cellWidth * 0.7;
  const jitterY = (jitterSeed2 - 0.5) * cellHeight * 0.7;
  
  // Final position: cell center + jitter
  const posX = (cellX + 0.5) * cellWidth + jitterX;
  const posY = (cellY + 0.5) * cellHeight + jitterY;
  
  // Random rotation
  const randomRotate = (jitterSeed3 - 0.5) * 40; // -20 to +20 degrees
  
  // Calculate when to fade out (before Winter 2026 appears at ~20.5s into rewind phase)
  // Rewind starts at 4s, so photos should fade by ~22s total = 18s into rewind
  const fadeOutDelay = 18; // All photos fade out at same time before Winter 2026
  
  return (
    <motion.div
      initial={{ 
        scale: 3,
        opacity: 0,
        rotate: randomRotate,
      }}
      animate={{ 
        scale: [3, 0.9, 1], // Overshoot then settle (stomp effect)
        opacity: [0, 1, 1, 0], // Fade in, stay, then fade out before Winter 2026
        rotate: [randomRotate, randomRotate * 0.3, randomRotate * 0.1],
      }}
      transition={{
        duration: 0.4,
        delay: stompDelay,
        times: [0, 0.4, 0.5], // Quick slam
        ease: [0.22, 1, 0.36, 1], // Punchy easing
        opacity: {
          duration: fadeOutDelay - stompDelay + 1, // Duration from stomp to fade
          delay: stompDelay,
          times: [0, 0.05, 0.9, 1], // Quick fade in, hold most of duration, fade out at end
        }
      }}
      className="absolute"
      style={{ 
        zIndex: index, // NEWER photos ON TOP (higher index = higher z)
        left: `${posX}%`,
        top: `${posY}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div 
        className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-white"
        style={{
          width: 'min(45vw, 350px)',
          height: 'min(34vw, 260px)',
          boxShadow: '0 0 40px rgba(255,255,255,0.6), 0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <img 
          src={src}
          alt={`Memory ${index + 1}`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {/* Impact flash on stomp */}
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.1, delay: stompDelay }}
          className="absolute inset-0 bg-white pointer-events-none"
        />
      </div>
    </motion.div>
  );
};

// ============================================
// VHS SCANLINE EFFECT
// ============================================
const VHSScanlines = () => (
  <div className="absolute inset-0 pointer-events-none z-10">
    {/* Scanlines */}
    <div 
      className="absolute inset-0 opacity-10"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
      }}
    />
    {/* VHS tracking lines */}
    <motion.div
      className="absolute inset-0"
      animate={{
        backgroundPosition: ['0% 0%', '0% 100%'],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background: 'linear-gradient(to bottom, transparent 90%, rgba(255,255,255,0.1) 90%, rgba(255,255,255,0.1) 91%, transparent 91%)',
        backgroundSize: '100% 30px',
      }}
    />
    {/* Color aberration effect on edges */}
    <div 
      className="absolute inset-0 opacity-30"
      style={{
        boxShadow: 'inset 3px 0 10px rgba(255,0,0,0.3), inset -3px 0 10px rgba(0,255,255,0.3)',
      }}
    />
  </div>
);

// ============================================
// SNOW PARTICLE COMPONENT
// ============================================
const SnowParticle = ({ 
  delay, 
  duration, 
  size, 
  startX,
  intensity = 1 
}: { 
  delay: number; 
  duration: number; 
  size: number;
  startX: number;
  intensity?: number;
}) => (
  <motion.div
    initial={{ y: -20, x: startX, opacity: 0 }}
    animate={{ 
      y: '110vh', 
      opacity: [0, intensity * 0.9, intensity * 0.9, intensity * 0.9, 0], // Smooth, no blinking
      x: [startX, startX + Math.sin(delay * 2) * (80 * intensity), startX + Math.sin(delay * 4) * (40 * intensity)], // More wind in blizzard
    }}
    transition={{ 
      duration, 
      delay: delay % duration, 
      repeat: Infinity,
      ease: 'linear'
    }}
    className="absolute rounded-full bg-white"
    style={{ 
      width: size, 
      height: size,
      filter: `blur(${size > 6 ? 2 : 1}px)`,
      boxShadow: `0 0 ${5 + intensity * 10}px rgba(255,255,255,${0.3 + intensity * 0.4})`
    }}
  />
);

// ============================================
// ICE SHARD COMPONENT
// ============================================
const IceShard = ({ 
  index, 
  total,
  breaking 
}: { 
  index: number; 
  total: number;
  breaking: boolean;
}) => {
  const angle = (index / total) * 360;
  const distance = 100 + Math.random() * 200;
  const rotation = Math.random() * 720 - 360;
  const size = 20 + Math.random() * 80;
  
  return (
    <motion.div
      initial={{ 
        x: 0, 
        y: 0, 
        rotate: 0,
        opacity: 1,
        scale: 1
      }}
      animate={breaking ? { 
        x: Math.cos(angle * Math.PI / 180) * distance * 3,
        y: Math.sin(angle * Math.PI / 180) * distance * 3 + 500,
        rotate: rotation,
        opacity: 0,
        scale: 0.5
      } : {}}
      transition={{ 
        duration: 1.5, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.random() * 0.3
      }}
      className="absolute left-1/2 top-1/2"
      style={{
        width: size,
        height: size * 1.5,
        background: 'linear-gradient(135deg, rgba(200,230,255,0.9) 0%, rgba(150,200,255,0.7) 50%, rgba(100,180,255,0.5) 100%)',
        clipPath: 'polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
        boxShadow: '0 0 20px rgba(150,200,255,0.5), inset 0 0 20px rgba(255,255,255,0.3)',
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${50 + Math.random() * 50}px)`,
      }}
    />
  );
};

// ============================================
// FROST OVERLAY COMPONENT
// ============================================
const FrostOverlay = ({ intensity }: { intensity: number }) => (
  <div 
    className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
    style={{ opacity: intensity }}
  >
    {/* Frost edge effect */}
    <div 
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse at top left, rgba(200,230,255,0.4) 0%, transparent 50%),
          radial-gradient(ellipse at top right, rgba(200,230,255,0.4) 0%, transparent 50%),
          radial-gradient(ellipse at bottom left, rgba(200,230,255,0.3) 0%, transparent 40%),
          radial-gradient(ellipse at bottom right, rgba(200,230,255,0.3) 0%, transparent 40%)
        `,
      }}
    />
    {/* Ice crystal texture */}
    <svg className="absolute inset-0 w-full h-full opacity-20">
      <defs>
        <pattern id="frost-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M50 0 L50 100 M0 50 L100 50 M25 25 L75 75 M75 25 L25 75" 
                stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#frost-pattern)" />
    </svg>
  </div>
);

// ============================================
// 3D CYLINDER SCROLL COMPONENT  
// ============================================
const CylinderScroll = ({ 
  items, 
  radius = 300 
}: { 
  items: string[]; 
  radius?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'jolt-stops' | 'speeding' | 'slowing' | 'final'>('jolt-stops');
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [scale, setScale] = useState(1);
  const itemCount = items.length;
  const angleStep = 360 / itemCount;
  
  // Phase 1: Jolt stops on first 3 items (1 second each)
  useEffect(() => {
    // Item 1: Show immediately, hold for 1s
    const jolt1 = setTimeout(() => {
      setCurrentIndex(1);
      setRotation(angleStep); // Jolt to next
    }, 1000);
    
    // Item 2: Jolt to it, hold for 1s
    const jolt2 = setTimeout(() => {
      setCurrentIndex(2);
      setRotation(angleStep * 2);
    }, 2000);
    
    // Item 3: Jolt to it, hold for 1s
    const jolt3 = setTimeout(() => {
      setCurrentIndex(3);
      setRotation(angleStep * 3);
    }, 3000);
    
    // Start speeding up after 3 items
    const startSpeed = setTimeout(() => {
      setPhase('speeding');
      setSpeed(5);
    }, 4000);
    
    // Speed up progressively
    const speed1 = setTimeout(() => setSpeed(15), 4500);
    const speed2 = setTimeout(() => setSpeed(40), 5000);
    const speed3 = setTimeout(() => setSpeed(80), 5500);
    
    // Start slowing down
    const slow1 = setTimeout(() => {
      setPhase('slowing');
      setSpeed(40);
      setScale(1.3);
    }, 6000);
    const slow2 = setTimeout(() => {
      setSpeed(15);
      setScale(1.6);
    }, 6300);
    const slow3 = setTimeout(() => {
      setSpeed(5);
      setScale(2);
    }, 6600);
    
    // Final reveal
    const final = setTimeout(() => {
      setPhase('final');
      setSpeed(0);
    }, 7000);
    
    return () => {
      clearTimeout(jolt1);
      clearTimeout(jolt2);
      clearTimeout(jolt3);
      clearTimeout(startSpeed);
      clearTimeout(speed1);
      clearTimeout(speed2);
      clearTimeout(speed3);
      clearTimeout(slow1);
      clearTimeout(slow2);
      clearTimeout(slow3);
      clearTimeout(final);
    };
  }, [angleStep]);
  
  // Continuous rotation when speeding
  useEffect(() => {
    if (phase === 'jolt-stops' || phase === 'final') return;
    const interval = setInterval(() => {
      setRotation(prev => prev + speed);
    }, 16);
    return () => clearInterval(interval);
  }, [speed, phase]);
  
  return (
    <div 
      className="relative w-full h-[500px] flex items-center justify-center"
      style={{ perspective: '800px' }}
    >
      {phase === 'final' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center"
        >
          <div className="text-5xl md:text-7xl font-black text-white mb-4"
            style={{
              textShadow: '0 0 40px rgba(147,197,253,0.5), 0 0 80px rgba(147,197,253,0.3)',
            }}
          >
            ❄️ Ready to Apply ❄️
          </div>
          <p className="text-2xl text-blue-200">Your journey starts here</p>
        </motion.div>
      ) : (
        <motion.div 
          className="relative flex items-center justify-center"
          animate={{ scale }}
          transition={{ duration: 0.3 }}
          style={{ 
            transformStyle: 'preserve-3d',
            width: '100%',
            height: '400px',
          }}
        >
          {/* The rotating cylinder - horizontal axis */}
          <div
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${-rotation}deg)`,
              transition: phase === 'jolt-stops' ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            }}
          >
            {items.map((item, i) => {
              const angle = i * angleStep;
              // Calculate how "in focus" this item is based on rotation
              // Normalize rotation to 0-360 range
              const normalizedRotation = ((rotation % 360) + 360) % 360;
              // Calculate angular distance from front-facing position
              const itemAngle = (angle % 360 + 360) % 360;
              const angularDistance = Math.abs(normalizedRotation - itemAngle);
              const wrappedDistance = Math.min(angularDistance, 360 - angularDistance);
              // Items within ~30 degrees are in focus, others get blurred
              const isInFocus = wrappedDistance < angleStep * 1.5; // Current, next, or previous
              const blurAmount = isInFocus ? 0 : Math.min(8, wrappedDistance / 20);
              
              return (
                <div
                  key={`${item}-${i}`}
                  className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap px-8 py-4"
                  style={{
                    transform: `rotateX(${angle}deg) translateZ(${radius}px)`,
                    fontSize: phase === 'jolt-stops' ? '2.5rem' : '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: isInFocus ? '0 0 20px rgba(147,197,253,0.5)' : 'none',
                    backfaceVisibility: 'hidden',
                    filter: `blur(${blurAmount}px)`,
                    opacity: isInFocus ? 1 : 0.5,
                    transition: 'filter 0.2s, opacity 0.2s',
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      
      {/* Gradient overlays for depth effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0c1929] via-transparent to-[#0c1929]" />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function WinterTakeover() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const countdown = useAppsOpenCountdown();
  
  // Get rewind photos (dynamically in dev mode with ?reloadImages=true)
  const { photos: rewindPhotos } = useRewindPhotos();
  
  const [phase, setPhase] = useState<TakeoverPhase>('pre-launch');
  const [snowIntensity, setSnowIntensity] = useState(0);
  const [frostIntensity, setFrostIntensity] = useState(0);
  const [iceBreaking, setIceBreaking] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [crossoffIndex, setCrossoffIndex] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [eCount, setECount] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1920);
  const [readyCount, setReadyCount] = useState(3);
  const [manualCountdown, setManualCountdown] = useState(10);
  const [isManualMode] = useState(true); // Production: always manual mode
  const [waitingForTrigger, setWaitingForTrigger] = useState(false);
  const [adminTriggered, setAdminTriggered] = useState(false);
  
  // Get window width on client
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Poll for admin trigger (production mode - syncs across all devices)
  useEffect(() => {
    if (!isManualMode || adminTriggered) return;
    
    const checkTrigger = async () => {
      try {
        const res = await fetch('/api/admin/winter-takeover');
        const data = await res.json();
        if (data.triggered && !adminTriggered) {
          console.log('🚀 Admin trigger detected! Starting takeover...');
          setAdminTriggered(true);
          setManualCountdown(9); // Start the 10-second buildup countdown
        }
      } catch (error) {
        console.error('Failed to check trigger:', error);
      }
    };
    
    // Check immediately on load
    checkTrigger();
    
    // Poll every 1 second for the trigger
    const interval = setInterval(checkTrigger, 1000);
    
    return () => clearInterval(interval);
  }, [isManualMode, adminTriggered]);

  // When countdown ends (time-based), enter waiting state instead of triggering
  useEffect(() => {
    if (!isManualMode) return;
    if (countdown.isOpen && !waitingForTrigger && !adminTriggered) {
      setWaitingForTrigger(true);
    }
  }, [countdown.isOpen, isManualMode, waitingForTrigger, adminTriggered]);

  // Hide navbar during takeover animation phases (starting right at countdown zero)
  useEffect(() => {
    const phasesToHideNavbar: TakeoverPhase[] = ['snow-cover', 'freeze', 'rewind', 'its-time', 'ice-break', 'video', 'crossoff', 'features-scroll', 'ready-countdown', 'portal-intro'];
    
    if (phasesToHideNavbar.includes(phase)) {
      document.body.classList.add('hide-navbar');
    } else {
      document.body.classList.remove('hide-navbar');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, [phase]);

  // Calculate snow intensity based on time remaining
  // TESTING: Uses 10 seconds for buildup. PRODUCTION: Change to 300 seconds (5 minutes)
  const BUILDUP_SECONDS = 10; // Change to 300 for production (5 minutes)
  
  // Manual countdown effect - runs when button is clicked
  useEffect(() => {
    if (!isManualMode || manualCountdown === 10 || manualCountdown <= 0) return;
    
    const timer = setTimeout(() => {
      setManualCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [manualCountdown, isManualMode]);
  
  // Update snow intensity based on manual countdown
  useEffect(() => {
    if (!isManualMode) return;
    
    if (manualCountdown < 10 && manualCountdown > 0) {
      const progress = 1 - (manualCountdown / BUILDUP_SECONDS);
      setSnowIntensity(Math.min(1, progress * 1.2));
      setFrostIntensity(Math.min(0.6, progress * 0.8));
      console.log(`Manual countdown: ${manualCountdown}s - Snow: ${(progress * 100).toFixed(0)}%`);
    } else if (manualCountdown <= 0) {
      setSnowIntensity(1);
      setFrostIntensity(0.8);
      startTakeoverSequence();
    }
  }, [manualCountdown, isManualMode]);
  
  // Time-based snow buildup (only when not in manual mode)
  useEffect(() => {
    if (isManualMode || !countdown.isHydrated) return;
    
    const totalSeconds = countdown.days * 86400 + countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
    
    // Start building snow from BUILDUP_SECONDS out
    if (totalSeconds <= BUILDUP_SECONDS && totalSeconds > 0) {
      // Progress from 0 to 1 over the buildup period
      const progress = 1 - (totalSeconds / BUILDUP_SECONDS);
      setSnowIntensity(Math.min(1, progress * 1.2)); // Slightly overshoot for drama
      setFrostIntensity(Math.min(0.6, progress * 0.8));
      console.log(`Snow buildup: ${(progress * 100).toFixed(0)}% - ${totalSeconds}s remaining`);
    } else if (totalSeconds <= 0) {
      // Trigger the takeover sequence
      setSnowIntensity(1);
      setFrostIntensity(0.8);
    }
  }, [countdown, isManualMode]);

  // Trigger takeover when countdown hits zero (only in time-based mode)
  useEffect(() => {
    if (isManualMode) return;
    if (countdown.isOpen && phase === 'pre-launch') {
      startTakeoverSequence();
    }
  }, [countdown.isOpen, isManualMode]);
  
  const startTakeoverSequence = () => {
    // Snow cover (0-2 seconds)
    setPhase('snow-cover');
    setSnowIntensity(1);
    setFrostIntensity(1);
    
    // Freeze (2-4 seconds)
    setTimeout(() => {
      setPhase('freeze');
    }, 2000);
    
    // REWIND - 3D photo flashback + Winter 2026 text (4-29 seconds = 25s duration)
    // Photos: 2s title + ~10s of photos = done by ~16s into phase
    // Winter 2026: appears at ~18s, stays visible until ~24s, swipes off
    setTimeout(() => {
      setPhase('rewind');
    }, 4000);
    
    // It's time (29-35 seconds) - extended 2 seconds
    setTimeout(() => {
      setPhase('its-time');
      // Animate E's appearing one by one
      for (let i = 1; i <= 8; i++) {
        setTimeout(() => setECount(i), i * 150);
      }
    }, 29000);
    
    // Ice break (35-36.5 seconds) - delayed by 2s
    setTimeout(() => {
      setPhase('ice-break');
      setIceBreaking(true);
    }, 35000);
    
    // Video (36.5+ seconds) - delayed by 2s
    setTimeout(() => {
      setPhase('video');
    }, 36500);
  };

  // Handle video end
  useEffect(() => {
    if (phase === 'video' && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [phase]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setPhase('crossoff');
    
    // Progress through crossoff items
    setTimeout(() => setCrossoffIndex(1), 1000);
    setTimeout(() => setCrossoffIndex(2), 2500);
    setTimeout(() => setCrossoffIndex(3), 4000);
    // Show "Application Portal" reveal after crossoffIndex hits 3
    // crossoffIndex 4 triggers the portal reveal text
    setTimeout(() => setCrossoffIndex(4), 5500);
    // Move to features scroll after showing the reveal
    setTimeout(() => {
      setPhase('features-scroll');
    }, 8000);
    // Ready countdown (3, 2, 1) before portal intro
    setTimeout(() => {
      setPhase('ready-countdown');
      setReadyCount(3);
      setTimeout(() => setReadyCount(2), 1000);
      setTimeout(() => setReadyCount(1), 2000);
      setTimeout(() => {
        setPhase('portal-intro');
        setTimeout(() => setShowCTA(true), 1000);
      }, 3000);
    }, 15000);
  };

  // Generate snow particles based on intensity - more particles = more intense blizzard
  // Exponential growth for dramatic buildup
  const snowCount = Math.floor(30 + Math.pow(snowIntensity, 1.5) * 300);
  const snowParticles = Array.from({ length: snowCount }, (_, i) => {
    // Use seeded random for consistency
    const seed = i * 0.618033988749895;
    const random1 = ((Math.sin(seed * 1000) + 1) / 2);
    const random2 = ((Math.sin(seed * 2000) + 1) / 2);
    const random3 = ((Math.sin(seed * 3000) + 1) / 2);
    
    return {
      id: i,
      delay: random1 * 8,
      // Faster fall speed as intensity increases (blizzard effect)
      duration: Math.max(1.5, 4 - snowIntensity * 2.5 + random2 * 2),
      // Bigger flakes in intense blizzard
      size: 2 + random3 * (4 + snowIntensity * 12),
      startX: random1 * windowWidth,
    };
  });

  // Get background color based on phase and snow intensity
  const getBackgroundStyle = () => {
    if (phase === 'pre-launch') {
      // Gradually shift from warm blue to cold blue/white based on snow intensity
      if (snowIntensity < 0.3) return 'from-[#00274c] via-[#1a3a5c] to-[#2d4a6a]';
      if (snowIntensity < 0.5) return 'from-[#1a3a5c] via-[#2a4a6c] to-[#3a5a7c]';
      if (snowIntensity < 0.7) return 'from-[#2a4a6c] via-[#4a6a8c] to-[#6a8aac]';
      return 'from-[#4a6a8c] via-[#7a9abb] to-[#9abadb]';
    }
    if (phase === 'snow-cover' || phase === 'freeze' || phase === 'its-time' || phase === 'ice-break') {
      return 'from-[#c8e6ff] via-[#e0f0ff] to-[#ffffff]';
    }
    return 'from-[#0a0a0a] via-[#111] to-[#1a1a1a]';
  };

  // Crossoff items
  const crossoffItems = [
    { text: 'abgumich.org/Recruitment?', icon: '📋' },
    { text: 'Applications on Google Forms?', icon: '📝' },
    { text: 'Streamlined Application Process? ', icon: '✍️' },
  ];

  // Features list for cylinder scroll
  const features = [
    '✨ Real-time Application Tracking',
    '📅 Interview Scheduling',
    '☕ Coffee Chat Booking',
    '📊 Personalized Dashboard',
    '📁 Document Upload System',
    '📈 Progress Indicators',
    '📧 Email Notifications',
    '📱 Mobile Responsive',
    '🔐 Secure Authentication',
    '👥 Role-Based Access',
    '📉 Admin Analytics',
    '🎯 Candidate Management',
    '⚡ Automated Workflows',
    '🎨 Custom Branding',
    '🔄 Multi-Stage Pipeline',
    '🗓️ Integrated Calendar',
    '🤝 Team Collaboration',
    '🔔 Real-time Updates',
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-1000 bg-gradient-to-br ${getBackgroundStyle()}`}>
      
      {/* ============================================ */}
      {/* SNOW PARTICLES */}
      {/* ============================================ */}
      {(phase === 'pre-launch' || phase === 'snow-cover' || phase === 'freeze' || phase === 'its-time') && snowIntensity > 0 && (
        <>
          {/* Blizzard whiteout overlay - gets more opaque as intensity increases */}
          <motion.div 
            className="fixed inset-0 pointer-events-none z-15 bg-white"
            animate={{ opacity: Math.pow(snowIntensity, 2) * 0.4 }}
            transition={{ duration: 0.5 }}
          />
          <div className="fixed inset-0 pointer-events-none z-20">
            {snowParticles.map(particle => (
              <SnowParticle 
                key={particle.id}
                delay={particle.delay}
                duration={particle.duration}
                size={particle.size}
                startX={particle.startX}
                intensity={snowIntensity}
              />
            ))}
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* FROST OVERLAY */}
      {/* ============================================ */}
      <FrostOverlay intensity={frostIntensity} />

      {/* ============================================ */}
      {/* SNOW COVER WHITEOUT */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'snow-cover' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 bg-white z-30"
          />
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* FREEZE EFFECT */}
      {/* ============================================ */}
      <AnimatePresence>
        {(phase === 'freeze' || phase === 'its-time' || phase === 'ice-break') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            {/* Frozen glass effect */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(200,230,255,0.95) 0%, rgba(230,245,255,0.9) 50%, rgba(200,230,255,0.95) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            />
            
            {/* Ice cracks pattern */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <filter id="ice-glow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#ice-glow)" stroke="rgba(100,180,255,0.6)" strokeWidth="2" fill="none">
                <motion.line x1="50%" y1="0" x2="50%" y2="100%" 
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                <motion.line x1="0" y1="50%" x2="100%" y2="50%"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
                <motion.line x1="20%" y1="20%" x2="80%" y2="80%"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.4 }} />
                <motion.line x1="80%" y1="20%" x2="20%" y2="80%"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
                <motion.line x1="35%" y1="0" x2="15%" y2="100%"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.6 }} />
                <motion.line x1="65%" y1="0" x2="85%" y2="100%"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.7 }} />
              </g>
            </svg>

            {/* Ice shards for breaking */}
            {phase === 'ice-break' && (
              <div className="absolute inset-0">
                {Array.from({ length: 40 }, (_, i) => (
                  <IceShard key={i} index={i} total={40} breaking={iceBreaking} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* REWIND - 3D Photo Tunnel Flashback */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'rewind' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 overflow-hidden"
            style={{ 
              perspective: '1500px',
              background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a15 50%, #000 100%)',
              zIndex: 45
            }}
          >
            {/* VHS Effect Overlay */}
            <VHSScanlines />
            
            {/* "THE REWIND" Title - stays for 2+ seconds before photos fly */}
            <motion.div
              initial={{ opacity: 0, scale: 2, y: -100 }}
              animate={{ 
                opacity: [0, 1, 1, 1, 1, 0],
                scale: [2, 1, 1, 1, 0.9, 0.7],
                y: [-100, 0, 0, 0, -50, -150]
              }}
              transition={{ duration: 10, times: [0, 0.08, 0.2, 0.35, 0.5, 0.65] }}
              className="absolute top-20 left-0 right-0 text-center z-20"
            >
              <h2 
                className="text-6xl md:text-8xl font-black tracking-wider"
                style={{
                  color: '#fff',
                  textShadow: `
                    0 0 10px rgba(255,50,50,0.8),
                    0 0 20px rgba(255,50,50,0.6),
                    0 0 40px rgba(255,50,50,0.4),
                    3px 3px 0 rgba(0,255,255,0.8),
                    -3px -3px 0 rgba(255,0,255,0.8)
                  `,
                  fontFamily: 'Impact, sans-serif',
                }}
              >
                A QUICK LOOK BACK
              </h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 1, 0] }}
                transition={{ duration: 4, delay: 0.5, times: [0, 0.15, 0.5, 0.8, 1] }}
                className="text-xl text-gray-300 mt-2 font-mono"
              >
                FALL 2025 ▸▸
              </motion.p>
            </motion.div>

            {/* STOMP PHOTO SEQUENCE - Photos slam onto screen one after another */}
            <div className="absolute inset-0">
              {rewindPhotos.map((photo, index) => (
                <StompPhoto
                  key={`photo-${index}`}
                  src={photo}
                  index={index}
                  total={rewindPhotos.length}
                />
              ))}
            </div>

            {/* Subtle vignette */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
              }}
            />

            {/* "Winter 2026" destination text - appears after all photos stomp (~22s), stays, then swipes off */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ 
                opacity: [0, 0, 1, 1, 1, 1, 0],
                scale: [0.5, 0.5, 1, 1, 1.05, 1.1, 1.3],
                y: [0, 0, 0, 0, 0, 0, -600]
              }}
              transition={{ 
                duration: 25, // Match full rewind phase duration
                times: [0, 0.82, 0.85, 0.9, 0.94, 0.97, 1], // 82% = 20.5s (after 56 photos stomp), stays until 97%
                ease: "easeInOut"
              }}
              className="absolute inset-0 flex items-center justify-center z-40"
            >
              <motion.p 
                className="text-5xl md:text-7xl font-black text-center"
                style={{
                  color: '#00ff88',
                  textShadow: '0 0 40px rgba(0,255,136,0.6), 0 0 80px rgba(0,255,136,0.3)',
                }}
                animate={{
                  textShadow: [
                    '0 0 40px rgba(0,255,136,0.6)',
                    '0 0 60px rgba(0,255,136,0.8)',
                    '0 0 40px rgba(0,255,136,0.6)',
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                → ONTO WINTER 2026
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* IT'S TIME ANIMATION - 3D Text with animated E's */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'its-time' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 3 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateX: -30 }}
              animate={{ 
                scale: [0.5, 1, 1, 1, 1, 1.2, 1.5],
                opacity: [0, 1, 1, 1, 1, 1, 0],
                rotateX: [-30, 0, 0, 0, 0, 15, 30],
                rotateY: [0, 0, 0, 0, 0, 5, 10],
                z: [0, 0, 0, 0, 0, 100, 300],
              }}
              transition={{ 
                duration: 6, // Extended duration
                times: [0, 0.1, 0.3, 0.5, 0.7, 0.85, 1],
                ease: "easeInOut"
              }}
              className="text-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Pulsing glow effect */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{
                  boxShadow: [
                    '0 0 60px rgba(59,130,246,0.3)',
                    '0 0 120px rgba(59,130,246,0.6)',
                    '0 0 60px rgba(59,130,246,0.3)',
                  ]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              {/* Main 3D Text */}
              <motion.h1 
                className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{
                  color: '#1e40af',
                  textShadow: `
                    1px 1px 0 #2563eb,
                    2px 2px 0 #3b82f6,
                    3px 3px 0 #60a5fa,
                    4px 4px 0 #93c5fd,
                    5px 5px 0 #bfdbfe,
                    6px 6px 0 #dbeafe,
                    7px 7px 0 #eff6ff,
                    8px 8px 15px rgba(30,64,175,0.4)
                  `,
                  transform: 'perspective(500px) rotateX(5deg)',
                }}
              >
                IT&apos;S TIM
                {/* Animated E's appearing one by one */}
                {Array.from({ length: 8 }, (_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: -50, rotateX: -90 }}
                    animate={i < eCount ? { 
                      opacity: 1, 
                      y: 0, 
                      rotateX: 0,
                    } : {}}
                    transition={{ 
                      duration: 0.15,
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                    }}
                    style={{ 
                      display: 'inline-block',
                      transformOrigin: 'bottom',
                    }}
                  >
                    E
                  </motion.span>
                ))}
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [0, 1.5, 1] }}
                  transition={{ delay: 1.5, duration: 0.3 }}
                >
                  !
                </motion.span>
              </motion.h1>
              
              {/* 3D Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30, rotateX: -20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold mt-6"
                style={{
                  color: '#1e3a5f',
                  textShadow: `
                    1px 1px 0 #2a4a6f,
                    2px 2px 0 #3a5a7f,
                    3px 3px 8px rgba(30,58,95,0.3)
                  `,
                }}
              >
                Winter 2026 Applications Are Now Live!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* VIDEO PHASE */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'video' && !videoEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <video
              ref={videoRef}
              src="/videos/application-launch.mp4"
              className="w-full h-full object-contain"
              onEnded={handleVideoEnd}
              playsInline
              autoPlay
            />
            {/* Skip button */}
            <button
              onClick={handleVideoEnd}
              className="absolute bottom-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur transition-all hover:scale-105"
            >
              Skip →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* CROSSOFF SEQUENCE */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'crossoff' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ 
              perspective: '800px',
              background: 'linear-gradient(135deg, #0c1929 0%, #1a3a5c 50%, #0c1929 100%)',
            }}
          >
            {/* Winter snow particles in background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 50 }, (_, i) => (
                <motion.div
                  key={`crossoff-snow-${i}`}
                  className="absolute rounded-full bg-white/60"
                  style={{
                    width: 3 + (i % 5) * 2,
                    height: 3 + (i % 5) * 2,
                    left: `${(i * 17) % 100}%`,
                  }}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ 
                    y: ['0vh', '100vh'],
                    opacity: [0, 0.8, 0.8, 0],
                  }}
                  transition={{
                    duration: 4 + (i % 3),
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
            
            <div className="text-center space-y-8 z-10">
              {crossoffItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -100, rotateY: -30 }}
                  animate={{ 
                    opacity: crossoffIndex > i ? 1 : 0,
                    x: crossoffIndex > i ? 0 : -100,
                    rotateY: crossoffIndex > i ? 0 : -30,
                  }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className="flex items-center justify-center gap-4"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <span className="text-4xl">{item.icon}</span>
                  <span 
                    className="text-3xl sm:text-4xl md:text-5xl font-bold relative"
                    style={{
                      color: i === 2 ? '#4ade80' : '#94a3b8', // Green for 3rd item
                      textShadow: i === 2 
                        ? '2px 2px 0 #166534, 3px 3px 0 #14532d' 
                        : '2px 2px 0 #1e3a5f, 3px 3px 0 #0c1929',
                    }}
                  >
                    {item.text}
                    {/* Strike through - only for first 2 items */}
                    {i !== 2 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: crossoffIndex > i ? 1 : 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute top-1/2 left-0 right-0 h-1.5 bg-blue-400 origin-left rounded-full"
                        style={{ boxShadow: '0 0 15px rgba(96,165,250,0.7)' }}
                      />
                    )}
                  </span>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: crossoffIndex > i ? 1 : 0,
                      rotate: crossoffIndex > i ? 0 : -180,
                    }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    {i === 2 ? (
                      // Green checkmark for 3rd item
                      <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.7))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <XMarkIcon className="w-12 h-12 text-blue-400" style={{ filter: 'drop-shadow(0 0 10px rgba(96,165,250,0.7))' }} />
                    )}
                  </motion.div>
                </motion.div>
              ))}
              
              {/* New solution reveal - appears after ALL items crossed (crossoffIndex >= 4) */}
              {crossoffIndex >= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 flex flex-col items-center justify-center z-20"
                  style={{ 
                    background: 'linear-gradient(135deg, #0c1929 0%, #1a3a5c 50%, #0c1929 100%)',
                  }}
                >
                  {/* "Introducing" appears first */}
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl md:text-3xl text-blue-300 mb-6"
                  >
                    ❄️ Introducing ❄️
                  </motion.p>
                  
                  {/* "ABG Application Portal" appears after, takes center */}
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.5, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5, type: 'spring' }}
                    className="text-5xl sm:text-6xl md:text-8xl font-black text-center px-4"
                    style={{
                      background: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 60px rgba(147,197,253,0.5))',
                    }}
                  >
                    ABG Application Portal
                  </motion.h2>
                  
                  {/* Subtle tagline */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="text-lg text-blue-200/70 mt-6"
                  >
                    Winter 2026 Recruitment
                  </motion.p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* FEATURES SCROLL - 3D CYLINDER */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'features-scroll' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #0c1929 0%, #1a3a5c 50%, #0c1929 100%)',
            }}
          >
            {/* Winter snow particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 80 }, (_, i) => (
                <motion.div
                  key={`feature-snow-${i}`}
                  className="absolute rounded-full bg-white/50"
                  style={{
                    width: 2 + (i % 4) * 2,
                    height: 2 + (i % 4) * 2,
                    left: `${(i * 13) % 100}%`,
                  }}
                  initial={{ y: -20 }}
                  animate={{ 
                    y: ['0vh', '100vh'],
                  }}
                  transition={{
                    duration: 5 + (i % 4),
                    delay: i * 0.08,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
            
            <CylinderScroll items={features} radius={350} />
            
            {/* Title */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center">
              <h3 className="text-2xl font-bold text-blue-200">❄️ What the Portal Offers ❄️</h3>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* READY COUNTDOWN - 3, 2, 1 before portal */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'ready-countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #0c1929 0%, #1a3a5c 50%, #0c1929 100%)',
            }}
          >
            {/* Winter snow particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 60 }, (_, i) => (
                <motion.div
                  key={`ready-snow-${i}`}
                  className="absolute rounded-full bg-white/40"
                  style={{
                    width: 3 + (i % 5) * 2,
                    height: 3 + (i % 5) * 2,
                    left: `${(i * 17) % 100}%`,
                  }}
                  initial={{ y: -20 }}
                  animate={{ 
                    y: ['0vh', '100vh'],
                  }}
                  transition={{
                    duration: 6 + (i % 4),
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>

            {/* "Ready to Apply" text */}
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl text-blue-300 mb-8 font-medium"
            >
              Ready to Apply?
            </motion.p>

            {/* Big countdown number */}
            <AnimatePresence mode="wait">
              <motion.div
                key={readyCount}
                initial={{ scale: 2, opacity: 0, rotateX: -90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotateX: 90 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative"
              >
                <span 
                  className="text-[12rem] md:text-[16rem] font-black tabular-nums"
                  style={{
                    background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 60px rgba(251,191,36,0.5))',
                    lineHeight: 1,
                  }}
                >
                  {readyCount}
                </span>
                {/* Pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)',
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* PORTAL INTRO */}
      {/* ============================================ */}
      <AnimatePresence>
        {phase === 'portal-intro' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
            style={{ 
              perspective: '1000px',
              background: 'linear-gradient(135deg, #0c1929 0%, #1a3a5c 50%, #0c1929 100%)',
            }}
          >
            {/* Winter snow particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 60 }, (_, i) => (
                <motion.div
                  key={`portal-snow-${i}`}
                  className="absolute rounded-full bg-white/40"
                  style={{
                    width: 3 + (i % 5) * 2,
                    height: 3 + (i % 5) * 2,
                    left: `${(i * 17) % 100}%`,
                  }}
                  initial={{ y: -20 }}
                  animate={{ 
                    y: ['0vh', '100vh'],
                  }}
                  transition={{
                    duration: 6 + (i % 4),
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
            
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ type: 'spring', duration: 1 }}
              className="mb-8 z-10"
            >
              <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur border border-blue-300/30 flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="ABG Logo" 
                  width={80} 
                  height={80}
                  className="w-16 h-16 object-contain"
                />
              </div>
            </motion.div>

            {/* Title with 3D effect */}
            <motion.h1
              initial={{ opacity: 0, y: 50, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-center mb-4"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <span 
                className="block"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 0 #333, 4px 4px 0 #222, 6px 6px 15px rgba(0,0,0,0.5)',
                }}
              >
                Welcome to the
              </span>
              <span 
                className="block mt-2"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(3px 3px 0 rgba(251,191,36,0.3))',
                }}
              >
                Application Portal
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl sm:text-2xl text-gray-400 text-center mb-12 max-w-2xl"
            >
              Custom-built for Winter 2026 Recruitment
            </motion.p>

            {/* Features grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl"
            >
              {[
                { icon: '📊', label: 'Track Your Progress' },
                { icon: '☕', label: 'Book Coffee Chats' },
                { icon: '📅', label: 'Schedule Interviews' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                  className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <span className="text-gray-300 font-medium">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <AnimatePresence>
              {showCTA && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.button
                    onClick={() => router.push('/portal')}
                    whileHover={{ scale: 1.05, rotateX: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-bold text-xl rounded-2xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all"
                    style={{
                      boxShadow: '0 10px 40px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <RocketLaunchIcon className="w-7 h-7" />
                    Enter Portal
                    <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                  </motion.button>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-500 text-sm"
                  >
                    Applications are now open
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* PRE-LAUNCH COUNTDOWN DISPLAY */}
      {/* ============================================ */}
      {phase === 'pre-launch' && (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div
            animate={{
              filter: `blur(${frostIntensity * 3}px)`,
              opacity: 1 - frostIntensity * 0.3,
            }}
            className="text-center"
          >
            {/* Temperature indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium">
                <span className="text-lg">
                  {snowIntensity < 0.2 ? '🌡️' : snowIntensity < 0.4 ? '❄️' : snowIntensity < 0.6 ? '🥶' : snowIntensity < 0.8 ? '🧊' : '⛄'}
                </span>
                {snowIntensity < 0.2 ? 'Cooling down...' : 
                 snowIntensity < 0.4 ? 'Getting cold...' : 
                 snowIntensity < 0.6 ? 'Freezing...' : 
                 snowIntensity < 0.8 ? 'Sub-zero!' : 'FROZEN!'}
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              {waitingForTrigger && manualCountdown === 10 ? 'W26 Applications Are Ready!' : 'Applications Opening Soon'}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Winter 2026 Recruitment
            </p>

            {/* Manual Mode: Show countdown from 10 or waiting state */}
            {isManualMode ? (
              <div className="flex flex-col items-center gap-8">
                {/* Big countdown number when counting */}
                {manualCountdown < 10 && manualCountdown > 0 && (
                  <motion.div
                    key={manualCountdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4"
                  >
                    <span 
                      className="text-[10rem] md:text-[14rem] font-black tabular-nums leading-none"
                      style={{
                        background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.5))',
                      }}
                    >
                      {manualCountdown}
                    </span>
                  </motion.div>
                )}
                
                {/* Waiting for admin trigger - show after countdown ends */}
                {manualCountdown === 10 && waitingForTrigger && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-8xl"
                    >
                      ❄️
                    </motion.div>
                    <p className="text-2xl text-blue-300 font-medium animate-pulse">
                      Get ready...
                    </p>
                    <p className="text-gray-400 text-sm">
                      Waiting for admin to trigger the experience
                    </p>
                  </motion.div>
                )}
                
                {/* Show countdown before it ends (not in waiting state yet) */}
                {manualCountdown === 10 && !waitingForTrigger && countdown.isHydrated && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {[
                      { value: countdown.days, label: 'Days' },
                      { value: countdown.hours, label: 'Hours' },
                      { value: countdown.minutes, label: 'Minutes' },
                      { value: countdown.seconds, label: 'Seconds' },
                    ].map(({ value, label }) => (
                      <div key={label} className="flex flex-col items-center">
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 min-w-[100px]">
                          <span className="text-4xl sm:text-5xl font-bold text-yellow-400">
                            {value.toString().padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Progress text when counting */}
                {manualCountdown < 10 && manualCountdown > 0 && (
                  <p className="text-blue-300 text-lg animate-pulse">
                    ❄️ Winter is coming... ❄️
                  </p>
                )}
              </div>
            ) : (
              /* Time-based Countdown */
              countdown.isHydrated && (
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { value: countdown.days, label: 'Days' },
                    { value: countdown.hours, label: 'Hours' },
                    { value: countdown.minutes, label: 'Minutes' },
                    { value: countdown.seconds, label: 'Seconds' },
                  ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 min-w-[100px]">
                        <span className="text-4xl sm:text-5xl font-bold text-yellow-400">
                          {value.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
