'use client';
import { useCMS } from './CMSProvider';
import { useLang } from './LanguageProvider';
import Link from 'next/link';
import { getImageUrl } from '@/lib/api';

export function BrandLogo({ className = "" }: { className?: string }) {
  const { data } = useCMS();
  const { lang, t } = useLang();

  const brandName = lang === 'ar' ? data.brandName_ar : data.brandName_en;

  return (
    <Link href="/" className={`inline-block hover:scale-105 transition-transform ${className}`}>
      {data.logoType === 'image' && data.logoUrl ? (
        <img 
          src={getImageUrl(data.logoUrl)} 
          className="h-8 md:h-10 w-auto object-contain" 
          alt={brandName} 
        />
      ) : (
        <span className="text-2xl font-black text-primary font-headline uppercase  leading-none">
          {brandName}
        </span>
      )}
    </Link>
  );
}
