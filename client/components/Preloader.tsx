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
      }, 500);
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
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#020603] transition-all duration-700 ease-in-out ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="w-10 h-10 border-4 border-[#2ff801]/30 border-t-[#2ff801] rounded-xl animate-spin shadow-[0_0_20px_rgba(47,248,1,0.5)]"></span>
      </div>
    </div>
  );
}
