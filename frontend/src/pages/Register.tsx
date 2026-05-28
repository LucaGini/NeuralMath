import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import { UserPlus, BookOpen, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState("Secondary");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useApp();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        level,
      });
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        (language === "es" ? "Error al registrarse. Inténtalo de nuevo." : "Error registering. Please try again.")
      );
    } finally {
      setLoading(false);
    }
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
            {language === "es" ? "Crea tu cuenta de aprendizaje" : "Create your learning account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-cyberMagenta px-4 py-3.5 rounded-2xl text-xs font-cyber font-semibold mb-6 text-center shadow-sm relative z-10 uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[11px] font-cyber font-bold text-[#00f0ff]/80 uppercase tracking-widest mb-2">
              {t.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "es" ? "Tu nombre completo" : "Your full name"}
              className="w-full bg-[#182035]/50 border border-slate-800 focus:border-cyberCyan focus:bg-[#0c1220] focus:ring-2 focus:ring-cyberCyan/20 text-white rounded-2xl px-4 py-3.5 text-sm font-cyber placeholder-slate-600 focus:outline-none transition-all"
              required
            />
          </div>

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

          <div>
            <label className="block text-[11px] font-cyber font-bold text-[#00f0ff]/80 uppercase tracking-widest mb-2">
              {t.academic_level}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {["Primary", "Secondary", "University"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-3 px-2 rounded-2xl border text-xs font-cyber font-bold flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    level === lvl
                      ? "bg-[#ff00e5]/10 border-cyberMagenta text-cyberMagenta shadow-[0_0_10px_rgba(255,0,229,0.1)]"
                      : "bg-[#182035]/30 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="mt-0.5">{lvl === "Primary" ? t.primary : lvl === "Secondary" ? t.secondary : t.university}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-tactile-cyan font-cyber font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#070b13] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? t.registering : (language === "es" ? "Registrarse y Empezar" : "Register & Start")}
            <UserPlus className="w-4 h-4 text-inherit" />
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-8 relative z-10">
          {t.have_account}{" "}
          <Link to="/login" className="text-cyberMagenta hover:text-cyberCyan font-bold hover:underline transition-colors">
            {language === "es" ? "Inicia sesión aquí" : "Log in here"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
