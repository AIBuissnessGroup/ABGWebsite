'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { SupportedLanguage, t, TranslationKey, SUPPORTED_LANGUAGES, getLanguageName, getNativeLanguageName } from '@/lib/fluentlyTranslations';

interface FluentlyLanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string;
  languageName: string;
  nativeLanguageName: string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const FluentlyLanguageContext = createContext<FluentlyLanguageContextType | undefined>(undefined);

interface FluentlyLanguageProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
}

export function FluentlyLanguageProvider({ 
  children, 
  initialLanguage = 'en' 
}: FluentlyLanguageProviderProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return t(key, language, params);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      translate,
      languageName: getLanguageName(language),
      nativeLanguageName: getNativeLanguageName(language),
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, translate]
  );

  return (
    <FluentlyLanguageContext.Provider value={value}>
      {children}
    </FluentlyLanguageContext.Provider>
  );
}

export function useFluentlyLanguage(): FluentlyLanguageContextType {
  const context = useContext(FluentlyLanguageContext);
  if (context === undefined) {
    throw new Error('useFluentlyLanguage must be used within a FluentlyLanguageProvider');
  }
  return context;
}

export { FluentlyLanguageContext };
