import React from 'react';
import { motion } from 'motion/react';
import { Hammer, Instagram, Facebook, Twitter, Phone, Mail, MessageCircle } from 'lucide-react';

export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-8 text-center overscroll-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs w-full"
      >
        <div className="w-32 h-32 bg-yellow-400 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-yellow-100 relative">
          <Hammer className="w-16 h-16 text-gray-900 animate-bounce" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-2 -right-2 bg-gray-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          >
            Upgrading
          </motion.div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-4 italic tracking-tighter leading-tight">
          Crafting Something<br />Special...
        </h1>
        
        <p className="text-gray-500 font-bold text-sm mb-10 leading-relaxed">
          Lokal Bharath is currently undergoing scheduled maintenance to bring you a better neighborhood experience.
        </p>

        <div className="space-y-6 w-full">
          <div className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Support Channels</p>
            <div className="flex justify-center gap-6">
              <a href="#" className="p-3 bg-white rounded-2xl shadow-sm text-gray-700 hover:text-indigo-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="p-3 bg-white rounded-2xl shadow-sm text-gray-700 hover:text-rose-500 transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <a href="#" className="p-3 bg-white rounded-2xl shadow-sm text-gray-700 hover:text-sky-500 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
            <Facebook className="w-5 h-5 text-gray-300 hover:text-blue-600 cursor-pointer transition-colors" />
            <Twitter className="w-5 h-5 text-gray-300 hover:text-sky-400 cursor-pointer transition-colors" />
            <Instagram className="w-5 h-5 text-gray-300 hover:text-pink-500 cursor-pointer transition-colors" />
          </div>
        </div>

        <p className="mt-12 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
          Powered by Lokal Bharath
        </p>
      </motion.div>
    </div>
  );
}
