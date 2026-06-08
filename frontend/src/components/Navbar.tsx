import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../services/AppContext";
import { LogOut, Sun, Moon, Globe } from "lucide-react";
import api from "../services/api";

interface NavbarProps {
  showBack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { theme, toggleTheme, language, setLanguage, t } = useApp();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (token) {
      api.get("/auth/me")
        .then((res) => {
          setIsAdmin(res.data.is_admin);
        })
        .catch((err) => {
          console.error("Error checking admin status:", err);
        });
    } else {
      setIsAdmin(false);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  return (
    <nav className="border-b border-paper-200 dark:border-paper-800/60 bg-white/80 dark:bg-paper-950/95 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center transition-colors duration-200">
      {/* Brand Logo & Title */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-0.5 shadow-md shadow-primary-500/10 border border-paper-200/50 overflow-hidden hover:scale-105 transition-transform duration-200">
          <img 
            src="/logo.png" 
            alt="NeuralMath Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black tracking-tight text-paper-800 dark:text-white block">
              NeuralMath
            </span>
            <span className="text-[9px] text-paper-400 dark:text-paper-500 font-semibold italic block select-none">
              by Ing. Luca Gini
            </span>
          </div>
          <span className="text-[10px] text-primary-500 dark:text-primary-400 uppercase tracking-widest font-semibold block">
            {t.dashboard}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      {token && (
        <div className="hidden sm:flex items-center gap-1 bg-paper-100/40 dark:bg-paper-900/60 p-1.5 rounded-2xl border border-paper-200/60 dark:border-paper-800/60 transition-colors">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-paper-600 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-paper-50 dark:hover:bg-paper-950 transition-all"
          >
            {language === "es" ? "Panel" : "Dashboard"}
          </button>
          <button
            onClick={() => navigate("/topics")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-paper-600 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-paper-50 dark:hover:bg-paper-950 transition-all"
          >
            {language === "es" ? "Temas" : "Topics"}
          </button>
          <button
            onClick={() => navigate("/progress")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-paper-600 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-paper-50 dark:hover:bg-paper-950 transition-all"
          >
            {t.progress}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-paper-600 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-paper-50 dark:hover:bg-paper-950 transition-all"
          >
            {language === "es" ? "Perfil" : "Profile"}
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all border border-amber-200/20 dark:border-amber-900/30"
            >
              {language === "es" ? "Admin" : "Admin"}
            </button>
          )}
        </div>
      )}

      {/* Widgets & Controls */}
      <div className="flex items-center gap-3">
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-paper-600 dark:text-paper-400 hover:text-paper-800 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60 border border-paper-200 dark:border-paper-800/60 transition-all text-xs font-semibold"
          title="Cambiar idioma / Change language"
        >
          <Globe className="w-4 h-4 text-primary-500" />
          <span>{language === "es" ? "ES" : "EN"}</span>
        </button>

        {/* Theme Selector */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-paper-600 dark:text-paper-400 hover:text-paper-800 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60 border border-paper-200 dark:border-paper-800/60 transition-all"
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-paper-500 dark:text-paper-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-paper-200 dark:border-paper-800/60 hover:border-red-200 dark:hover:border-red-500/20 transition-all text-sm font-semibold"
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
