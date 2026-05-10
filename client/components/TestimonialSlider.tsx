'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from './LanguageProvider';
import { getImageUrl } from '@/lib/api';

interface Testimonial {
  author: string;
  role: string;
  text: string;
  color: string;
  img: string;
}

export function TestimonialSlider({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { dir } = useLang();
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, [nextSlide, isDragging]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const currentX = e.clientX;
      const diff = currentX - startX;
      setDragOffset(diff);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: y * 8, y: -x * 8 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Threshold for slide change
    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) prevSlide();
      else nextSlide();
    }
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) handleMouseUp();
    setRotate({ x: 0, y: 0 });
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  return (
    <div 
      className={`relative w-full py-32 perspective-2000 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="flex items-center justify-center h-[520px] relative transform-gpu transition-transform duration-200" style={{ 
        transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateX(${dragOffset}px)`,
      }}>
        {testimonials.map((testi, idx) => {
          let offset = idx - activeIndex;
          if (offset < -Math.floor(testimonials.length / 2)) offset += testimonials.length;
          if (offset > Math.floor(testimonials.length / 2)) offset -= testimonials.length;

          const isActive = offset === 0;
          const absOffset = Math.abs(offset);

          return (
            <div
              key={idx}
              className={`absolute w-full max-w-[520px] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu
                ${isActive ? 'z-30' : 'z-10'}
              `}
              style={{
                opacity: isActive ? 1 : 0.2 - absOffset * 0.05,
                transform: `
                  translateX(${offset * (dir === 'rtl' ? -85 : 85)}%) 
                  translateZ(${-absOffset * 300}px) 
                  rotateY(${-offset * 40}deg)
                  scale(${isActive ? 1.15 : 0.85})
                `,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              <div className={`
                glass-panel p-14 rounded-[4.5rem] relative overflow-hidden group
                ${testi.color === 'primary' ? 'border-primary/20 bg-primary/[0.04]' : 'border-secondary/20 bg-secondary/[0.04]'}
                backdrop-blur-3xl shadow-[0_50px_120px_rgba(0,0,0,0.5)]
              `}>
                {/* Floating Glow */}
                <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-xl blur-[120px] opacity-20 pointer-events-none transition-all duration-1000 group-hover:scale-150 ${testi.color === 'primary' ? 'bg-primary' : 'bg-secondary'}`} />
                
                <span className="material-symbols-outlined absolute top-12 right-16 text-white/5 text-9xl select-none font-black translate-z-10 pointer-events-none">format_quote</span>
                
                <div className="relative z-10 translate-z-50 p-2">
                  <p className="text-xl md:text-2xl leading-[1.7] italic text-on-surface font-light mb-14 drop-shadow-sm pointer-events-none">
                    {testi.text}
                  </p>
                  
                  <div className="flex items-center gap-7">
                    <div className="relative">
                      <div className={`absolute inset-0 rounded-xl blur-lg opacity-40 ${testi.color === 'primary' ? 'bg-primary' : 'bg-secondary'}`} />
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/20 relative z-10 p-1 group-hover:border-white/50 transition-all duration-700">
                        <img alt="Portrait" className="w-full h-full rounded-xl object-cover" src={getImageUrl(testi.img)}/>
                      </div>
                    </div>
                    <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                      <h5 className="font-headline font-black uppercase italic  text-2xl text-white group-hover:text-primary transition-colors">{testi.author}</h5>
                      <p className="text-[11px] text-white/40 uppercase font-black ] mt-2">{testi.role}</p>
                    </div>
                  </div>
                </div>

                {/* 3D Reflection Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Layer */}
      <div className="mt-20 flex flex-col items-center gap-10 relative z-50">
        <div className="flex gap-5">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="group relative py-3"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div className={`h-1.5 transition-all duration-700 rounded-xl ${activeIndex === idx ? 'w-14 bg-primary shadow-[0_0_30px_var(--accent-glow)]' : 'w-5 bg-white/10 group-hover:bg-white/40'}`} />
              {activeIndex === idx && (
                <div className="absolute -inset-3 bg-primary/20 blur-2xl animate-pulse rounded-xl" />
              )}
            </button>
          ))}
        </div>
        <p className="text-on-surface-variant font-label uppercase ] text-[10px] opacity-40 animate-pulse">
           {isDragging ? 'Let go to switch slide' : 'Drag or swipe to explore'}
        </p>
      </div>

      <style jsx>{`
        .perspective-2000 {
          perspective: 2000px;
        }
        .transform-gpu {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .translate-z-10 { transform: translateZ(10px); }
        .translate-z-50 { transform: translateZ(50px); }
      `}</style>
    </div>
  );
}
