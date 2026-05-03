import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ShoppingBag, Tag, Wallet, MessageSquare, ChevronRight, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  type: 'order' | 'offer' | 'wallet' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface NotificationsProps {
  onBack: () => void;
}

export default function Notifications({ onBack }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('lokal_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((n: any) => ({
        id: n.id,
        type: 'system',
        title: n.title,
        message: n.message,
        time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: n.read
      }));
    }
    return [
      {
        id: '1',
        type: 'order',
        title: 'Order Delivered!',
        message: 'Your order ORD-8923 from Fresh Mart has been delivered. Enjoy!',
        time: '2 mins ago',
        isRead: false
      },
    ];
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('lokal_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({
          id: n.id,
          type: 'system',
          title: n.title,
          message: n.message,
          time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: n.read
        })));
      }
    };
    window.addEventListener('notifications_updated', handleUpdate);
    return () => window.removeEventListener('notifications_updated', handleUpdate);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // Sync back to localStorage if needed
    const saved = localStorage.getItem('lokal_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      const updated = parsed.map((n: any) => ({ ...n, read: true }));
      localStorage.setItem('lokal_notifications', JSON.stringify(updated));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const saved = localStorage.getItem('lokal_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      const updated = parsed.filter((n: any) => n.id !== id);
      localStorage.setItem('lokal_notifications', JSON.stringify(updated));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'offer': return <Tag className="w-5 h-5 text-yellow-600" />;
      case 'wallet': return <Wallet className="w-5 h-5 text-green-600" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-50';
      case 'offer': return 'bg-yellow-50';
      case 'wallet': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-white border-b border-gray-50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900">Notifications</h2>
        </div>
        <button 
          onClick={markAllRead}
          className="text-[10px] font-black text-yellow-600 uppercase tracking-widest px-3 py-2 bg-yellow-50 rounded-lg active:scale-95 transition-all"
        >
          Mark all read
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-[2rem] border transition-all relative group ${
                  n.isRead ? 'bg-white border-gray-100' : 'bg-gray-50/50 border-gray-200 shadow-sm'
                }`}
              >
                {!n.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
                
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getBg(n.type)}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{n.time}</p>
                      <button 
                        onClick={() => deleteNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className={`text-sm font-black text-gray-900 mb-1 ${!n.isRead ? 'pr-6' : ''}`}>{n.title}</h3>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-6">
                <Bell className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-sm font-bold text-gray-400 px-12">
                We'll notify you when something important happens!
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-gradient-to-t from-white to-transparent">
        <button 
          className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200"
        >
          View Notification Settings
        </button>
      </div>
    </div>
  );
}
