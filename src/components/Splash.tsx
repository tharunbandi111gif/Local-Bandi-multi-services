import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <div className="relative w-56 h-56 mb-8 mx-auto scale-110">
          <div className="absolute inset-0 bg-white rounded-full shadow-2xl shadow-yellow-200 flex items-center justify-center border-8 border-white overflow-hidden">
             <img src="/src/assets/images/local_bandi_logo_1785784124975.jpg" className="w-full h-full object-cover" alt="Local Bandi Logo" />
          </div>
          
          {/* Decorative Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 border-4 border-emerald-600/10 rounded-full" 
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 border-2 border-dashed border-emerald-600/5 rounded-full" 
          />
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">
          Local Bandi Multi Services
        </h1>
        <p className="text-gray-800 font-medium tracking-wide">
          For All Your Local Needs
        </p>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-20 w-48 h-1 bg-white/20 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
        />
      </motion.div>
      
      <motion.div 
        className="absolute bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-gray-900/40">Secure & Reliable</p>
      </motion.div>
    </div>
  );
}
