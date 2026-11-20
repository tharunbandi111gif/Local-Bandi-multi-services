import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  Package, 
  Stethoscope,
  User
} from 'lucide-react';
import { Screen } from '../types';

interface CustomerBottomNavProps {
  currentScreen: string;
  onNavigate: (screen: Screen) => void;
  wishlistCount: number;
  cartCount: number;
  onOpenHospitalOP?: () => void;
}

export default function CustomerBottomNav({
  currentScreen,
  onNavigate,
  wishlistCount,
  cartCount,
  onOpenHospitalOP
}: CustomerBottomNavProps) {
  const isTabActive = (tabId: string) => {
    if (tabId === 'home') return currentScreen === 'home';
    if (tabId === 'categories') return currentScreen === 'categories' || currentScreen === 'category';
    if (tabId === 'hospitalOP') return currentScreen === 'hospitalOP';
    if (tabId === 'orders') return currentScreen === 'orders' || currentScreen === 'tracking';
    if (tabId === 'cart') return currentScreen === 'cart';
    if (tabId === 'profile') return currentScreen === 'profile';
    if (tabId === 'wishlist') return currentScreen === 'wishlist';
    return currentScreen === tabId;
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => onNavigate('home')
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: LayoutGrid,
      action: () => onNavigate('categories')
    },
    {
      id: 'hospitalOP',
      label: 'OPD',
      icon: Stethoscope,
      action: () => {
        if (onOpenHospitalOP) {
          onOpenHospitalOP();
        } else {
          onNavigate('hospitalOP');
        }
      }
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      action: () => onNavigate('orders')
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingBag,
      badge: cartCount,
      action: () => onNavigate('cart')
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      action: () => onNavigate('profile')
    }
  ];

  return (
    <nav 
      aria-label="Customer Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-1.5 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] safe-bottom"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isTabActive(item.id);

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 cursor-pointer ${
                active 
                  ? 'text-yellow-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                
                {/* Notification / Count Badge */}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-yellow-400 text-slate-950 text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-md animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>

              {/* Active glow dot */}
              {active && (
                <motion.div 
                  layoutId="activeBottomNavDot"
                  className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5 shadow-[0_0_8px_#facc15]"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
