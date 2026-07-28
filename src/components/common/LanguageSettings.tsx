import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Search, Check, Sparkles, X } from 'lucide-react';
import { LanguageCode } from '../../types';
import { useTranslation } from '../../i18n';

interface LanguageSettingsProps {
  variant?: 'inline' | 'modal' | 'dropdown';
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  className?: string;
  onSelect?: (code: LanguageCode) => void;
}

export default function LanguageSettings({
  variant = 'modal',
  isOpen = true,
  onClose,
  title = 'Select Preferred Language',
  className = '',
  onSelect
}: LanguageSettingsProps) {
  const { language: currentLanguage, setLanguage, languages, t } = useTranslation();
  const [search, setSearch] = useState('');

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    if (onSelect) onSelect(code);
    if (onClose) onClose();
  };

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.label.toLowerCase().includes(search.toLowerCase()) ||
      lang.native.toLowerCase().includes(search.toLowerCase()) ||
      lang.code.toLowerCase().includes(search.toLowerCase())
  );

  const activeLang = languages.find(l => l.code === currentLanguage);

  if (variant === 'inline') {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{t('selectLanguage', 'App Language')}</h3>
              <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {activeLang ? `${activeLang.label} (${activeLang.native})` : '24 Indian Languages'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-yellow-400 text-yellow-950 font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm">
            24 Languages
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language (e.g. Hindi, తెలుగు, தமிழ்)..."
            className="w-full bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-yellow-400 transition-all placeholder:font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Grid of 24 Languages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {filteredLanguages.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-yellow-400/15 border-yellow-400 text-yellow-900 dark:text-yellow-300 font-black shadow-sm'
                    : 'bg-gray-50/50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-bold'
                }`}
              >
                <div className="truncate">
                  <div className="text-xs truncate">{lang.native}</div>
                  <div className="text-[9px] text-gray-500 dark:text-slate-400 font-medium truncate">{lang.label}</div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-amber-50/30 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
                <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  24 Indian Languages Supported
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search language (e.g. Hindi, తెలుగు, தமிழ்)..."
                className="w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs font-bold pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-yellow-400 dark:focus:border-yellow-400 transition-all placeholder:font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2">
            {filteredLanguages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-xs font-bold">
                No matching language found for &quot;{search}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredLanguages.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-400/15 border-yellow-400 text-yellow-950 dark:text-yellow-300 font-black shadow-sm'
                          : 'bg-gray-50/50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-bold'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                          <span>{lang.native}</span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-400 text-yellow-950 text-[9px] font-black uppercase tracking-wider">
                              <Sparkles className="w-2.5 h-2.5" /> Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate">{lang.label}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
