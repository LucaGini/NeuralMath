import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../services/AppContext";
import { BookOpen, LogOut, Sun, Moon, Globe } from "lucide-react";

interface NavbarProps {
  showBack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, toggleTheme, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  // Helper to determine active state of navigation links
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="sticky top-4 z-40 px-4 md:px-6 w-full max-w-7xl mx-auto">
      <nav className="glass bg-[#0e1424]/85 shadow-2xl rounded-2xl border border-cyberCyan/25 px-5 py-3.5 flex justify-between items-center transition-all duration-300 hover:shadow-cyan-950/20 hover:border-cyberCyan/40">
        
        {/* Brand Logo & Title with corner brackets */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer select-none group"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-10 h-10 bg-[#070b13] border border-cyberCyan/30 tech-brackets flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-cyberCyan/80">
            <BookOpen className="w-5 h-5 text-cyberCyan" />
          </div>
          <div>
            <span className="text-xl font-display font-black tracking-tight text-white group-hover:text-cyberCyan transition-colors">
              NeuralMath
            </span>
            <span className="text-[9px] text-cyberCyan/70 font-cyber uppercase tracking-widest block font-bold mt-0.5">
              {language === "es" ? "LABORATORIO MATEMÁTICO" : "MATH TELEMETRY LAB"}
            </span>
          </div>
        </div>

        {/* Navigation Links inside a telemetry container */}
        {token && (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#070b13]/80 p-1 rounded-xl border border-cyberCyan/15">
            <button
              onClick={() => navigate("/dashboard")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-cyber font-bold uppercase tracking-wider transition-all duration-200
                ${isActive("/dashboard")
                  ? "bg-cyberCyan/10 text-cyberCyan border border-cyberCyan/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                  : "text-slate-400 hover:text-cyberCyan hover:bg-slate-900/50 border border-transparent"
                }
              `}
            >
              {language === "es" ? "Panel" : "Dashboard"}
            </button>
            <button
              onClick={() => navigate("/topics")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-cyber font-bold uppercase tracking-wider transition-all duration-200
                ${isActive("/topics") || location.pathname.startsWith("/session")
                  ? "bg-cyberCyan/10 text-cyberCyan border border-cyberCyan/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                  : "text-slate-400 hover:text-cyberCyan hover:bg-slate-900/50 border border-transparent"
                }
              `}
            >
              {language === "es" ? "Temas" : "Topics"}
            </button>
            <button
              onClick={() => navigate("/progress")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-cyber font-bold uppercase tracking-wider transition-all duration-200
                ${isActive("/progress")
                  ? "bg-cyberCyan/10 text-cyberCyan border border-cyberCyan/30 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                  : "text-slate-400 hover:text-cyberCyan hover:bg-slate-900/50 border border-transparent"
                }
              `}
            >
              {t.progress}
            </button>
          </div>
        )}

        {/* Widgets & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-cyberCyan hover:text-cyberCyan bg-[#070b13] border border-cyberCyan/20 hover:border-cyberCyan/40 hover:bg-[#0e1424] transition-all duration-200 text-xs font-cyber font-bold tracking-wider"
            title="Cambiar idioma / Change language"
          >
            <Globe className="w-4 h-4 text-cyberCyan animate-pulse" />
            <span>{language === "es" ? "ES" : "EN"}</span>
          </button>

          {/* Theme Selector (Restyled for retro terminal) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#070b13] text-cyberCyan border border-cyberCyan/20 hover:border-cyberCyan/40 hover:bg-[#0e1424] transition-all duration-200"
            title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-cyberAmber animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-[#ff00e5]" />
            )}
          </button>

          {/* Logout button */}
          {token && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/20 text-red-400 border border-red-500/25 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-200 text-xs font-cyber font-bold uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">{t.logout}</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
