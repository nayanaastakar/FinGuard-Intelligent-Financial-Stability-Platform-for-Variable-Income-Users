import { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import kn from '../locales/kn.json';

const LanguageContext = createContext();

const translations = {
  en: en,
  hi: hi,
  ta: ta,
  te: te,
  kn: kn
};

const languageNames = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ'
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to English
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', language);
  }, [language]);

  const translate = (key, vars = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    let fallbackValue = translations.en;
    
    for (let k of keys) {
      value = value?.[k];
      fallbackValue = fallbackValue?.[k];
    }

    let result = value ?? fallbackValue ?? key;
    if (typeof result !== 'string') return key;

    Object.entries(vars).forEach(([name, val]) => {
      result = result.replace(new RegExp(`{{${name}}}`, 'g'), String(val ?? ''));
    });

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
