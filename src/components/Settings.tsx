import React, { useState } from 'react';
import { ArrowLeft, Globe, Moon, Bell, HelpCircle, MessageSquare, Info, ChevronRight, Languages, Shield, LogOut, Send, X, ShieldCheck, Sun, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { LanguageCode } from '../types';
import { LANGUAGES } from '../constants';
import { translations } from '../translations';
import LanguageSettings from './common/LanguageSettings';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  selectedLanguage: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onNavigate: (screen: any) => void;
}

import { useTheme } from '../contexts/ThemeContext';
import { useFirebase } from '../contexts/FirebaseContext';

export default function Settings({ 
  onBack, 
  onLogout, 
  selectedLanguage, 
  onLanguageChange,
  notificationsEnabled,
  onToggleNotifications,
  onNavigate
}: SettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const { deactivateAccount } = useFirebase();
  const t = translations[selectedLanguage].settings;
  const common = translations[selectedLanguage].common;
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleConfirmDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateAccount();
      onLogout();
    } catch (err) {
      console.error("Deactivation failed:", err);
    } finally {
      setIsDeactivating(false);
      setShowDeactivate(false);
    }
  };

  const sections = [
    {
      title: t.preferences,
      items: [
        { 
          icon: Languages, 
          label: t.appLanguage, 
          sub: LANGUAGES.find(l => l.code === selectedLanguage)?.label || 'English', 
          type: 'link',
          action: () => setShowLanguages(true)
        },
        { icon: Globe, label: t.locationServices, sub: 'Local availability tracking', type: 'toggle', value: true },
      ]
    },
    {
      title: t.securityPrivacy,
      items: [
        { 
          icon: Bell, 
          label: t.pushNotifications, 
          sub: 'Order tracking & Offers',
          type: 'toggle', 
          value: notificationsEnabled,
          action: onToggleNotifications
        },
        { icon: Shield, label: t.privacyPolicy, sub: 'Data protection standards', type: 'link', action: () => onNavigate('privacy') },
        { icon: Info, label: t.termsOfService, sub: 'Usage legal agreements', type: 'link', action: () => onNavigate('terms') },
      ]
    },
    {
      title: 'Support & Interaction',
      items: [
        { icon: MessageSquare, label: 'Send Feedback', sub: 'We value your input', type: 'link', action: () => setShowFeedback(true) },
        { icon: HelpCircle, label: 'Payment Issues & FAQ', sub: 'Instant support guides', type: 'link', action: () => setShowFAQ(true) },
        { icon: Info, label: 'About Local Bandi Multi Services', sub: 'Our mission & story', type: 'link', action: () => setShowAbout(true) },
      ]
    },
    {
      title: 'Danger Zone',
      items: [
        { 
          icon: LogOut, 
          label: 'Deactivate Account', 
          sub: 'Permanent deletion', 
          type: 'link', 
          danger: true,
          action: () => setShowDeactivate(true)
        },
      ]
    }
  ];

  const faqs = [
    {
      q: "Can I cancel my order? How do I get refund?",
      a: "Yes, orders can be cancelled before they enter preparation. Refund timelines depend on your payment method: UPI refunds occur within a few hours or up to 1 day. Bank card refunds are initiated immediately but take between 3 and 10 business days to reflect in your card statement based on banking policies."
    },
    {
      q: "How long do UPI refunds take?",
      a: "UPI payment refunds (via Google Pay, PhonePe, Paytm, BHIM, etc.) are processed extremely fast and will appear back in your banking source within a few hours or up to a day."
    },
    {
      q: "How long do Credit/Debit card refunds take?",
      a: "While our system initiates card refunds immediately upon order cancellation, processing through visa/mastercard gateway networks and your card issuing bank typically takes 3 to 10 business days."
    },
    {
      q: "My payment failed but money was deducted.",
      a: "Don't worry! If a payment fails, your bank usually reverses the amount within 3-5 business days. You can also contact us with the transaction ID."
    },
    {
      q: "Which payment methods are accepted?",
      a: "We accept UPI (Google Pay, PhonePe, Paytm), Debit/Credit cards, and Net Banking. Cash on Delivery is available for selected services."
    },
    {
      q: "Is it safe to pay on Local Bandi Multi Services?",
      a: "Yes, we use 256-bit encryption and partner with top Indian payment gateways to ensure your data is 100% secure."
    }
  ];

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFeedback('');
      setContact('');
      setTimeout(() => {
        setSubmitted(false);
        setShowFeedback(false);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 flex flex-col relative text-gray-900 dark:text-white font-sans transition-colors">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-50 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </motion.button>
        <h2 className="text-xl font-black text-gray-900 dark:text-white font-display italic tracking-tight">{t.title}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-10 space-y-10">
        {sections.map((section, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 mb-5 px-3">{section.title}</h3>
            <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
              {section.items.map((item, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 1)' : 'rgba(249, 250, 251, 1)' }}
                  onClick={item.action}
                  className={`w-full flex items-center gap-5 p-5 text-left transition-all ${i !== section.items.length - 1 ? 'border-b border-white dark:border-slate-800' : ''} group`}
                >
                  <div className={`p-4 rounded-2xl shadow-sm transition-all group-hover:scale-105 ${item.danger ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 group-hover:shadow-md'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`font-black text-sm tracking-tight ${item.danger ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>{item.label}</p>
                    {item.sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight mt-1">{item.sub}</p>}
                  </div>
                  {item.type === 'toggle' ? (
                    <div className={`w-12 h-6 rounded-full p-1 transition-all flex-shrink-0 relative ${item.value ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all absolute top-1 ${item.value ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  ) : (
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-all ${item.danger ? 'text-rose-300' : 'text-gray-300 dark:text-gray-600'}`} />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        <div className="pt-6">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-4 p-6 bg-rose-50 dark:bg-rose-500/10 rounded-[2.5rem] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[10px] active:bg-rose-100 dark:active:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/20 shadow-xl shadow-rose-100 dark:shadow-none"
          >
            <LogOut className="w-5 h-5" />
            Sign Out Securely
          </motion.button>
        </div>

        <div className="text-center py-10 opacity-40">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">App Version 2.4.1 (Stable)<br/>© 2026 Local Bandi Multi Services Tech</p>
        </div>
      </div>

      {/* About Modal Overlay */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl safe-bottom mb-4 sm:mb-0"
            >
              <div className="relative h-40 bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="p-3 bg-yellow-400 rounded-2xl mb-3 relative z-10">
                  <ShieldCheck className="w-8 h-8 text-gray-900" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest relative z-10">Our Intention</h2>
                <button 
                  onClick={() => setShowAbout(false)}
                  className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-800 leading-relaxed">
                    At <span className="text-yellow-600 font-black italic">Local Bandi Multi Services</span>, our mission is to provide pure and healthy services to our community without any cheating or compromise.
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    We treat every service like we're working for our own family. Whether it's complex construction, professional painting, AC/cooler repairs, or bore motor mechanics—we deliver excellence with honesty.
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Customer satisfaction is our northern star. We guarantee on-time delivery and high-quality results for all your local needs, including full maid and cleaning services.
                  </p>
                </div>

                <button 
                  onClick={() => setShowAbout(false)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl shadow-gray-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal Overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900">Send Feedback</h3>
                <button 
                  onClick={() => setShowFeedback(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitted ? (
                <div className="py-12 text-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">Thank You!</h4>
                  <p className="text-gray-500 font-bold">Your feedback matters to us.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                      Your Message
                    </label>
                    <textarea 
                      required
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell us what you love or what we can improve..."
                      className="w-full h-40 bg-gray-50 rounded-[2rem] p-6 text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 border-transparent focus:border-yellow-400 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                      Contact Info (Optional)
                    </label>
                    <input 
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Email or Phone Number"
                      className="w-full bg-gray-50 rounded-2xl p-5 text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 border-transparent focus:border-yellow-400 transition-all"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Selection Modal */}
      <LanguageSettings
        isOpen={showLanguages}
        onClose={() => setShowLanguages(false)}
        title="Select App Language"
        onSelect={(code) => {
          onLanguageChange(code);
        }}
      />

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFAQ && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">Payment Help</h3>
                <button 
                  onClick={() => setShowFAQ(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {faqs.map((faq, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-sm font-black text-gray-900 leading-tight">Q: {faq.q}</h4>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-2xl">{faq.a}</p>
                  </div>
                ))}
                
                <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 mt-4">
                  <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest mb-2 italic">Still need help?</p>
                  <button 
                    onClick={() => {
                      setShowFAQ(false);
                      setShowFeedback(true);
                    }}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gray-200"
                  >
                    Contact Live Support
                  </button>
                </div>
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => setShowFAQ(false)}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Deactivation Confirmation Modal */}
      <AnimatePresence>
        {showDeactivate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col p-8 space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Deactivate Account?</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Immediate Effect • Permanent Action</p>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Deactivating your account will instantly remove your personal profile from our databases, end your active sessions, cancel any pending partner registrations, and remove your wallet balance.
              </p>

              <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider text-center">
                This action cannot be undone.
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={handleConfirmDeactivate}
                  disabled={isDeactivating}
                  className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isDeactivating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Deactivate Instantly"
                  )}
                </button>
                <button 
                  onClick={() => setShowDeactivate(false)}
                  disabled={isDeactivating}
                  className="w-full py-5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel & Keep Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
