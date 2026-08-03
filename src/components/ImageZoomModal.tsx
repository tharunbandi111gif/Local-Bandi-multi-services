import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Image Preview',
  subtitle = 'Click & Zoom Viewer • Local Bandi'
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoomLevel(prev => Math.min(prev + 0.25, 4));
      if (e.key === '-') setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
      if (e.key === '0') {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.35, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.35, 0.5));
  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 select-none overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Modal Header Bar */}
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    <ShieldCheck className="w-3 h-3" /> Verified Logo
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-700"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Stage */}
          <div 
            className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-950/50 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full p-4"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`
              }}
            >
              <img
                src={imageUrl}
                alt={title}
                className="max-w-[70vw] max-h-[60vh] object-contain rounded-2xl shadow-2xl pointer-events-none drop-shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', '/src/assets/images/local_bandi_logo_1785784124975.jpg');
                }}
              />
            </div>

            {/* Interactive Zoom Level HUD Indicator */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono text-[10px] font-black uppercase tracking-widest pointer-events-none">
              Zoom: {Math.round(zoomLevel * 100)}%
            </div>
          </div>

          {/* Control Toolbar */}
          <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4 text-amber-400" />
                <span>Zoom In</span>
              </button>

              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4 text-amber-400" />
                <span>Zoom Out</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>[+] Zoom In</span>
                <span>[-] Zoom Out</span>
                <span>[Esc] Close</span>
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
