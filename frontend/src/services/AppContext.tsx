import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, translations, TranslationDict } from "./translations";

interface AppContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: TranslationDict;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" ? "light" : "dark";
  });

  // Language state
  const [language, setLanguageState] = useState<Locale>(() => {
    const saved = localStorage.getItem("language");
    return saved === "en" ? "en" : "es";
  });

  useEffect(() => {
    // Sync theme class to root html element
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
