import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, translations, TranslationDict } from "./translations";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalState {
  isOpen: boolean;
  type: "alert" | "confirm";
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AppContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: TranslationDict;
  showAlert: (message: string, onConfirm?: () => void) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
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

  // Global Dialog Modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
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

  const showAlert = (message: string, onConfirm?: () => void) => {
    setModal({
      isOpen: true,
      type: "alert",
      message,
      onConfirm,
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModal({
      isOpen: true,
      type: "confirm",
      message,
      onConfirm,
      onCancel,
    });
  };

  const handleCloseModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    handleCloseModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) modal.onCancel();
    handleCloseModal();
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, t, showAlert, showConfirm }}>
      {children}

      {/* Global Glassmorphic Modal Dialog */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-[3px] transition-all">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-white/90 dark:bg-[#0c1220]/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative transition-colors duration-200 overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-mathPurple-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                {/* Floating academic-style warning bubble */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                  modal.type === "confirm"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 animate-pulse"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-450 animate-bounce"
                }`}>
                  {modal.type === "confirm" ? (
                    <HelpCircle className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <h4 className="font-extrabold text-slate-850 dark:text-white text-base">
                    {modal.type === "confirm"
                      ? (language === "es" ? "Confirmar Acción" : "Confirm Action")
                      : (language === "es" ? "Aviso del Sistema" : "System Alert")}
                  </h4>
                  <p className="text-slate-650 dark:text-slate-350 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {modal.message}
                  </p>
                </div>

                {/* Button actions */}
                <div className="flex items-center gap-3 w-full pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  {modal.type === "confirm" && (
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-all"
                    >
                      {language === "es" ? "Cancelar" : "Cancel"}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-mathPurple-600/10"
                  >
                    {language === "es" ? "Aceptar" : "Accept"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
