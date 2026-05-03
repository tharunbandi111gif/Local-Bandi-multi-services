import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
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
        <div className="relative w-64 h-64 mb-8 mx-auto">
          <motion.img 
            src="/src/assets/images/lokal_bharath_logo_1777014931353.png"
            className="w-full h-full object-contain drop-shadow-2xl"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            alt="Lokal Bharath Logo"
          />
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
          Lokal Bharath
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900/40">Secure & Reliable</p>
      </motion.div>
    </div>
  );
}
