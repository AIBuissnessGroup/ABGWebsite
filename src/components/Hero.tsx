'use client';
import { motion } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import FloatingShapes from './FloatingShapes';
import EventCountdown from './EventCountdown';
import ApplicationCTA from './ApplicationCTA';
import { useState, useEffect } from 'react';

interface HeroContent {
  mainTitle: string;
  subTitle: string;
  thirdTitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
}

export default function Hero() {
  const [content, setContent] = useState<HeroContent>({
    mainTitle: "AI SHAPES",
    subTitle: "TOMORROW.",
    thirdTitle: "WE MAKE AI",
    description: "One project at a time. We're building the bridge between artificial intelligence and real-world business impact at the University of Michigan.",
    primaryButtonText: "See What's Possible",
    primaryButtonLink: "#join",
    secondaryButtonText: "Explore Projects",
    secondaryButtonLink: "/projects"
  });

  // Add state to track if we should show the warning
  const [showSystemWarning, setShowSystemWarning] = useState(false);

  useEffect(() => {
    fetch('/api/public/hero')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setContent(data);
        }
      })
      .catch(err => console.error('Failed to load hero content:', err));
  }, []);

  // Check if we should show the system warning (when deadline is approaching)
  useEffect(() => {
    const checkDeadline = () => {
      const deadline = new Date();
      deadline.setFullYear(2026, 1, 16); // September 11, 2025
      deadline.setHours(0, 0, 0, 0); // 7:40 PM EST
      
      const now = Date.now();
      const timeUntilDeadline = deadline.getTime() - now;
      
      // Show warning when less than 30 minutes until deadline
      if (timeUntilDeadline > 0 && timeUntilDeadline <= 40 * 60 * 1000) {
        setShowSystemWarning(true);
      } else {
        setShowSystemWarning(false);
      }
    };

    // Check immediately and then every 10 seconds
    checkDeadline();
    const interval = setInterval(checkDeadline, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      id="hero" 
      className="min-h-screen flex flex-col justify-center relative overflow-hidden px-4 sm:px-6 md:px-8 pt-16"
      style={{
        background: `linear-gradient(135deg, #00274c 0%, #1a2c45 50%, #2d3e5a 100%)`,
      }}
    >
      {/* Floating Background Shapes */}
      <FloatingShapes variant="dense" opacity={0.08} />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-80 h-40 sm:h-80 border border-white/10 rounded-full"
        />
        <motion.div
          animate={{ 
            rotate: [360, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -bottom-16 sm:-bottom-32 -left-16 sm:-left-32 w-32 sm:w-64 h-32 sm:h-64 border-2 border-white/5 rounded-full"
        />
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10 flex-1 flex flex-col justify-center py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-20 items-center justify-items-center lg:justify-items-stretch">
          
          {/* Left Column - Main Content */}
          <div className="w-full space-y-4 sm:space-y-6 lg:space-y-10 text-center lg:text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4 sm:space-y-6 lg:space-y-8"
            >
              <h1 className="heading-primary text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl text-white leading-tight">
                <span className="block mb-2 sm:mb-3">{content.mainTitle}</span>
                <span className="block text-[#BBBBBB] mb-2 sm:mb-3">{content.subTitle}</span>
                <span className="block">{content.thirdTitle}</span>
              </h1>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="h-1 w-16 sm:w-24 bg-gradient-to-r from-white to-[#BBBBBB] mx-auto lg:mx-0"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="body-text text-sm sm:text-base lg:text-xl xl:text-2xl text-[#BBBBBB] max-w-2xl leading-relaxed mx-auto lg:mx-0"
            >
              {content.description}
            </motion.p>
          
            {/* Applications CTA with Countdown */}
            <ApplicationCTA className="pt-2 sm:pt-4 justify-center lg:justify-start" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 justify-center lg:justify-start pt-2 sm:pt-4"
            >
              <a href={content.primaryButtonLink} className="btn-primary text-sm sm:text-base lg:text-lg px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-center font-bold">
                {content.primaryButtonText}
              </a>
              <a href={content.secondaryButtonLink} className="btn-secondary text-sm sm:text-base lg:text-lg px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 text-center font-bold">
                {content.secondaryButtonText}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-[#BBBBBB] pt-2 sm:pt-4 pb-8 sm:pb-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#BBBBBB] rounded-full pulse"></div>
                <span>University of Michigan</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-[#5e6472] rounded-full"></div>
              <span>Est. 2025</span>
            </motion.div>
          </div>
          

          {/* Right Column - Event Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full flex flex-col items-center lg:items-start order-1 lg:order-2 space-y-4"
          >
            {/* Compact System Alert - Above Event Countdown */}
            {showSystemWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="w-full max-w-md bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/40 rounded-lg p-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ 
                        backgroundColor: ['#ff6b6b', '#ffaa00', '#ff6b6b'],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="w-2 h-2 rounded-full"
                    />
                    <motion.span 
                      animate={{ 
                        color: ['#ff6b6b', '#ffaa00', '#ff6b6b']
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="font-bold uppercase tracking-wide text-xs"
                    >
                      🚨 ALERT
                    </motion.span>
                    <span className="text-white font-medium text-xs">
                      Project Applications Dropping Soon
                    </span>
                  </div>
                  
                  <motion.a 
                    href="/recruitment"
                    animate={{
                      x: [0, -1, 1, -1, 0],
                      textShadow: [
                        '0 0 0px #ff6b6b',
                        '0 0 5px #ff6b6b, 0 0 10px #ff6b6b',
                        '0 0 0px #ff6b6b',
                        '0 0 8px #ffaa00, 0 0 15px #ffaa00', 
                        '0 0 0px #ff6b6b'
                      ],
                      backgroundColor: [
                        '#dc2626',
                        '#dc2626',
                        '#000000',
                        '#dc2626',
                        '#dc2626'
                      ]
                    }}
                    transition={{ 
                      duration: 0.8, 
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                      times: [0, 0.2, 0.4, 0.6, 1]
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                  >
                    Monitor →
                  </motion.a>
                </div>
              </motion.div>
            )}
            
            <EventCountdown />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}       
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="hidden lg:block absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-xs text-[#BBBBBB] uppercase tracking-wider">Scroll to explore</span>
          <ChevronDownIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#BBBBBB]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
