import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { MathRenderer } from "../components/MathRenderer";
import { useApp } from "../services/AppContext";
import { badgesConfig } from "../services/translations";
import { ArrowLeft, CheckCircle2, AlertCircle, Play, ChevronRight, Trophy, Flame, Sparkles, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  id: number;
  question: string;
  difficulty_level: string;
  order_index: number;
}

interface Evaluation {
  is_correct: boolean;
  explanation: string;
}

interface NewlyUnlockedAchievement {
  id: number;
  badge_key: string;
  title_es: string;
  title_en: string;
  desc_es: string;
  desc_en: string;
  unlocked_at: string;
}

interface CompletionSummary {
  score: number;
  total_questions: number;
  xp_earned: number;
  streak_days: number;
  motivation_message: string;
  newly_unlocked: NewlyUnlockedAchievement[];
}

export const Session: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { t, language, theme } = useApp();

  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [topicName, setTopicName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<CompletionSummary | null>(null);

  useEffect(() => {
    const initSession = async () => {
      setLoadingMsg(
        language === "es" 
          ? "ExerciseAgent generando retos..." 
          : "ExerciseAgent generating challenges..."
      );
      try {
        const res = await api.post("/sessions/start", {
          topic_id: parseInt(topicId || "0"),
        });
        setSessionId(res.data.session_id);
        setTopicName(res.data.topic_name);
        setExercises(res.data.exercises);
      } catch (err) {
        console.error("Error starting session:", err);
        alert(
          language === "es" 
            ? "No se pudo iniciar la sesión. Regresando a temas." 
            : "Could not start learning session. Returning to topics."
        );
        navigate("/topics");
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [topicId, navigate, language]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || submitting || evaluation) return;

    setSubmitting(true);
    try {
      const activeExercise = exercises[currentIndex];
      const res = await api.post("/sessions/answer", {
        exercise_id: activeExercise.id,
        user_answer: userAnswer,
      });
      setEvaluation({
        is_correct: res.data.is_correct,
        explanation: res.data.explanation,
      });
    } catch (err) {
      console.error("Error evaluating answer:", err);
      alert(
        language === "es"
          ? "Ocurrió un error al procesar tu respuesta."
          : "An error occurred while checking your answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setEvaluation(null);
    setUserAnswer("");

    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all exercises, finalize session
      setLoading(true);
      setLoadingMsg(
        language === "es" 
          ? "Evaluando desempeño final..." 
          : "Evaluating final performance..."
      );
      try {
        const res = await api.post(`/sessions/${sessionId}/complete`);
        setCompletedSummary(res.data);
      } catch (err) {
        console.error("Error completing session:", err);
        alert(
          language === "es"
            ? "Ocurrió un error al finalizar la sesión."
            : "An error occurred while completing the session."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-100 p-6 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mathPurple-500 mb-4"></div>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {loadingMsg}
        </span>
      </div>
    );
  }

  // End of Session Summary screen
  if (completedSummary) {
    const hasNewBadges = completedSummary.newly_unlocked && completedSummary.newly_unlocked.length > 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden transition-colors duration-200">
        {/* Background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mathPurple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 text-center space-y-6 transition-colors duration-200"
        >
          <div>
            <span className="text-[10px] text-mathPurple-600 dark:text-mathPurple-400 font-bold uppercase tracking-widest block mb-1">
              {language === "es" ? "Desafío Completado" : "Challenge Completed"}
            </span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{topicName}</h2>
          </div>

          {/* New Badges Celebratory Notification Banners */}
          {hasNewBadges && (
            <div className="space-y-3">
              {completedSummary.newly_unlocked.map((badge) => {
                const config = badgesConfig[badge.badge_key] || { emoji: "🏆", color: "from-yellow-400 to-amber-600" };
                return (
                  <motion.div
                    key={badge.badge_key}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-400/30 rounded-2xl flex items-center gap-3.5 text-left shadow-lg shadow-amber-400/5 animate-pulse"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-amber-400 bg-gradient-to-tr ${config.color}`}>
                      {config.emoji}
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest block">
                        {t.new_badge}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white block mt-0.5">
                        {language === "es" ? badge.title_es : badge.title_en}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
                        {language === "es" ? badge.desc_es : badge.desc_en}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Gamified Stat badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#161c2c] border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col items-center justify-center transition-colors">
              <Trophy className="w-8 h-8 text-yellow-500 mb-2 animate-bounce" />
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {completedSummary.score} / {completedSummary.total_questions}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
                {language === "es" ? "Aciertos" : "Correct"}
              </span>
            </div>
            
            <div className="bg-slate-50 dark:bg-[#161c2c] border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col items-center justify-center transition-colors">
              <Flame className="w-8 h-8 text-orange-500 mb-2" />
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {completedSummary.streak_days} {language === "es" ? "Días" : "Days"}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
                {t.active_streak}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-mathPurple-600/10 to-indigo-600/10 border border-mathPurple-500/20 py-4 px-6 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-mathPurple-700 dark:text-mathPurple-300">
              {language === "es" ? "Puntos de Experiencia:" : "Experience Points:"}
            </span>
            <span className="text-xl font-black text-green-600 dark:text-green-400">
              +{completedSummary.xp_earned} XP
            </span>
          </div>

          {/* Motivator Agent Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl relative text-left transition-colors">
            <div className="absolute -top-3.5 left-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-0.5 rounded-full flex items-center gap-1.5 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-mathPurple-500 dark:text-mathPurple-400 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                MotivatorAgent
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed mt-2">
              "{completedSummary.motivation_message}"
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-mathPurple-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {t.finish}
          </button>
        </motion.div>
      </div>
    );
  }

  const activeExercise = exercises[currentIndex];
  const progressPercent = ((currentIndex + (evaluation ? 1 : 0)) / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-700 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Bar with Duolingo Progress */}
      <header className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-[#0c1220] px-6 py-4 flex items-center justify-between gap-6 transition-colors">
        <button
          onClick={() => {
            if (
              confirm(
                language === "es" 
                  ? "¿Estás seguro de que quieres salir? Perderás el progreso de esta sesión." 
                  : "Are you sure you want to quit? You will lose all progress for this session."
              )
            ) {
              navigate("/topics");
            }
          }}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xl bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="bg-gradient-to-r from-mathPurple-500 to-indigo-500 h-full rounded-full"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition-colors">
          {currentIndex + 1} / {exercises.length}
        </span>
      </header>

      {/* Main Core Question Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800/80 p-8 rounded-3xl shadow-md dark:shadow-xl space-y-6 transition-colors"
        >
          <div>
            <span className="text-[10px] text-mathPurple-750 dark:text-mathPurple-400 font-bold uppercase tracking-widest bg-mathPurple-500/10 border border-mathPurple-500/20 px-3 py-1 rounded-full">
              {language === "es" ? "Reto" : "Challenge"} {currentIndex + 1} — {activeExercise?.difficulty_level || "Medio"}
            </span>
          </div>

          <div className="prose dark:prose-invert text-lg md:text-xl text-slate-800 dark:text-slate-100 font-medium py-4">
            <MathRenderer text={activeExercise?.question || ""} />
          </div>

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => {
                if (!evaluation) setUserAnswer(e.target.value);
              }}
              placeholder={language === "es" ? "Ingresa tu respuesta..." : "Type your answer..."}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-mathPurple-500 focus:bg-white dark:focus:bg-slate-950 transition-colors text-base"
              disabled={!!evaluation}
              required
              autoFocus
            />

            {!evaluation && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm disabled:opacity-50"
              >
                {submitting 
                  ? (language === "es" ? "Evaluando respuesta..." : "Checking answer...") 
                  : t.submit}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Evaluator Agent Panel Popups */}
          <AnimatePresence>
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`border rounded-2xl p-5 text-left relative overflow-hidden transition-colors ${
                  evaluation.is_correct
                    ? "bg-green-500/5 border-green-500/35 text-green-700 dark:text-green-300"
                    : "bg-amber-500/5 border-amber-500/35 text-amber-700 dark:text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-3">
                  {evaluation.is_correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                      <span>{language === "es" ? "¡Respuesta Correcta!" : "Correct Answer!"}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      <span>{language === "es" ? "Intento Completado (¡Aprende del error!)" : "Attempt Logged (Learn from mistake!)"}</span>
                    </>
                  )}
                </div>
                
                <div className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed prose dark:prose-invert">
                  <MathRenderer text={evaluation.explanation} />
                </div>

                <button
                  onClick={handleContinue}
                  className={`w-full mt-5 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm ${
                    evaluation.is_correct
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  {t.next}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      
      {/* Bottom decorative banner */}
      <footer className="py-4 text-center text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-white dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-900 transition-colors">
        NeuralMath Interactive Learning Loop
      </footer>
    </div>
  );
};
