import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import { UserPlus, GraduationCap, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [level, setLevel] = useState("Secondary");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showColdStartWarning, setShowColdStartWarning] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useApp();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowColdStartWarning(false);

    if (password !== confirmPassword) {
      setError(language === "es" ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setShowColdStartWarning(true);
    }, 4000);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        level,
      });
      clearTimeout(timer);
      navigate("/login");
    } catch (err: any) {
      clearTimeout(timer);
      setError(
        err.response?.data?.detail || 
        (language === "es" ? "Error al registrarse. Por favor intenta de nuevo." : "Failed to register. Please try again.")
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setShowColdStartWarning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] math-grid p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mathPurple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 transition-colors duration-200"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-1 shadow-lg shadow-mathPurple-500/10 border border-slate-200/40 overflow-hidden hover:scale-105 transition-transform duration-300 mb-4">
            <img 
              src="/logo.png" 
              alt="NeuralMath Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:via-slate-200 dark:to-mathPurple-300 dark:bg-clip-text">
            NeuralMath
          </h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">
            {language === "es" ? "Crea tu cuenta de aprendizaje" : "Create your learning account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {showColdStartWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-2xl text-xs mb-6 text-center leading-relaxed font-semibold"
          >
            🚀 {language === "es"
              ? "Despertando el servidor gratuito de Render... Esto puede demorar hasta 50 segundos en el primer intento."
              : "Waking up the free Render server... This may take up to 50 seconds on the first attempt."}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-mathPurple-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-mathPurple-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-4 pr-12 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-mathPurple-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === "es" ? "Confirmar Contraseña" : "Confirm Password"}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-4 pr-12 py-3.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-mathPurple-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.academic_level}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Primary", "Secondary", "University"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-3 px-2 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    level === lvl
                      ? "bg-mathPurple-600/10 dark:bg-mathPurple-600/20 border-mathPurple-500 text-mathPurple-700 dark:text-mathPurple-300"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  {lvl === "Primary" ? t.primary : lvl === "Secondary" ? t.secondary : t.university}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-mathPurple-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? t.registering : (language === "es" ? "Registrarse y Empezar" : "Register & Start")}
            <UserPlus className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8">
          {t.have_account}{" "}
          <Link to="/login" className="text-mathPurple-600 dark:text-mathPurple-400 hover:text-mathPurple-500 dark:hover:text-mathPurple-300 font-semibold hover:underline">
            {language === "es" ? "Inicia sesión aquí" : "Log in here"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
