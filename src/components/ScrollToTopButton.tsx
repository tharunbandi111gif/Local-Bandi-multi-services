import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScrollToTopButtonProps {
  targetRef?: React.RefObject<HTMLElement>;
  threshold?: number;
  className?: string;
  bottomOffset?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  targetRef,
  threshold = 250,
  className = '',
  bottomOffset = 'bottom-20'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      let currentScroll = 0;
      if (targetRef && targetRef.current) {
        currentScroll = targetRef.current.scrollTop;
      } else {
        currentScroll = window.scrollY || document.documentElement.scrollTop;
      }

      setIsVisible(currentScroll > threshold);
    };

    const targetEl = targetRef ? targetRef.current : null;

    if (targetEl) {
      targetEl.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Initial check
    handleScroll();

    return () => {
      if (targetEl) {
        targetEl.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [targetRef, threshold]);

  const scrollToTop = () => {
    if (targetRef && targetRef.current) {
      targetRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.5, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 15 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className={`fixed right-4 sm:right-6 ${bottomOffset} z-40 w-11 h-11 rounded-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 shadow-xl shadow-gray-900/15 border-2 border-white flex items-center justify-center cursor-pointer transition-colors group ${className}`}
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5px] group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
