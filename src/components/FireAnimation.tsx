'use client';
import { motion } from 'framer-motion';

interface FireAnimationProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function FireAnimation({ size = 'medium', className = '' }: FireAnimationProps) {
  const sizeClasses = {
    small: 'w-16 h-20',
    medium: 'w-24 h-32',
    large: 'w-32 h-40'
  };

  const flames = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Logs/Base */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-3 bg-gradient-to-r from-amber-900 to-amber-800 rounded-full shadow-lg"></div>
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 translate-x-2 w-16 h-2 bg-gradient-to-r from-amber-800 to-amber-700 rounded-full"></div>
      
      {/* Fire Flames */}
      <div className="relative w-full h-full">
        {flames.map((flame, index) => (
          <motion.div
            key={flame}
            className="absolute bottom-2"
            style={{
              left: `${20 + index * 12}%`,
              width: `${8 + index * 2}px`,
              height: `${16 + index * 4}px`,
            }}
            animate={{
              scaleY: [1, 1.2, 0.8, 1.1, 0.9, 1],
              scaleX: [1, 0.8, 1.1, 0.9, 1.2, 1],
              opacity: [0.8, 1, 0.9, 1, 0.8],
            }}
            transition={{
              duration: 1 + index * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1,
            }}
          >
            {/* Main flame */}
            <div className="w-full h-full bg-gradient-to-t from-red-500 via-orange-400 to-yellow-300 rounded-full opacity-90 filter blur-[1px]"></div>
            
            {/* Inner flame */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-3/4 bg-gradient-to-t from-orange-600 via-yellow-400 to-yellow-200 rounded-full"
              animate={{
                scaleY: [1, 1.3, 0.9, 1.2, 1],
                opacity: [0.7, 1, 0.8, 1, 0.7],
              }}
              transition={{
                duration: 0.8 + index * 0.15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.05,
              }}
            ></motion.div>
          </motion.div>
        ))}
        
        {/* Sparks */}
        {Array.from({ length: 3 }, (_, i) => (
          <motion.div
            key={`spark-${i}`}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            style={{
              left: `${30 + i * 20}%`,
              bottom: `${60 + i * 10}%`,
            }}
            animate={{
              y: [-10, -30, -10],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.7,
            }}
          />
        ))}
      </div>
      
      {/* Glow effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-1/2 bg-gradient-radial from-orange-400/30 via-red-400/20 to-transparent rounded-full filter blur-md"></div>
    </div>
  );
}