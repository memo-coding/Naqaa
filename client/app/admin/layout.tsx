'use client';

import { AdminSidebar, AdminTopBar } from './AdminLayoutComponents';
import { useAuth } from '@/components/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !loading) {
       if (pathname !== '/login' && (!isAuthenticated || user?.role !== 'admin')) {
         router.replace('/login');
       } else if (pathname === '/login' && isAuthenticated && user?.role === 'admin') {
         router.replace('/admin');
       }
    }
  }, [user, loading, isAuthenticated, pathname, router, isMounted]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!isMounted || loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020603] space-y-4">
        <span className="w-10 h-10 border-4 border-[#2ff801]/30 border-t-[#2ff801] rounded-xl animate-spin shadow-[0_0_20px_rgba(47,248,1,0.5)]"></span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen flex overflow-hidden relative">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative w-full">
        <AdminTopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
