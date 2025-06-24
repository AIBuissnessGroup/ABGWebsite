import React, { useState, useEffect } from 'react';

interface FloatingShapesProps {
  variant?: 'default' | 'dense' | 'minimal';
  opacity?: number;
}

export default function FloatingShapes({ variant = 'default', opacity = 0.1 }: FloatingShapesProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  // Seeded random function for consistent results
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const shapeCount = variant === 'dense' ? 12 : variant === 'minimal' ? 6 : 8;
  
  const shapes = Array.from({ length: shapeCount }, (_, i) => {
    const shapeTypes = ['circle', 'square', 'triangle', 'diamond'];
    const animations = ['float-slow', 'float-medium', 'float-fast', 'pulse-shape'];
    const delays = ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5'];
    
    const shapeType = shapeTypes[i % shapeTypes.length];
    const animation = animations[i % animations.length];
    const delay = delays[i % delays.length];
    
    // Seeded positioning for consistency
    const top = seededRandom(i * 1000 + 1) * 80 + 10; // 10% to 90%
    const left = seededRandom(i * 1000 + 2) * 80 + 10; // 10% to 90%
    const size = seededRandom(i * 1000 + 3) * 60 + 20; // 20px to 80px
    
    let shapeElement;
    
    switch (shapeType) {
      case 'circle':
        shapeElement = (
          <div 
            className={`w-${Math.floor(size/4)*4} h-${Math.floor(size/4)*4} border-2 border-white rounded-full`}
            style={{ 
              width: `${size}px`, 
              height: `${size}px`,
              borderColor: `rgba(255, 255, 255, ${opacity})`
            }}
          />
        );
        break;
      case 'square':
        shapeElement = (
          <div 
            className="border-2 border-white rounded-lg"
            style={{ 
              width: `${size}px`, 
              height: `${size}px`,
              borderColor: `rgba(255, 255, 255, ${opacity})`
            }}
          />
        );
        break;
      case 'triangle':
        shapeElement = (
          <div 
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size/2}px solid transparent`,
              borderRight: `${size/2}px solid transparent`,
              borderBottom: `${size}px solid rgba(255, 255, 255, ${opacity})`
            }}
          />
        );
        break;
      case 'diamond':
        shapeElement = (
          <div 
            className="border-2 border-white rotate-45"
            style={{ 
              width: `${size}px`, 
              height: `${size}px`,
              borderColor: `rgba(255, 255, 255, ${opacity})`
            }}
          />
        );
        break;
      default:
        shapeElement = (
          <div 
            className="w-8 h-8 border-2 border-white rounded-full"
            style={{ borderColor: `rgba(255, 255, 255, ${opacity})` }}
          />
        );
    }
    
    return (
      <div
        key={i}
        className={`floating-shape ${animation} ${delay}`}
        style={{
          top: `${top}%`,
          left: `${left}%`,
        }}
      >
        {shapeElement}
      </div>
    );
  });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes}
      
      {/* Additional special shapes */}
      <div className="floating-shape orbit-shape delay-1" style={{ top: '20%', left: '80%' }}>
        <div className="w-4 h-4 bg-white rounded-full" style={{ opacity: opacity * 2 }} />
      </div>
      
      <div className="floating-shape orbit-shape delay-3" style={{ top: '70%', left: '15%' }}>
        <div className="w-6 h-6 border-2 border-white rounded-full" style={{ borderColor: `rgba(255, 255, 255, ${opacity})` }} />
      </div>
    </div>
  );
} 