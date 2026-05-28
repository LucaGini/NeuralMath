import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import { LogIn, Sparkles, BookOpen, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        (language === "es" ? "Error al iniciar sesión. Inténtalo de nuevo." : "Error logging in. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = () => {
    setEmail("estudiante@neuralmath.edu");
    setPassword("Matematicas123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] p-4 relative overflow-hidden transition-colors duration-200">
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
          <div className="w-16 h-16 bg-gradient-to-tr from-mathPurple-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-mathPurple-500/20 mb-4">
            <BookOpen className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:via-slate-200 dark:to-mathPurple-300 dark:bg-clip-text">
            NeuralMath
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === "es" ? "Plataforma Inteligente de Matemáticas" : "AI-Powered Math Learning Platform"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-mathPurple-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? t.signing_in : t.login}
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-slate-200 dark:bg-slate-700/50" />
          <span className="relative bg-white dark:bg-[#161c2c] px-3 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {language === "es" ? "Ó" : "OR"}
          </span>
        </div>

        {/* Quick Demo Login bypass */}
        <button
          onClick={fillQuickDemo}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/60 dark:hover:bg-slate-950/90 text-mathPurple-700 dark:text-mathPurple-300 border border-mathPurple-200 dark:border-mathPurple-900/40 hover:border-mathPurple-400 dark:hover:border-mathPurple-800/60 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Sparkles className="w-4 h-4 text-mathPurple-600 dark:text-mathPurple-400" />
          {t.quick_demo}
        </button>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8">
          {t.no_account}{" "}
          <Link to="/register" className="text-mathPurple-600 dark:text-mathPurple-400 hover:text-mathPurple-500 dark:hover:text-mathPurple-300 font-semibold hover:underline">
            {language === "es" ? "Regístrate aquí" : "Register here"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
