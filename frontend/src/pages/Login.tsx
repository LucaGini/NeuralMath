import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import { LogIn, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] text-[#f1f5f9] font-body retro-grid p-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background cyber glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff00e5]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass border border-[#00f0ff]/20 p-8 rounded-3xl relative z-10 tech-brackets glow-cyan overflow-hidden"
      >
        {/* Retro scanline overlay inside card */}
        <div className="absolute inset-0 scanline opacity-[0.025] pointer-events-none" />
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-[#182035] border border-[#00f0ff]/30 rounded-2xl flex items-center justify-center shadow-lg shadow-cyberCyan/10 mb-4 animate-float-slow">
            <BookOpen className="w-9 h-9 text-cyberCyan" />
          </div>
          <h1 className="text-3xl font-display font-black tracking-wider text-white uppercase">
            NeuralMath
          </h1>
          <p className="text-cyberCyan font-cyber text-[11px] uppercase tracking-[0.2em] mt-2 font-bold">
            {language === "es" ? "Plataforma Inteligente de Matemáticas" : "AI-Powered Math Learning Platform"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-cyberMagenta px-4 py-3.5 rounded-2xl text-xs font-cyber font-semibold mb-6 text-center shadow-sm relative z-10 uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[11px] font-cyber font-bold text-[#00f0ff]/80 uppercase tracking-widest mb-2">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full bg-[#182035]/50 border border-slate-800 focus:border-cyberCyan focus:bg-[#0c1220] focus:ring-2 focus:ring-cyberCyan/20 text-white rounded-2xl px-4 py-3.5 text-sm font-cyber placeholder-slate-600 focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-cyber font-bold text-[#00f0ff]/80 uppercase tracking-widest mb-2">
              {t.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#182035]/50 border border-slate-800 focus:border-cyberCyan focus:bg-[#0c1220] focus:ring-2 focus:ring-cyberCyan/20 text-white rounded-2xl px-4 py-3.5 text-sm font-cyber placeholder-slate-600 focus:outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-tactile-cyan font-cyber font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#070b13] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? t.signing_in : t.login}
            <LogIn className="w-4 h-4 text-inherit" />
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center relative z-10">
          <div className="absolute w-full h-[1px] bg-slate-800" />
          <span className="relative bg-[#070b13] px-3 text-[11px] text-slate-500 font-cyber uppercase tracking-widest">
            {language === "es" ? "Ó" : "OR"}
          </span>
        </div>

        {/* Quick Demo Login bypass */}
        <button
          onClick={fillQuickDemo}
          className="w-full btn-tactile-slate font-cyber font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] text-xs uppercase tracking-widest shadow-sm relative z-10"
        >
          <Sparkles className="w-4 h-4 text-cyberCyan animate-pulse" />
          {t.quick_demo}
        </button>

        <p className="text-center text-slate-400 text-xs mt-8 relative z-10">
          {t.no_account}{" "}
          <Link to="/register" className="text-cyberMagenta hover:text-cyberCyan font-bold hover:underline transition-colors">
            {language === "es" ? "Regístrate aquí" : "Register here"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
