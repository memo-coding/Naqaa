'use client';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { useLang } from './LanguageProvider';
import { useCMS } from './CMSProvider';

export function Footer() {
  const { t, lang, dir } = useLang();
  const { data: cms } = useCMS();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-primary/10 bg-surface-container-low transition-colors duration-500">
      <div className="p-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto px-8 py-16">
          <div className="space-y-6">
            <BrandLogo className={dir === 'rtl' ? 'mr-0 ml-auto' : 'ml-0 mr-auto'} />
            <p className={`font-body text-sm text-on-surface-variant leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {lang === 'ar' ? cms.footerDesc_ar : cms.footerDesc_en}
            </p>
          </div>
          <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <h5 className="text-on-surface font-bold font-headline text-sm uppercase ">{t('footer_nav')}</h5>
            <ul className="space-y-2">
              <li><Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="/shop">{t('footer_shop_all')}</Link></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_specimen_map')}</a></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_science')}</a></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_sustainability')}</a></li>
            </ul>
          </div>
          <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <h5 className="text-on-surface font-bold font-headline text-sm uppercase ">{t('footer_connect')}</h5>
            <ul className="space-y-2">
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">Instagram</a></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">TikTok</a></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">Contact Us</a></li>
            </ul>
          </div>
          <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <h5 className="text-on-surface font-bold font-headline text-sm uppercase ">{t('footer_legal')}</h5>
            <ul className="space-y-2">
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_privacy')}</a></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_terms')}</a></li>
              <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_shipping')}</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 border-t border-primary/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-body text-[10px] font-bold uppercase text-on-surface-variant/40 flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <span>{lang === 'ar' ? cms.footerCopyright_ar : cms.footerCopyright_en}</span>
            <span className="opacity-20 hidden md:block">|</span>
            <span className="text-white">{lang === 'ar' ? 'بواسطة' : 'Made by'}</span>
            <a 
              href="https://facebook.com/memo.coding" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-secondary transition-all font-black decoration-primary/30 hover:decoration-secondary underline underline-offset-4"
            >
              Mohammed Refaat (Memo)
            </a>
          </div>
          <div className="flex gap-6">
            <span className="text-[8px] text-on-surface-variant/30 font-black uppercase ">Carbon Neutral Site</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
