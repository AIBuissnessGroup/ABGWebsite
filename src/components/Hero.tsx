'use client';
import { motion } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import FloatingShapes from './FloatingShapes';
import EventCountdown from './EventCountdown';
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

  useEffect(() => {
    fetch('/api/admin/hero')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setContent(data);
        }
      })
      .catch(err => console.error('Failed to load hero content:', err));
  }, []);

  return (
    <section 
      id="hero" 
      className="min-h-screen flex flex-col justify-center relative overflow-hidden px-6 sm:px-8 md:px-6"
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

      <div className="max-w-7xl mx-auto md:px-6 lg:px-12 relative z-10 flex-1 flex flex-col justify-center py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center mb-12 sm:mb-16">
          
          {/* Left Column - Main Content */}
          <div className="space-y-8 sm:space-y-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >
              <h1 className="heading-primary text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-tight">
                <span className="block mb-6 sm:mb-3">{content.mainTitle}</span>
                <span className="block text-[#BBBBBB] mb-6 sm:mb-3">{content.subTitle}</span>
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
              className="body-text text-lg sm:text-xl lg:text-2xl text-[#BBBBBB] max-w-2xl leading-relaxed mx-auto lg:mx-0 px-2 sm:px-0"
            >
              {content.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start pt-4"
            >
              <a href={content.primaryButtonLink} className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 text-center font-bold">
                {content.primaryButtonText}
              </a>
              <a href={content.secondaryButtonLink} className="btn-secondary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 text-center font-bold">
                {content.secondaryButtonText}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-[#BBBBBB] pt-4"
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
            className="relative mt-8 lg:mt-0"
          >
            <EventCountdown />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}       
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2"
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
