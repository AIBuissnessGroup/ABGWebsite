'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/fluentlyTranslations';

interface LanguageSelectorProps {
  onSelect: (languageCode: SupportedLanguage) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ onSelect, disabled = false }: LanguageSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {SUPPORTED_LANGUAGES.map((lang, index) => (
        <motion.button
          key={lang.code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => !disabled && onSelect(lang.code)}
          disabled={disabled}
          className={`
            px-6 py-3 rounded-xl font-semibold text-white
            bg-blue-600 hover:bg-blue-700 
            disabled:bg-slate-700 disabled:cursor-not-allowed
            transition-all duration-200 transform hover:scale-105
            border border-blue-500/30 shadow-lg
          `}
        >
          <span className="block text-lg">{lang.nativeName}</span>
          {lang.nativeName !== lang.name && (
            <span className="block text-sm text-blue-200 mt-0.5">{lang.name}</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
