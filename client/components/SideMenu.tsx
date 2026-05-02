'use client';
import { useMenu } from '@/components/MenuProvider';
import { useLang } from '@/components/LanguageProvider';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export function SideMenu() {
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const { t, dir, lang } = useLang();
  const { isAuthenticated, user } = useAuth();

  if (!isMenuOpen) return null;

  const navLinks = [
    { label: t('nav_home') || (lang === 'ar' ? 'الرئيسية' : 'Home'), href: '/', icon: 'home' },
    { label: t('nav_shop') || (lang === 'ar' ? 'المتجر' : 'Shop'), href: '/shop', icon: 'shopping_basket' },
    { label: t('track_shipment') || (lang === 'ar' ? 'تتبع الشحنة' : 'Track Order'), href: '/track-order', icon: 'local_shipping' },
    { label: t('nav_profile') || (lang === 'ar' ? 'الملف الشخصي' : 'My Profile'), href: '/profile', icon: 'account_circle' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/40" 
        onClick={() => setIsMenuOpen(false)}
      ></div>
      <div className={`w-full max-w-sm h-full bg-background border-outline-variant/30 shadow-2xl relative z-10 p-10 flex flex-col animate-in ${dir === 'rtl' ? 'slide-in-from-left' : 'slide-in-from-right'} duration-500`}>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-black font-headline  uppercase italic text-primary">
            {lang === 'ar' ? 'القائمة' : 'Menu'}
          </h2>
          <button 
            onClick={() => setIsMenuOpen(false)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-4">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-surface-container border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  {link.icon}
                </span>
              </div>
              <span className="font-headline font-black text-sm ">{link.label}</span>
            </Link>
          ))}

          {isAuthenticated && user?.role === 'admin' && (
            <Link 
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <span className="material-symbols-outlined text-secondary">
                  dashboard
                </span>
              </div>
              <span className="font-headline font-black text-sm  text-secondary">
                {lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
              </span>
            </Link>
          )}
        </nav>

        <div className="pt-8 border-t border-outline-variant/10">
          <p className="text-[10px] font-black uppercase ] opacity-30 text-center mb-4">
            {lang === 'ar' ? 'بواسطة نقاء' : 'Powered by Naqaa'}
          </p>
        </div>
      </div>
    </div>
  );
}
