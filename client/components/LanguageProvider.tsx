'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Lang = 'en' | 'ar';

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LangContext = createContext<LangContextType>({
  lang: 'en', toggleLang: () => {}, t: (k) => k, dir: 'ltr',
});

export const useLang = () => useContext(LangContext);

import { translations } from '@/lib/translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('naqaa-lang') as Lang | null;
    if (saved) setLang(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);
    localStorage.setItem('naqaa-lang', lang);
  }, [lang, mounted]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[lang] || translations.en;
    return (dict as Record<string, string>)[key] || key;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' as const : 'ltr' as const;

  if (!mounted) return <>{children}</>;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, dir }}>
      {children}
    </LangContext.Provider>
  );
}
