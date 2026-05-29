import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../services/AppContext";
import { LogOut, Sun, Moon, Globe } from "lucide-react";

interface NavbarProps {
  showBack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, toggleTheme, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0c1220]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center transition-colors duration-200">
      {/* Brand Logo & Title */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-0.5 shadow-md shadow-mathPurple-500/10 border border-slate-200/50 overflow-hidden hover:scale-105 transition-transform duration-200">
          <img 
            src="/logo.png" 
            alt="NeuralMath Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white block">
            NeuralMath
          </span>
          <span className="text-[10px] text-mathPurple-500 dark:text-mathPurple-400 uppercase tracking-widest font-semibold block">
            {t.dashboard}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      {token && (
        <div className="hidden sm:flex items-center gap-1 bg-slate-150/40 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 transition-colors">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400 hover:text-mathPurple-600 dark:hover:text-mathPurple-400 hover:bg-slate-50 dark:hover:bg-[#0c1220] transition-all"
          >
            {language === "es" ? "Panel" : "Dashboard"}
          </button>
          <button
            onClick={() => navigate("/topics")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400 hover:text-mathPurple-600 dark:hover:text-mathPurple-400 hover:bg-slate-50 dark:hover:bg-[#0c1220] transition-all"
          >
            {language === "es" ? "Temas" : "Topics"}
          </button>
          <button
            onClick={() => navigate("/progress")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400 hover:text-mathPurple-600 dark:hover:text-mathPurple-400 hover:bg-slate-50 dark:hover:bg-[#0c1220] transition-all"
          >
            {t.progress}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400 hover:text-mathPurple-600 dark:hover:text-mathPurple-400 hover:bg-slate-50 dark:hover:bg-[#0c1220] transition-all"
          >
            {language === "es" ? "Perfil" : "Profile"}
          </button>
        </div>
      )}

      {/* Widgets & Controls */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 transition-all text-xs font-semibold"
          title="Cambiar idioma / Change language"
        >
          <Globe className="w-4 h-4 text-mathPurple-500" />
          <span>{language === "es" ? "ES" : "EN"}</span>
        </button>

        {/* Theme Selector */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 transition-all"
          title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
        >
          {theme === "dark" ? (
            <Sun className="w-4.5 h-4.5 text-amber-500" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-indigo-500" />
          )}
        </button>

        {/* Logout button */}
        {token && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-slate-800/80 hover:border-red-200 dark:hover:border-red-500/20 transition-all text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">{t.logout}</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
