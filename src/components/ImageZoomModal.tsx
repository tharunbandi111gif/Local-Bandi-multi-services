import React, { useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import { ZoomIn, ZoomOut, X, Maximize2 } from 'lucide-react';

interface ImageZoomProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

export default function ImageZoom({ 
  src, 
  alt = 'Image', 
  className = '', 
  containerClassName = '',
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle
}: ImageZoomProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [scale, setScale] = useState(1);

  // If used as standalone modal component
  const effectiveOpen = isOpen !== undefined ? isOpen : modalOpen;
  const effectiveSrc = imageUrl || src || '';
  const effectiveClose = () => {
    if (onClose) onClose();
    setModalOpen(false);
    setScale(1);
  };

  // If used as modal-only component without inline image
  if (isOpen !== undefined) {
    if (!isOpen || !effectiveSrc) return null;
    return (
      <div 
        className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
        onClick={effectiveClose}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setScale(s => Math.min(s + 0.5, 3));
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition shadow-lg cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setScale(s => Math.max(s - 0.5, 0.5));
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition shadow-lg cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              effectiveClose();
            }}
            className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow-lg cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div 
          className="overflow-auto max-w-full max-h-full flex flex-col items-center justify-center p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Zoom>
            <img
              src={effectiveSrc}
              alt={alt}
              style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl select-none"
            />
          </Zoom>
          {title && <h3 className="text-white text-base font-black italic mt-4">{title}</h3>}
          {subtitle && <p className="text-slate-400 text-xs mt-1 font-medium">{subtitle}</p>}
        </div>
        <p className="text-slate-400 text-xs mt-3 tracking-wide">
          Pinch or click image to zoom ({Math.round(scale * 100)}%) • Tap outside to exit
        </p>
      </div>
    );
  }

  return (
    <div className={`relative group ${containerClassName}`}>
      <Zoom>
        <img
          src={effectiveSrc}
          alt={alt}
          className={`cursor-pointer transition-transform duration-200 ${className}`}
        />
      </Zoom>
      
      {/* Zoom hint overlay button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        className="absolute top-2 right-2 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 text-xs flex items-center gap-1 backdrop-blur-sm cursor-pointer"
        title="Tap to view full screen"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {/* Full screen interactive modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={effectiveClose}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setScale(s => Math.min(s + 0.5, 3));
              }}
              className="p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                effectiveClose();
              }}
              className="p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="overflow-auto max-w-full max-h-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={effectiveSrc}
              alt={alt}
              style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
            />
          </div>
          <p className="text-slate-400 text-xs mt-3 tracking-wide">
            Tap image to toggle zoom scale ({Math.round(scale * 100)}%) • Tap outside to exit
          </p>
        </div>
      )}
    </div>
  );
}

export { ImageZoom as ImageZoomModal };
