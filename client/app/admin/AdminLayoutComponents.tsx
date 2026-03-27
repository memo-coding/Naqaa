'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLang } from '@/components/LanguageProvider';
import { useAuth } from '@/components/AuthProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/NotificationBell';

export function AdminSidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const { lang, dir, t } = useLang();
  
  const navItems = [
    { label: t('nav_admin_dashboard') || 'Dashboard', icon: 'dashboard', href: '/admin', fill: true },
    { label: t('nav_admin_analytics') || 'Analytics', icon: 'monitoring', href: '/admin/analytics' },
    { label: t('nav_admin_inventory') || 'Inventory', icon: 'potted_plant', href: '/admin/inventory' },
    { label: t('nav_admin_orders') || 'Orders', icon: 'shopping_bag', href: '/admin/orders' },
    { label: t('nav_admin_customers') || 'Customers', icon: 'group', href: '/admin/customers' },
    { label: 'شركات الشحن', icon: 'local_shipping', href: '/admin/shipping' },
    { label: t('nav_admin_cms') || 'CMS', icon: 'edit_note', href: '/admin/cms' },
    { label: 'أقسام المنتجات', icon: 'category', href: '/admin/categories' },
    { label: t('admin_settings') || 'Settings', icon: 'settings', href: '/admin/settings' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 z-[60] lg:relative lg:flex h-screen w-64 border-primary/15 bg-surface-container-low flex flex-col py-8 flex-shrink-0 transition-transform duration-500 
      ${dir === 'rtl' ? 'border-l' : 'border-r'}
      ${isOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
    `}>
      <div className="flex items-center justify-between px-8 mb-10">
        <div className="space-y-2">
          <BrandLogo />
          <p className="font-['Cairo'] font-bold uppercase tracking-widest text-[9px] text-on-surface-variant/40 leading-none">{t('admin_atelier_control')}</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-on-surface/10 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex items-center gap-3 py-3 px-6 transition-all duration-300 relative group ${
              pathname === item.href 
                ? 'text-secondary bg-secondary/10 border-l-4 border-secondary shadow-[0_0_15px_var(--accent-glow)]' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined transition-transform duration-300 group-hover:scale-110" style={item.fill && pathname === item.href ? {fontVariationSettings: "'FILL' 1"} : {}}>
              {item.icon}
            </span>
            <span className="font-headline font-bold uppercase tracking-widest text-[11px] leading-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-6 mt-auto py-4 border-t border-outline-variant/10">
        <Link href="/admin/products" className="w-full block py-4 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-center font-headline font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_var(--accent-glow)] active:scale-95 transition-all">
          {t('admin_manage_products')}
        </Link>
      </div>
    </aside>
  );
}

export function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t, toggleLang, lang, dir } = useLang();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-4 lg:px-8 py-4 backdrop-blur-xl border-b border-primary/10 transition-colors duration-500" dir={dir} style={{ background: 'var(--nav-bg)' }}>
      <div className={`flex items-center gap-4 lg:gap-6 flex-1`}>
        <button 
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all duration-300 shadow-sm"
        >
          <span className="material-symbols-outlined text-2xl font-bold">menu</span>
        </button>
        {/* Search bar removed for admin */}
      </div>
      <div className={`flex items-center gap-2 lg:gap-4 ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} relative`}>
        <button onClick={toggleLang} className="hidden sm:block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all">
            {t('nav_language')}
        </button>
        <ThemeToggle />
        
        <NotificationBell isAdminView={true} />

        <div className="relative">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2 lg:gap-3 ${dir === 'rtl' ? 'mr-2 pr-4 border-r' : 'ml-2 pl-4 border-l'} border-outline-variant/30 cursor-pointer group ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`text-right hidden md:block ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
              <p className="text-xs font-bold font-headline text-on-surface group-hover:text-primary transition-colors">{user?.name || '—'}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl border-2 border-primary/20 p-0.5 group-hover:border-primary transition-colors hover:scale-105 transition-transform">
              <img className="w-full h-full rounded-xl object-cover shadow-sm" alt={user?.name || 'Admin'} src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'Admin')}&background=91f78e&color=002a06&size=128&bold=true`} />
            </div>
          </div>

          {isProfileOpen && (
            <div className={`absolute top-14 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-56 bg-surface-container border border-primary/20 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2`}>
              <div className="p-4 border-b border-outline-variant/20 bg-surface-container-high">
                <p className="text-[10px] uppercase font-black text-primary tracking-widest leading-none mb-1">{t('admin_authenticated_as')}</p>
                <p className="text-sm font-bold truncate">{user?.email || '—'}</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={toggleLang}
                  className="sm:hidden w-full flex items-center gap-3 p-2 text-xs font-bold hover:bg-surface-container-high rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">language</span> {t('nav_language')}
                </button>
                <Link 
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-3 p-2 text-xs font-bold hover:bg-surface-container-high rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">settings</span> {t('admin_settings')}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-2 text-xs font-bold hover:bg-surface-container-high rounded-lg transition-colors text-error"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> {t('admin_terminate_session')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
