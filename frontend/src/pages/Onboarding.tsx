import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../services/AppContext";
import { motion, AnimatePresence } from "framer-motion";

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { language } = useApp();

  useEffect(() => {
    const pending = localStorage.getItem("onboarding_pending");
    if (!pending) navigate("/login");
  }, []);

  const modes =
    language === "es"
      ? [
          { icon: "⚔️", title: "Práctica Estándar", desc: "Ejercicios adaptativos con narrativa temática" },
          { icon: "🚀", title: "Desafío Diario", desc: "Un problema difícil al día. +100 XP si lo superás" },
          { icon: "⏱️", title: "Contrarreloj", desc: "Matemática rápida bajo presión del tiempo" },
          { icon: "🤖", title: "Enseñar a Alby", desc: "Corregí los errores de Alby y enseñale (Método Feynman)" },
          { icon: "🎯", title: "Sesión de Repaso", desc: "El sistema detecta tus puntos débiles y los trabaja" },
        ]
      : [
          { icon: "⚔️", title: "Standard Practice", desc: "Adaptive exercises with thematic narrative" },
          { icon: "🚀", title: "Daily Challenge", desc: "One hard problem per day. +100 XP if you solve it" },
          { icon: "⏱️", title: "Speed Run", desc: "Fast math under time pressure" },
          { icon: "🤖", title: "Teach Alby", desc: "Correct Alby's mistakes and teach him (Feynman Method)" },
          { icon: "🎯", title: "Adaptive Review", desc: "The system detects your weak spots and targets them" },
        ];

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-paper-950 math-grid flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                s === step
                  ? "bg-primary-500 scale-125"
                  : s < step
                  ? "bg-primary-300 dark:bg-primary-700"
                  : "bg-paper-300 dark:bg-paper-700"
              }`}
            />
          ))}
        </div>

        <div className="bg-white dark:bg-paper-900/60 border border-paper-200 dark:border-paper-700/50 rounded-3xl p-8 shadow-xl">
          <AnimatePresence mode="wait">
            {/* Step 1 — Welcome */}
            {step === 1 && (
              <motion.div
                key={1}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-col items-center text-center space-y-5"
              >
                <div className="w-20 h-20 rounded-3xl shadow-lg overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="NeuralMath"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-2xl font-extrabold text-paper-800 dark:text-white">
                  {language === "es"
                    ? "¡Bienvenido a NeuralMath!"
                    : "Welcome to NeuralMath!"}
                </h1>
                <p className="text-paper-500 dark:text-paper-400 text-sm leading-relaxed">
                  {language === "es"
                    ? "Tu tutor de matemáticas con inteligencia artificial. Vamos a mostrarte todo lo que podés hacer."
                    : "Your AI-powered math tutor. Let us show you everything you can do."}
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {language === "es" ? "Empezar" : "Get Started"}
                </button>
              </motion.div>
            )}

            {/* Step 2 — Practice modes tour */}
            {step === 2 && (
              <motion.div
                key={2}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <h2 className="text-xl font-extrabold text-paper-800 dark:text-white text-center">
                  {language === "es"
                    ? "¿Cómo querés aprender?"
                    : "How do you want to learn?"}
                </h2>
                <p className="text-paper-500 dark:text-paper-400 text-sm text-center">
                  {language === "es"
                    ? "NeuralMath tiene 5 modos distintos de práctica."
                    : "NeuralMath has 5 different practice modes."}
                </p>
                <div className="space-y-2.5">
                  {modes.map((mode) => (
                    <div
                      key={mode.title}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-paper-50 dark:bg-paper-800/40 border border-paper-100 dark:border-paper-700/50"
                    >
                      <span className="text-xl mt-0.5">{mode.icon}</span>
                      <div>
                        <span className="text-sm font-bold text-paper-800 dark:text-white block">
                          {mode.title}
                        </span>
                        <span className="text-xs text-paper-500 dark:text-paper-400">
                          {mode.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {language === "es" ? "Continuar" : "Continue"}
                </button>
              </motion.div>
            )}

            {/* Step 3 — All set */}
            {step === 3 && (
              <motion.div
                key={3}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-col items-center text-center space-y-5"
              >
                <motion.span
                  animate={{ scale: [0.8, 1.1, 1] }}
                  className="text-5xl"
                >
                  ✅
                </motion.span>
                <h2 className="text-xl font-extrabold text-paper-800 dark:text-white">
                  {language === "es"
                    ? "¡Todo listo para empezar!"
                    : "All set to get started!"}
                </h2>
                <p className="text-paper-500 dark:text-paper-400 text-sm leading-relaxed">
                  {language === "es"
                    ? "Tu panel te espera con tu primer desafío del día. ¡Mucho éxito!"
                    : "Your dashboard is waiting with your first daily challenge. Good luck!"}
                </p>
                <div className="bg-primary-500/5 border border-primary-500/15 rounded-2xl p-4 text-sm text-paper-500 dark:text-paper-400 w-full text-left">
                  {language === "es"
                    ? "💡 Tip: Hacé click en Alby en el Panel para practicar con él en cualquier momento."
                    : "💡 Tip: Click on Alby in the Dashboard to practice with him at any time."}
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("onboarding_pending");
                    navigate("/login");
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {language === "es" ? "Iniciar Sesión" : "Log In"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
