'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselSlide {
  title: string;
  description: string;
  icon: string;
  duration: number;
}

interface CollaborationCarouselProps {
  displayMode: 'carousel' | 'image';
  title: string;
  subtitle: string;
  slides: CarouselSlide[];
  teamImage?: string;
}

export default function CollaborationCarousel({
  displayMode = 'image', // Changed from 'carousel' to 'image'
  title = 'Innovation Through Collaboration',
  subtitle = 'Building the future together',
  slides = [],
  teamImage = '/ABG.Group.Photo.jpg' // Default to team photo
}: CollaborationCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (displayMode !== 'carousel' || !isPlaying || slides.length === 0) return;

    const currentSlideDuration = slides[currentSlide]?.duration || 30;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, currentSlideDuration * 200); // Slowed down from 100ms to 200ms per second

    return () => clearInterval(timer);
  }, [currentSlide, isPlaying, slides, displayMode]);

  // Image mode
  if (displayMode === 'image' && teamImage) {
    return (
      <div className="glass-card p-6 sm:p-8 h-72 sm:h-96 relative overflow-hidden">
        <img 
          src={teamImage} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#00274c]/70 via-transparent to-transparent"></div>
        <div className="relative z-10 h-full flex items-end">
          <div className="text-left">
            <p className="text-white text-base sm:text-lg font-bold mb-2 drop-shadow-lg">
              {title}
            </p>
            <p className="text-[#BBBBBB] text-xs sm:text-sm drop-shadow-md">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Carousel mode
  const currentSlideData = slides[currentSlide];

  return (
    <div 
      className="glass-card p-6 sm:p-8 h-60 sm:h-80 relative overflow-hidden cursor-pointer"
      onClick={() => setIsPlaying(!isPlaying)}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00274c]/80 to-[#1a2c45]/80"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Header */}
        <div className="text-center">
          <p className="text-white text-base sm:text-lg font-bold mb-1">
            {title}
          </p>
          <p className="text-[#BBBBBB] text-xs sm:text-sm">
            {subtitle}
          </p>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentSlideData && (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-3 sm:space-y-4 max-w-xs"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-3xl sm:text-4xl"
                >
                  {currentSlideData.icon}
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white text-sm sm:text-base font-bold"
                >
                  {currentSlideData.title}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[#BBBBBB] text-xs sm:text-sm leading-relaxed"
                >
                  {currentSlideData.description}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with Controls */}
        <div className="flex items-center justify-between">
          
          {/* Slide Indicators */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-4' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Play/Pause */}
          <div className="flex items-center gap-2">
            <span className="text-[#BBBBBB] text-xs">
              {isPlaying ? '⏸️' : '▶️'}
            </span>
            <span className="text-[#BBBBBB] text-xs">
              {currentSlide + 1}/{slides.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {isPlaying && currentSlideData && (
          <motion.div
            className="absolute bottom-70 left-0 h-1 bg-white/30"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: currentSlideData.duration / 5,
              ease: 'linear'
            }}
            key={`progress-${currentSlide}`}
          />
        )}
      </div>
    </div>
  );
}