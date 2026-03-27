'use client';

import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCart } from '@/components/CartProvider';
import { useLang } from '@/components/LanguageProvider';
import { useAuth } from '@/components/AuthProvider';
import { NotificationBell } from '@/components/NotificationBell';
import { useWishlist } from '@/components/WishlistProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMenu } from '@/components/MenuProvider';

export function Navbar() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlist, setIsWishlistOpen } = useWishlist();
  const { t, toggleLang, dir } = useLang();
  const { isAuthenticated, user } = useAuth();
  const { toggleMenu } = useMenu();

  // Navbar is now visible on all pages as requested.
  // Previous logic hid it on /login, /signup, /checkout, and /admin.

  return (
    <header
      className="fixed top-0 w-full z-50 backdrop-blur-xl transition-colors duration-500 border-b border-white/5 shadow-sm"
      style={{ background: 'var(--nav-bg)' }}
    >
      <nav className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto gap-8" dir={dir}>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMenu}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all duration-300 shadow-sm"
          >
            <span className="material-symbols-outlined text-2xl font-bold">menu</span>
          </button>
          <BrandLogo />
        </div>

        <div className="flex items-center gap-1.5 md:gap-4">
          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 mx-4">
            <Link href="/" className="text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">{t('nav_home')}</Link>
            <Link href="/shop" className="text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">{t('nav_shop')}</Link>
          </div>

          <button
            onClick={toggleLang}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/10 transition-all"
          >
            {t('nav_language')}
          </button>
          <ThemeToggle />

          {/* Wishlist */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative group text-on-surface-variant hover:text-primary transition-colors p-2"
          >
            <span
              className="material-symbols-outlined group-hover:drop-shadow-[0_0_6px_var(--accent-glow)]"
              style={{ fontVariationSettings: wishlist.length > 0 ? "'FILL' 1" : '' }}
            >
              favorite
            </span>
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-on-primary-container text-[8px] font-black rounded-xl flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Track Shipment */}
          <Link
            href="/track-order"
            title={t('track_shipment')}
            className="relative group text-on-surface-variant hover:text-primary transition-colors p-2"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:drop-shadow-[0_0_6px_var(--accent-glow)]">
              local_shipping
            </span>
          </Link>

          {/* Notifications */}
          <NotificationBell isAdminView={false} />

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative group text-on-surface-variant hover:text-primary transition-colors p-2"
          >
            <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_6px_var(--accent-glow)]">
              shopping_bag
            </span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-on-primary-container text-[8px] font-black rounded-xl flex items-center justify-center">
              {cartCount}
            </span>
          </button>

          {/* Admin link — only visible to admin users */}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-2 group p-2 text-secondary hover:text-primary transition-colors border border-secondary/20 rounded-xl px-3"
            >
              <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_6px_var(--accent-glow)] text-sm">
                dashboard
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Admin</span>
            </Link>
          )}

          {/* Profile / Login */}
          <Link
            href={isAuthenticated ? '/profile' : '/login'}
            title={isAuthenticated ? t('nav_profile') : t('nav_login')}
            className="hidden sm:flex items-center gap-2 group p-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_6px_var(--accent-glow)]">
              account_circle
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
