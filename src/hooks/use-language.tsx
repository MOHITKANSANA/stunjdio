
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import kn from '@/locales/kn.json';
import ml from '@/locales/ml.json';
import ta from '@/locales/ta.json';
import te from '@/locales/te.json';
import bn from '@/locales/bn.json';
import gu from '@/locales/gu.json';
import mr from '@/locales/mr.json';
import pa from '@/locales/pa.json';
import or from '@/locales/or.json';

const translations: Record<string, Record<string, string>> = { en, hi, kn, ml, ta, te, bn, gu, mr, pa, or };

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (translations[lang]) {
      localStorage.setItem('language', lang);
      setLanguageState(lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  const value = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
