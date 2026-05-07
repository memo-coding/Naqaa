'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { fetchApi } from '@/lib/api';
import { useLang } from './LanguageProvider';
import { useSocket } from './SocketProvider';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  metadata?: any;
}

export function NotificationBell({ isAdminView = false }: { isAdminView?: boolean }) {
  const { isAuthenticated, loading } = useAuth();
  const { t, dir } = useLang();
  const { socket } = useSocket();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (!isAuthenticated) return;
      try {
        const endpoint = isAdminView ? '/notifications/admin' : '/notifications';
        const data = await fetchApi(endpoint);
        if (data) {
          setNotifications(data);
        }
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    };

    if (!loading && isAuthenticated) {
      fetchNotifs();
    }
  }, [isAuthenticated, loading, isAdminView]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notif: Notification) => {
        setNotifications(prev => [notif, ...prev].slice(0, 20));
      };

      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket, isAdminView]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const endpoint = isAdminView ? '/notifications/admin/read-all' : '/notifications/read-all';
      await fetchApi(endpoint, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const translateTitle = (title: string) => {
    if (title === 'New Order Received') return t('notif_new_order_title') || title;
    if (title === 'Order Confirmed') return t('notif_order_confirmed_title') || title;
    if (title === 'Order Status Update') return t('notif_status_update_title') || title;
    return title;
  };

  const translateMessage = (n: Notification) => {
    const { message: msg, metadata: meta } = n;
    
    if (n.title === 'New Order Received' && meta?.customer) {
      return (t('notif_new_order_msg') || 'طلب جديد من {name} بمبلغ {amount} EGP').replace('{name}', meta.customer).replace('{amount}', meta.amount || '');
    }
    
    if (n.title === 'Order Status Update' && meta?.status) {
      const statusMap: any = {
        'pending': t('status_pending') || 'قيد الانتظار',
        'processing': t('status_processing') || 'جاري التجهيز',
        'shipped': t('status_shipped') || 'تم الشحن',
        'delivered': t('status_delivered') || 'تم التسليم',
        'cancelled': t('status_cancelled') || 'ملغي',
        'cancelled_no_refund': t('status_cancelled_no_refund') || 'ملغي (بدون استرداد)'
      };
      
      if (meta.status === 'shipped') return t('notif_status_msg_shipped') || 'طلبك في الطريق إليك!';
      if (meta.status === 'delivered') return t('notif_status_msg_delivered') || 'تم تسليم طلبك. استمتع بمنتجات Naqaa!';
      
      return (t('notif_status_msg_generic') || 'تم تحديث حالة طلبك إلى: {status}').replace('{status}', statusMap[meta.status] || meta.status);
    }

    if (msg.startsWith('Order received from ')) {
      const name = msg.replace('Order received from ', '');
      return (t('notif_new_order_msg') || msg).replace('{name}', name);
    }
    if (msg === 'Your order has been successfully placed and is being processed.') {
      return t('notif_order_confirmed_msg') || msg;
    }
    if (msg === 'Your order is on the way!') {
      return t('notif_status_msg_shipped') || msg;
    }
    if (msg.startsWith('Your order has been delivered.')) {
      return t('notif_status_msg_delivered') || msg;
    }
    return msg;
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return dir === 'rtl' ? 'الآن' : 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return dir === 'rtl' ? `منذ ${diffInMinutes} د` : `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return dir === 'rtl' ? `منذ ${diffInHours} س` : `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all relative ${
          isOpen ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
        }`}
      >
        <span className="material-symbols-outlined group-hover:drop-shadow-[0_0_8px_var(--accent-glow)]">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-xl flex items-center justify-center shadow-lg border border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-12 ${dir === 'rtl' ? 'left-0 text-right' : 'right-0 text-left'} w-80 bg-background border border-primary/20 rounded-2xl shadow-2xl p-4 z-[100] animate-in fade-in slide-in-from-top-2`} 
          dir={dir === 'rtl' ? 'rtl' : 'ltr'}
        >
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/20 gap-x-2 flex-wrap">
            <h4 className="text-[10px] md:text-xs font-black uppercase  text-primary truncate">
              {isAdminView ? t('admin_specimen_alerts') : t('notifications_title')}
            </h4>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead} 
                className="text-[9px] text-secondary hover:underline uppercase font-bold  whitespace-nowrap"
              >
                {t('notifications_mark_all')}
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 text-center py-4 font-bold">{t('notifications_empty')}</p>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n._id);
                    if (n.link) window.location.href = n.link;
                  }}
                  className={`flex gap-3 p-3 rounded-xl transition-all ${
                    n.isRead ? 'opacity-60 cursor-default' : 'bg-surface-container-high hover:bg-surface-container-highest cursor-pointer border shadow-sm border-primary/10'
                  } ${n.link ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'order' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {n.type === 'order' ? 'shopping_bag' : 'notifications_active'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold uppercase  ${!n.isRead ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {translateTitle(n.title)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed truncate-2-lines">{translateMessage(n)}</p>
                    <p className="text-[9px] text-primary/60 mt-2 font-bold uppercase ">
                      {getRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
