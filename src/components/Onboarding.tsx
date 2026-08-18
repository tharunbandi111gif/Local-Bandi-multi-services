import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  UserCheck, 
  Briefcase, 
  ChevronRight, 
  MapPin, 
  ShieldCheck,
  Check
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onLocationSelect: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: 'Pure Local Delivery',
    description: 'Get Buffalo Milk, Mineral Water, and Organic Veggies direct from local farms to your home.',
    icon: ShoppingBag,
    color: 'bg-blue-600',
    img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E'
  },
  {
    id: 2,
    title: 'Trusted Local Services',
    description: 'Expert Maids, Cooks, Electricians, and Mechanics verified by the Founder for your safety.',
    icon: UserCheck,
    color: 'bg-emerald-600',
    img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E'
  },
  {
    id: 3,
    title: 'Marriage & Jobs',
    description: 'Find your soulmate in our free Bureau and discover local job opportunities in your town.',
    icon: Briefcase,
    color: 'bg-indigo-600',
    img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E'
  }
];

export default function Onboarding({ onComplete, onLocationSelect }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLocationStep, setShowLocationStep] = useState(false);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowLocationStep(true);
    }
  };

  const skip = () => {
    setShowLocationStep(true);
  };

  if (showLocationStep) {
    return (
      <div className="h-full bg-white flex flex-col p-8 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-yellow-100">
            <MapPin className="w-10 h-10 text-gray-900" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight italic">One Last Step!</h2>
          <p className="text-gray-500 font-bold mb-12 italic">Set your location to find verified partners near you in Bharat.</p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={onLocationSelect}
              className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Select Your Location
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onComplete}
              className="w-full py-5 bg-white text-gray-400 rounded-[2rem] font-black uppercase tracking-widest border-2 border-gray-50 active:scale-95 transition-all"
            >
              Do it Later
            </button>
          </div>
          
          <div className="mt-auto flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">100% Purity & Trust Guaranteed</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const slide = SLIDES[currentSlide];

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            {slide.img && <img src={slide.img} className="w-full h-full object-cover" alt="onboarding" />}
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-12 left-0 right-0 px-8 z-20 flex justify-between items-center">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} 
              />
            ))}
          </div>
          <button 
            onClick={skip}
            className="text-white font-black text-[10px] uppercase tracking-widest bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl"
          >
            Skip
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
          <motion.div
            key={`content-${slide.id}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`w-12 h-12 ${slide.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/20`}>
              <slide.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight italic">{slide.title}</h2>
            <p className="text-white/70 font-bold text-sm leading-relaxed mb-10 italic">
              {slide.description}
            </p>

            <button 
              onClick={nextSlide}
              className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-yellow-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next Step'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
