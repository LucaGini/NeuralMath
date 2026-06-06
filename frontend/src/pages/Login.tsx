import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import { LogIn, Sparkles, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

interface MathChallenge {
  equation: string;
  answer: string;
}

const CHALLENGES: MathChallenge[] = [
  { equation: "3x - 7 = 14", answer: "7" },
  { equation: "2x + 5 = 15", answer: "5" },
  { equation: "5x - 4 = 11", answer: "3" },
  { equation: "4x + 6 = 22", answer: "4" },
  { equation: "x / 2 + 3 = 8", answer: "10" },
  { equation: "2x - 3 = 11", answer: "7" },
  { equation: "3x + 4 = 19", answer: "5" },
  { equation: "6x - 5 = 25", answer: "5" },
  { equation: "x / 3 - 2 = 2", answer: "12" },
  { equation: "4x - 8 = 12", answer: "5" }
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showColdStartWarning, setShowColdStartWarning] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useApp();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";

  // Socratic recovery states
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMathAnswer, setRecoveryMathAnswer] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<MathChallenge>(CHALLENGES[0]);

  const pickRandomChallenge = () => {
    const randomIndex = Math.floor(Math.random() * CHALLENGES.length);
    setCurrentChallenge(CHALLENGES[randomIndex]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setShowColdStartWarning(false);

    const timer = setTimeout(() => {
      setShowColdStartWarning(true);
    }, 4000);

    try {
      const res = await api.post("/auth/login", { email, password });
      clearTimeout(timer);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      clearTimeout(timer);
      setError(
        err.response?.data?.detail || 
        (language === "es" ? "Error al iniciar sesión. Inténtalo de nuevo." : "Error logging in. Please try again.")
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setShowColdStartWarning(false);
    }
  };

  const fillQuickDemo = () => {
    setEmail("estudiante@neuralmath.edu");
    setPassword("Matematicas123");
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
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {language === "es" ? "Plataforma Inteligente de Matemáticas" : "AI-Powered Math Learning Platform"}
          </p>
        </div>

        {isExpired && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3.5 rounded-2xl text-xs mb-6 text-center font-semibold leading-relaxed">
            {language === "es"
              ? "⚠️ Tu sesión ha expirado por seguridad o el servidor se ha reiniciado. Por favor, inicia sesión nuevamente para continuar acumulando XP."
              : "⚠️ Your session has expired or the server restarted. Please log in again to continue earning XP."}
          </div>
        )}

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

          <div className="flex justify-end text-xs -mt-2">
            <button
              type="button"
              onClick={() => {
                setRecoveryModalOpen(true);
                setRecoveryEmail("");
                setRecoveryMathAnswer("");
                setRecoveryPassword("");
                setRecoveryConfirmPassword("");
                setRecoveryError("");
                setRecoverySuccess("");
                pickRandomChallenge();
              }}
              className="text-mathPurple-600 dark:text-mathPurple-400 hover:underline hover:text-mathPurple-500 font-semibold focus:outline-none"
            >
              {language === "es" ? "¿Olvidaste tu contraseña?" : "Forgot your password?"}
            </button>
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

      {/* Socratic Password Recovery Modal */}
      {recoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              🧮 {language === "es" ? "Recuperación Socrática" : "Socratic Password Reset"}
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
              {language === "es"
                ? "Para restablecer tu contraseña, demuestra tu destreza resolviendo el siguiente reto algebraico:"
                : "To reset your password, prove your mathematical proficiency by solving the algebraic challenge below:"}
            </p>

            {recoveryError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 p-3 rounded-2xl text-xs mb-4 text-center">
                {recoveryError}
              </div>
            )}

            {recoverySuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-650 dark:text-green-400 p-3 rounded-2xl text-xs mb-4 text-center font-semibold">
                {recoverySuccess}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRecoveryError("");
                setRecoverySuccess("");

                // 1. Math check
                const cleanedAnswer = recoveryMathAnswer.trim();
                if (cleanedAnswer !== currentChallenge.answer) {
                  setRecoveryError(
                    language === "es"
                      ? "Respuesta incorrecta. Tu mente matemática aún debe entrenarse para este restablecimiento."
                      : "Incorrect answer. Your mathematical mind must train further for this reset."
                  );
                  return;
                }

                // 2. Password matching check
                if (recoveryPassword.length < 6) {
                  setRecoveryError(
                    language === "es"
                      ? "La nueva contraseña debe tener al menos 6 caracteres."
                      : "New password must be at least 6 characters."
                  );
                  return;
                }
                if (recoveryPassword !== recoveryConfirmPassword) {
                  setRecoveryError(
                    language === "es"
                      ? "Las contraseñas no coinciden."
                      : "Passwords do not match."
                  );
                  return;
                }

                // 3. API Call
                setRecoveryLoading(true);
                try {
                  await api.post("/auth/reset-password", {
                    email: recoveryEmail,
                    new_password: recoveryPassword
                  });
                  setRecoverySuccess(
                    language === "es"
                      ? "¡Contraseña restablecida con éxito! Redirigiendo..."
                      : "Password reset successfully! Redirecting..."
                  );
                  setTimeout(() => {
                    setRecoveryModalOpen(false);
                  }, 2500);
                } catch (err: any) {
                  setRecoveryError(
                    err.response?.data?.detail ||
                    (language === "es"
                      ? "Error al restablecer la contraseña. Verifica tu correo."
                      : "Failed to reset password. Please verify your email.")
                  );
                } finally {
                  setRecoveryLoading(false);
                }
              }}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-mathPurple-500"
                  required
                  disabled={recoveryLoading}
                />
              </div>

              {/* Math Question */}
              <div className="bg-mathPurple-500/5 dark:bg-mathPurple-500/10 border border-mathPurple-500/20 p-4 rounded-xl text-center">
                <span className="text-xs text-slate-550 dark:text-slate-400 block mb-1">
                  {language === "es" ? "Resolver para x:" : "Solve for x:"}
                </span>
                <span className="text-sm font-black text-mathPurple-600 dark:text-mathPurple-400 block tracking-wide">
                  {currentChallenge.equation}
                </span>
                <input
                  type="text"
                  value={recoveryMathAnswer}
                  onChange={(e) => setRecoveryMathAnswer(e.target.value)}
                  placeholder={language === "es" ? "Introduce el valor de x" : "Enter value of x"}
                  className="w-2/3 mx-auto mt-2 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-mathPurple-500"
                  required
                  disabled={recoveryLoading}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === "es" ? "Nueva Contraseña" : "New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showRecoveryPassword ? "text" : "password"}
                    value={recoveryPassword}
                    onChange={(e) => setRecoveryPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-mathPurple-500"
                    required
                    disabled={recoveryLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === "es" ? "Confirmar Nueva Contraseña" : "Confirm New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showRecoveryConfirmPassword ? "text" : "password"}
                    value={recoveryConfirmPassword}
                    onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-mathPurple-500"
                    required
                    disabled={recoveryLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoveryConfirmPassword(!showRecoveryConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                  >
                    {showRecoveryConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRecoveryModalOpen(false)}
                  className="w-1/2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-semibold py-2.5 rounded-xl transition-all"
                  disabled={recoveryLoading}
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-mathPurple-600 hover:bg-mathPurple-500 text-white text-xs font-semibold py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                  disabled={recoveryLoading}
                >
                  {recoveryLoading ? (language === "es" ? "Procesando..." : "Processing...") : (language === "es" ? "Restablecer" : "Reset")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
