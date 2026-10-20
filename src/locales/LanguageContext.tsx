"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { viTranslations, TranslationsType } from "./vi";
import { enTranslations } from "./en";
import { useAuth } from "@/lib/auth-context";
import { clearErpCache } from "@/lib/api-client";

export type SupportedLanguage = "vi" | "en";

export type TFunction = ((path: string, fallback?: string) => string) & TranslationsType;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TFunction;
  translations: TranslationsType;
}

const defaultT = Object.assign(
  (path: string, fallback?: string) => fallback || path,
  viTranslations
) as TFunction;

const LanguageContext = createContext<LanguageContextType>({
  language: "vi",
  setLanguage: () => {},
  t: defaultT,
  translations: viTranslations,
});

const STORAGE_KEY_LANG = "consims_lang";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserSession } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>("vi");

  // Đọc ngôn ngữ ban đầu từ user session hoặc localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_LANG) as SupportedLanguage | null;
      if (stored === "vi" || stored === "en") {
        setLanguageState(stored);
      } else if (user?.Language === "en" || user?.Language === "vi") {
        setLanguageState(user.Language);
      }
    }
  }, [user?.Language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_LANG, lang);
      } catch (_) {}
    }
    // Xóa cache API để tải lại dữ liệu theo đúng ngôn ngữ mới
    clearErpCache();
    // Đồng bộ session user nếu đã đăng nhập
    if (user) {
      updateUserSession({ Language: lang });
    }
  }, [user, updateUserSession]);

  const translations = useMemo(() => {
    return language === "en" ? enTranslations : viTranslations;
  }, [language]);

  const t = useMemo(() => {
    const fn = (path: string, fallback?: string): string => {
      const parts = path.split(".");
      let current: any = translations;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          return fallback !== undefined ? fallback : "";
        }
      }
      return typeof current === "string" ? current : fallback !== undefined ? fallback : "";
    };
    return Object.assign(fn, translations) as TFunction;
  }, [translations]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    translations,
  }), [language, setLanguage, t, translations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
