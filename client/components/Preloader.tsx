'use client';
import { useState, useEffect } from 'react';
import { useLang } from './LanguageProvider';

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    // Wait for the window to be fully loaded + a small artistic delay
    const handleLoad = () => {
      setTimeout(() => {
        setLoading(false);
        // Remove from DOM after fade-out animation completes
        setTimeout(() => setShouldRender(false), 800);
      }, 1500);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#060a07] transition-all duration-700 ease-in-out ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="relative">
        {/* Outer Glowing Ring */}
        <div className="w-24 h-24 rounded-full border-2 border-primary/10 border-t-primary animate-spin shadow-[0_0_50px_rgba(145,247,142,0.1)]"></div>
        
        {/* Inner Pulsing Core */}
        <div className="absolute inset-0 m-auto w-12 h-12 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        
        {/* Central Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl animate-bounce">eco</span>
        </div>
      </div>

      <div className="mt-12 text-center space-y-4">
        <h2 className="text-2xl font-black font-headline text-white uppercase tracking-[0.3em] animate-pulse">
          {lang === 'ar' ? 'نقاء' : 'NAQAA'}
        </h2>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
          {lang === 'ar' ? 'جاري تحضير المستخلصات...' : 'Initializing Botanical Protocol...'}
        </p>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
