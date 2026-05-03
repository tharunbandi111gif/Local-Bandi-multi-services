import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, Category, Product, Service, CartItem, LanguageCode } from './types';
import Splash from './components/Splash';
import Login from './components/Login';
import LocationSelection from './components/LocationSelection';
import Home from './components/Home';
import CategoryListing from './components/CategoryListing';
import { referralService } from './lib/referral';
import ProductDetails from './components/ProductDetails';
import ServiceBooking from './components/ServiceBooking';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Payment from './components/Payment';
import OrderConfirmation from './components/OrderConfirmation';
import Notifications from './components/Notifications';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import TrackOrder from './components/TrackOrder';
import Onboarding from './components/Onboarding';
import MaintenanceScreen from './components/MaintenanceScreen';
import DeliveryDashboard from './components/DeliveryDashboard';
import VendorDashboard from './components/VendorDashboard';
import MarriageBureau from './components/MarriageBureau';
import CustomerCare from './components/CustomerCare';
import { PRODUCTS, SERVICES } from './constants';
import { VendorProfile } from './types';

import { useFirebase } from './contexts/FirebaseContext';

export default function App() {
  const { user, isAdmin: isFirebaseAdmin, loading, login } = useFirebase();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<Product | Service | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [location, setLocation] = useState(() => localStorage.getItem('lokal_user_location') || 'Select Location');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en-IN');

  useEffect(() => {
    // Auto-redirect if already logged in
    if (!loading && user && (currentScreen === 'login' || currentScreen === 'splash')) {
      if (location === 'Select Location') {
        navigateTo('location');
      } else {
        navigateTo('home');
      }
    }
  }, [user, loading, currentScreen, location]);

  useEffect(() => {
    // Automatic Location Detection
    if (location === 'Select Location' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            if (data && data.display_name) {
              const detectedLoc = data.display_name;
              setLocation(detectedLoc);
              localStorage.setItem('lokal_user_location', detectedLoc);
            }
          } catch (e) {
            console.error("Auto location error:", e);
          }
        },
        (err) => console.log("Geolocation permission denied or error:", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [location]);

  const handleLocationSelect = (newLoc: string) => {
    setLocation(newLoc);
    localStorage.setItem('lokal_user_location', newLoc);
    setCurrentScreen('home');
  };
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('lokal_maintenance_mode') === 'true');
  const [adminSessionActive, setAdminSessionActive] = useState(() => localStorage.getItem('admin_session_active') === 'true');
  const [showCustomerCare, setShowCustomerCare] = useState(false);
  const [activeVendorProfile, setActiveVendorProfile] = useState<VendorProfile | null>(null);
  const [supportInfo] = useState(() => {
    const saved = localStorage.getItem('supportInfo');
    return saved ? JSON.parse(saved) : { phone: '9876543210', email: 'localbharathkhammam@gmail.com' };
  });

  useEffect(() => {
    // Check for logged in vendor
    const vendors = JSON.parse(localStorage.getItem('approvedVendors') || '[]');
    if (vendors.length > 0) {
      setActiveVendorProfile(vendors[0]);
    }
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setIsMaintenanceMode(localStorage.getItem('lokal_maintenance_mode') === 'true');
      setAdminSessionActive(localStorage.getItem('admin_session_active') === 'true');
    };
    
    const handleOpenCare = () => setShowCustomerCare(true);

    window.addEventListener('maintenance_mode_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('open_customer_care', handleOpenCare);
    return () => {
      window.removeEventListener('maintenance_mode_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('open_customer_care', handleOpenCare);
    };
  }, []);

  useEffect(() => {
    // Add notification when maintenance mode status changes
    const addMaintenanceNotification = () => {
      const newNotif = {
        id: `maint-${Date.now()}`,
        title: isMaintenanceMode ? '🛠️ Maintenance Started' : '✅ System Online',
        message: isMaintenanceMode 
          ? 'Lokal Bharath is upgrading its infrastructure. New orders are paused temporarily.' 
          : 'Maintenance complete! You can now place orders for your favorite local items.',
        timestamp: Date.now(),
        read: false
      };
      const saved = localStorage.getItem('lokal_notifications');
      const current = saved ? JSON.parse(saved) : [];
      localStorage.setItem('lokal_notifications', JSON.stringify([newNotif, ...current]));
      window.dispatchEvent(new CustomEvent('notifications_updated'));
    };

    // Only skip on initial load if we want, but user asked for notifications when it toggles
    // We'll track previous state to avoid notification on first mount
    if (localStorage.getItem('lokal_prev_maintenance') !== null) {
      const prev = localStorage.getItem('lokal_prev_maintenance') === 'true';
      if (prev !== isMaintenanceMode) {
        addMaintenanceNotification();
      }
    }
    localStorage.setItem('lokal_prev_maintenance', isMaintenanceMode.toString());
  }, [isMaintenanceMode]);

  const [localInventory, setLocalInventory] = useState(() => {
    const saved = localStorage.getItem('localInventory');
    let items = [...PRODUCTS, ...SERVICES];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
      } catch (e) {
        console.error("Failed to parse inventory", e);
      }
    }
    // Deduplicate by ID to ensure unique keys in maps
    return Array.from(new Map(items.map(i => [i.id, i])).values());
  });

  useEffect(() => {
    referralService.initializeNewUser();
  }, []);

  useEffect(() => {
    localStorage.setItem('localInventory', JSON.stringify(localInventory));
  }, [localInventory]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    if (saved !== null) {
      setNotificationsEnabled(saved === 'true');
    }
  }, []);

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('notificationsEnabled', String(next));
      return next;
    });
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const navigateTo = (screen: Screen, orderId?: string) => {
    if (orderId) setSelectedOrderId(orderId);
    setCurrentScreen(screen);
  };

  const handleReorder = (orderId: string) => {
    // Find the order in history if possible
    let savedOrders = [];
    try {
      savedOrders = JSON.parse(localStorage.getItem('customer_orders') || '[]');
    } catch (e) {
      console.warn("Failed to parse customer orders during reorder", e);
    }
    const orderToRepeat = savedOrders.find((o: any) => o.id === orderId);
    
    if (orderToRepeat && orderToRepeat.orderItems) {
      orderToRepeat.orderItems.forEach((item: CartItem) => {
        // Try to find the item in local inventory to get latest data
        const currentItem = localInventory.find(i => i.id === item.id);
        if (currentItem) {
          addToCart(currentItem as Product, item.quantity);
        } else {
          addToCart(item as Product, item.quantity);
        }
      });
    } else {
      // Fallback
      const productsToReorder = localInventory.slice(0, 2);
      productsToReorder.forEach(p => addToCart(p as Product, 1));
    }
    navigateTo('cart');
  };

  const completeOrder = () => {
    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const tax = Math.round(subtotal * 0.05);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const finalTotal = subtotal + tax + deliveryFee;

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: orderId,
      status: 'Processing',
      date: new Date().toISOString(),
      displayDate: 'Just now',
      total: finalTotal,
      items: cart.reduce((acc, i) => acc + i.quantity, 0),
      orderItems: [...cart] // Save the actual items
    };

    let existingOrders = [];
    try {
      existingOrders = JSON.parse(localStorage.getItem('customer_orders') || '[]');
    } catch (e) {
      console.warn("Failed to parse customer orders during save", e);
    }
    localStorage.setItem('customer_orders', JSON.stringify([newOrder, ...existingOrders]));
    
    // Also update active orders for admin view (simulated sync)
    let activeOrders = [];
    try {
      activeOrders = JSON.parse(localStorage.getItem('activeOrders') || '[]');
    } catch (e) {
      console.warn("Failed to parse active orders during save", e);
    }
    const activeOrderRecord = {
      id: orderId,
      customerName: 'Bharat Kumar', // Hardcoded logged in user for demo
      items: newOrder.items,
      total: newOrder.total,
      status: 'Pending',
      vendorId: cart[0]?.id || 'v1',
      deliveryPartnerId: null,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('activeOrders', JSON.stringify([activeOrderRecord, ...activeOrders]));
    setSelectedOrderId(orderId);
    navigateTo('confirmation');
  };

  const viewCategory = (category: Category) => {
    setSelectedCategory(category);
    navigateTo('category');
  };

  const viewItem = (item: Product | Service) => {
    setSelectedItem(item);
    if (['services', 'emergency', 'travel', 'marriage', 'events'].includes(item.category)) {
      navigateTo('service');
    } else {
      navigateTo('product');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <Splash onFinish={() => {
          const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
          if (hasSeenOnboarding) {
            navigateTo('login');
          } else {
            navigateTo('onboarding');
          }
        }} />;
      case 'onboarding':
        return <Onboarding 
          onComplete={() => {
            localStorage.setItem('hasSeenOnboarding', 'true');
            navigateTo('login');
          }} 
          onLocationSelect={() => {
            localStorage.setItem('hasSeenOnboarding', 'true');
            navigateTo('location');
          }}
        />;
      case 'login':
        return <Login onLogin={() => navigateTo('location')} />;
      case 'location':
        return <LocationSelection 
          onSelect={handleLocationSelect} 
        />;
      case 'home':
        return <Home 
          location={location}
          language={selectedLanguage}
          onCategoryClick={viewCategory}
          onProductClick={viewItem}
          cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
          wishlistCount={wishlist.length}
          onNavigate={(s) => navigateTo(s)}
          user={user}
          isAdmin={isFirebaseAdmin}
          onAdminAuth={() => {}}
          localInventory={localInventory}
          setLocalInventory={setLocalInventory}
        />;
      case 'category':
        return <CategoryListing 
          category={selectedCategory!}
          language={selectedLanguage}
          onBack={() => navigateTo('home')}
          onProductClick={viewItem}
          isAdmin={isFirebaseAdmin}
          localInventory={localInventory}
        />;
      case 'product':
        return <ProductDetails 
          product={selectedItem as Product}
          onBack={() => navigateTo('category')}
          isInWishlist={wishlist.includes(selectedItem?.id || '')}
          onToggleWishlist={toggleWishlist}
          onAddToCart={(p, q) => {
            addToCart(p, q);
            navigateTo('cart');
          }}
        />;
      case 'wishlist':
        return <Wishlist 
          wishlistIds={wishlist}
          language={selectedLanguage}
          onBack={() => navigateTo('home')}
          onProductClick={viewItem}
          onRemove={toggleWishlist}
        />;
      case 'service':
        return <ServiceBooking 
          service={selectedItem as Service}
          onBack={() => navigateTo('category')}
          onBook={() => navigateTo('cart')}
        />;
      case 'cart':
        return <Cart 
          items={cart}
          language={selectedLanguage}
          onBack={() => navigateTo('home')}
          onUpdateQty={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={() => navigateTo('payment')}
        />;
      case 'profile':
        return <Profile 
          onBack={() => navigateTo('home')}
          onNavigate={(s) => navigateTo(s as Screen)}
          language={selectedLanguage}
        />;
      case 'settings':
        return <Settings 
          onBack={() => navigateTo('profile')}
          onLogout={() => navigateTo('login')}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={toggleNotifications}
          onNavigate={(s) => navigateTo(s as Screen)}
        />;
      case 'orders':
        return <Orders 
          onBack={() => navigateTo('profile')}
          onReorder={handleReorder}
          onTrackOrder={(id) => navigateTo('tracking', id)}
          language={selectedLanguage}
        />;
      case 'tracking':
        return <TrackOrder 
          orderId={selectedOrderId || 'ORD-9021'} 
          onBack={() => navigateTo('orders')}
          language={selectedLanguage}
        />;
      case 'notifications':
        return <Notifications onBack={() => navigateTo('profile')} />;
      case 'privacy':
        return <PrivacyPolicy onBack={() => navigateTo('settings')} language={selectedLanguage} />;
      case 'terms':
        return <TermsOfService onBack={() => navigateTo('settings')} language={selectedLanguage} />;
      case 'payment':
        return <Payment 
          onBack={() => navigateTo('cart')}
          onComplete={completeOrder}
        />;
      case 'confirmation':
        return <OrderConfirmation 
          items={cart}
          orderId={selectedOrderId || 'NEW-ORDER'}
          onHome={() => {
            setCart([]);
            navigateTo('home');
          }}
        />;
      case 'delivery':
        return <DeliveryDashboard onBack={() => navigateTo('profile')} />;
      case 'vendor':
        return activeVendorProfile ? (
          <VendorDashboard profileId={activeVendorProfile.id} onBack={() => navigateTo('profile')} />
        ) : (
          <Home 
            location={location}
            language={selectedLanguage}
            onCategoryClick={viewCategory}
            onProductClick={viewItem}
            cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
            wishlistCount={wishlist.length}
            onNavigate={(s) => navigateTo(s)}
            user={user}
            isAdmin={isFirebaseAdmin}
            onAdminAuth={() => {}}
            localInventory={localInventory}
            setLocalInventory={setLocalInventory}
          />
        );
      case 'marriageBureau':
        return <MarriageBureau 
          onBack={() => navigateTo('home')} 
          language={selectedLanguage} 
          isAdmin={isFirebaseAdmin}
        />;
      default:
        return <Splash onFinish={() => navigateTo('login')} />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto h-screen bg-slate-900 flex items-center justify-center p-8 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-black mb-2 tracking-tight">Initializing Lokal Bharath</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Connecting to secured servers...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 overflow-hidden relative shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      {(isMaintenanceMode && !adminSessionActive && !isFirebaseAdmin) && <MaintenanceScreen />}
      <CustomerCare 
        isOpen={showCustomerCare} 
        onClose={() => setShowCustomerCare(false)} 
        supportPhone={supportInfo.phone}
      />
    </div>
  );
}
