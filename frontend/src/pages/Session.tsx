import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { MathRenderer } from "../components/MathRenderer";
import { useApp } from "../services/AppContext";
import { badgesConfig } from "../services/translations";
import { ArrowLeft, CheckCircle2, AlertCircle, Play, ChevronRight, Trophy, Flame, Sparkles, Award, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceService } from "../services/voice";
import { SoundEffects } from "../services/SoundEffects";
import { triggerConfetti, triggerSuperCelebration } from "../services/confetti";

interface Exercise {
  id: number;
  question: string;
  difficulty_level: string;
  order_index: number;
  exercise_type: "free_text" | "multiple_choice" | "fill_blank";
  choices?: string[];
  protege_answer?: string;
  protege_explanation?: string;
}

interface Evaluation {
  is_correct: boolean;
  explanation: string;
  error_type?: string;
  misconception?: string;
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

const errorTypeLabelsEs: Record<string, string> = {
  sign_error: "Error de Signo",
  distribution_error: "Error de Distribución",
  order_of_operations: "Orden de Operaciones",
  exponent_rule: "Regla de Exponentes",
  cancellation_error: "Cancelación Inválida",
  arithmetic_slip: "Error Aritmético",
  conceptual_error: "Error Conceptual",
  other: "Otro Error",
};

const errorTypeLabelsEn: Record<string, string> = {
  sign_error: "Sign Error",
  distribution_error: "Distribution Error",
  order_of_operations: "Order of Operations",
  exponent_rule: "Exponent Rule",
  cancellation_error: "Invalid Cancellation",
  arithmetic_slip: "Arithmetic Slip",
  conceptual_error: "Conceptual Error",
  other: "Other Error",
};

export const Session: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language, theme, showAlert, showConfirm } = useApp();
  const chosenTheme = searchParams.get("theme") || "standard";
  const exerciseCountParam = searchParams.get("exercise_count") || "5";

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
  const [isSpeaking, setIsSpeaking] = useState(false);

  // New Roadmap states
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [hintLevel, setHintLevel] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  // Speed-Run states
  const [sessionType, setSessionType] = useState<string>("practice");
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [timeIndicator, setTimeIndicator] = useState<{ text: string; isPositive: boolean } | null>(null);

  useEffect(() => {
    // Reset timer when question changes
    setQuestionStartTime(Date.now());
    if (sessionType === "speed_run") {
      setSecondsLeft(30);
    }
  }, [currentIndex, sessionType]);

  useEffect(() => {
    return () => {
      VoiceService.stop();
    };
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const isReview = topicId === "review";
      const isTeachBack = topicId === "teach-back";
      const isSpeedRun = topicId === "speed-run";
      setLoadingMsg(
        language === "es" 
          ? "ExerciseAgent generando retos..." 
          : "ExerciseAgent generating challenges..."
      );
      try {
        const subtopicParam = searchParams.get("subtopic") || undefined;
        const res = isTeachBack
          ? await api.post("/sessions/teach-back/start")
          : isReview
            ? await api.post("/sessions/review/start")
            : isSpeedRun
              ? await api.post("/sessions/speed-run/start")
              : await api.post("/sessions/start", {
                  topic_id: parseInt(topicId || "0"),
                  theme: chosenTheme,
                  exercise_count: parseInt(exerciseCountParam),
                  subtopic: subtopicParam,
                });
        setSessionId(res.data.session_id);
        setTopicName(res.data.topic_name);
        setExercises(res.data.exercises);
        setSessionType(res.data.session_type || "practice");
      } catch (err) {
        console.error("Error starting session:", err);
        showAlert(
          language === "es" 
            ? "No se pudo iniciar la sesión. Regresando a temas." 
            : "Could not start learning session. Returning to topics.",
          () => navigate("/topics")
        );
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [topicId, navigate, language]);

  const handleAutoSubmitComplete = async () => {
    setLoading(true);
    setLoadingMsg(
      language === "es"
        ? "¡Tiempo agotado! Evaluando desempeño final..."
        : "Time's up! Evaluating final performance..."
    );
    try {
      const res = await api.post(`/sessions/${sessionId}/complete`);
      setCompletedSummary(res.data);
      SoundEffects.playTriumph();
      if (res.data.score === res.data.total_questions || (res.data.newly_unlocked && res.data.newly_unlocked.length > 0)) {
        triggerSuperCelebration();
      } else {
        triggerConfetti();
      }
    } catch (err) {
      console.error("Error completing speed-run session:", err);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionType !== "speed_run" || completedSummary || loading || evaluation) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmitComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionType, completedSummary, loading, evaluation, sessionId]);

  const handleRequestHint = async () => {
    const activeExercise = exercises[currentIndex];
    if (hintLevel >= 4 || evaluation || loadingHint || !activeExercise) return;
    setLoadingHint(true);
    const nextLevel = hintLevel + 1;
    try {
      const res = await api.post("/sessions/hint", {
        exercise_id: activeExercise.id,
        hint_level: nextLevel,
      });
      setHintLevel(nextLevel);
      setCurrentHint(res.data.hint);
    } catch (err) {
      console.error("Error fetching hint:", err);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeExercise = exercises[currentIndex];
    const answer = activeExercise?.exercise_type === "multiple_choice"
      ? selectedChoice
      : userAnswer;
      
    if (!answer || !answer.trim() || submitting || evaluation) return;

    setSubmitting(true);
    try {
      const timeMs = Date.now() - questionStartTime;
      const res = await api.post("/sessions/answer", {
        exercise_id: activeExercise.id,
        user_answer: answer,
        time_to_answer_ms: timeMs,
      });
      setEvaluation({
        is_correct: res.data.is_correct,
        explanation: res.data.explanation,
        error_type: res.data.error_type,
        misconception: res.data.misconception,
      });

      if (res.data.is_correct) {
        SoundEffects.playCorrect();
        if (sessionType === "speed_run") {
          setSecondsLeft((prev) => prev + 5);
          setTimeIndicator({ text: "+5s", isPositive: true });
          setTimeout(() => setTimeIndicator(null), 1500);
        }
      } else {
        SoundEffects.playIncorrect();
        if (sessionType === "speed_run") {
          setSecondsLeft((prev) => Math.max(0, prev - 5));
          setTimeIndicator({ text: "-5s", isPositive: false });
          setTimeout(() => setTimeIndicator(null), 1500);
        }
      }
    } catch (err) {
      console.error("Error evaluating answer:", err);
      showAlert(
        language === "es"
          ? "Ocurrió un error al procesar tu respuesta."
          : "An error occurred while checking your answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    VoiceService.stop();
    setIsSpeaking(false);
    setEvaluation(null);
    setUserAnswer("");
    setSelectedChoice(null);
    setHintLevel(0);
    setCurrentHint(null);

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

        SoundEffects.playTriumph();
        if (res.data.score === res.data.total_questions || (res.data.newly_unlocked && res.data.newly_unlocked.length > 0)) {
          triggerSuperCelebration();
        } else {
          triggerConfetti();
        }
      } catch (err) {
        console.error("Error completing session:", err);
        showAlert(
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
            showConfirm(
              language === "es"
                ? "¿Estás seguro de que quieres salir? Perderás el progreso de esta sesión."
                : "Are you sure you want to quit? You will lose all progress for this session.",
              () => navigate("/topics")
            );
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

        {sessionType === "speed_run" && (
          <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-2xl relative shadow-inner animate-pulse">
            <span className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono tracking-widest">
              ⏱️ {secondsLeft}s
            </span>
            <AnimatePresence>
              {timeIndicator && (
                <motion.span
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -20, scale: 1.1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9 }}
                  className={`absolute right-2 font-black text-xs ${
                    timeIndicator.isPositive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {timeIndicator.text}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-mathPurple-750 dark:text-mathPurple-400 font-bold uppercase tracking-widest bg-mathPurple-500/10 border border-mathPurple-500/20 px-3 py-1 rounded-full">
              {language === "es" ? "Reto" : "Challenge"} {currentIndex + 1} — {activeExercise?.difficulty_level || "Medio"}
            </span>
            {searchParams.get("subtopic") && (
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                🎯 {searchParams.get("subtopic")}
              </span>
            )}
          </div>

          <div className="prose dark:prose-invert text-lg md:text-xl text-slate-800 dark:text-slate-100 font-medium py-4">
            <MathRenderer text={activeExercise?.question || ""} />
          </div>

          {/* If Teach-Back Alby Task, render Alby's Robot Misconception Card here! */}
          {activeExercise?.protege_answer && activeExercise?.protege_explanation && (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-mathPurple-500/30 p-6 rounded-2xl space-y-4 relative overflow-hidden transition-colors shadow-inner">
              <div className="absolute top-0 right-0 w-24 h-24 bg-mathPurple-500/5 rounded-full blur-xl" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-mathPurple-100 dark:bg-mathPurple-950/40 rounded-xl flex items-center justify-center text-3xl animate-bounce">
                  🤖
                </div>
                <div>
                  <span className="text-[10px] text-mathPurple-600 dark:text-mathPurple-400 font-bold uppercase tracking-wider block">
                    Compañero Virtual
                  </span>
                  <h4 className="font-extrabold text-slate-850 dark:text-white text-base">Alby cometió un error</h4>
                </div>
              </div>
              
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                  Su respuesta final:
                </span>
                <div className="text-base font-bold text-slate-800 dark:text-white">
                  <MathRenderer text={activeExercise.protege_answer || ""} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                  Su razonamiento:
                </span>
                <p className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed italic">
                  <MathRenderer text={activeExercise.protege_explanation || ""} />
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            {activeExercise?.protege_answer ? (
              /* === TEACH BACK TUTOR REVIEW TEXTAREA === */
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  ✍️ {language === "es" ? "Tu explicación correctora para Alby:" : "Your corrective explanation for Alby:"}
                </label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => {
                    if (!evaluation) setUserAnswer(e.target.value);
                  }}
                  placeholder={language === "es" ? "Escríbele una explicación a Alby indicando qué error cometió y cómo llegar a la solución correcta..." : "Write Alby an explanation showing his error and how to reach the correct answer..."}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-[#161c2c]/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-mathPurple-500 focus:bg-white dark:focus:bg-[#0c1220] transition-colors text-sm"
                  disabled={!!evaluation}
                  required
                  autoFocus
                />
              </div>
            ) : (
              <>
                {/* === MULTIPLE CHOICE === */}
                {activeExercise?.exercise_type === "multiple_choice" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {activeExercise.choices?.map((choice, idx) => (
                      <motion.button
                        key={idx}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={!!evaluation}
                        onClick={() => !evaluation && setSelectedChoice(choice)}
                        className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px]
                          ${selectedChoice === choice
                            ? "bg-mathPurple-500/10 border-mathPurple-500 text-mathPurple-700 dark:text-mathPurple-300 ring-2 ring-mathPurple-500/20"
                            : "bg-slate-50 dark:bg-[#161c2c]/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:border-slate-350 hover:bg-slate-100/40"
                          }
                          ${evaluation ? "cursor-not-allowed opacity-75" : "cursor-pointer"}
                        `}
                      >
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                          {language === "es" ? "Opción" : "Option"} {["A", "B", "C", "D"][idx]}
                        </span>
                        <div className="flex-1 flex items-center">
                          <MathRenderer text={choice} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* === FILL IN THE BLANK === */}
                {activeExercise?.exercise_type === "fill_blank" && (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => {
                      if (!evaluation) setUserAnswer(e.target.value);
                    }}
                    placeholder={t.fill_missing}
                    className="w-full bg-slate-50 dark:bg-[#161c2c]/40 border-2 border-dashed border-mathPurple-400/40 focus:border-mathPurple-500 rounded-2xl px-5 py-4 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:bg-white dark:focus:bg-[#0c1220] transition-colors text-base text-center font-bold"
                    disabled={!!evaluation}
                    required
                    autoFocus
                  />
                )}

                {/* === FREE TEXT === */}
                {(!activeExercise?.exercise_type || activeExercise.exercise_type === "free_text") && (
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => {
                      if (!evaluation) setUserAnswer(e.target.value);
                    }}
                    placeholder={language === "es" ? "Ingresa tu respuesta..." : "Type your answer..."}
                    className="w-full bg-slate-50 dark:bg-[#161c2c]/40 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:border-mathPurple-500 focus:bg-white dark:focus:bg-[#0c1220] transition-colors text-base"
                    disabled={!!evaluation}
                    required
                    autoFocus
                  />
                )}
              </>
            )}

            {!evaluation && (
              <button
                type="submit"
                disabled={submitting || (activeExercise?.exercise_type === "multiple_choice" ? !selectedChoice : !userAnswer.trim())}
                className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting 
                  ? (language === "es" ? "Evaluando respuesta..." : "Checking answer...") 
                  : (activeExercise?.protege_answer ? (language === "es" ? "Enviar corrección a Alby" : "Send correction to Alby") : t.submit)}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Socratic Hint ladder */}
          {!evaluation && activeExercise && (
            <div className="space-y-3 pt-2">
              {currentHint && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-blue-500/5 border border-blue-400/20 text-blue-700 dark:text-blue-300 text-sm leading-relaxed"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-blue-500">
                    💡 {language === "es" ? `Pista ${hintLevel}/4` : `Hint ${hintLevel}/4`}
                  </span>
                  <MathRenderer text={currentHint} />
                </motion.div>
              )}
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={hintLevel >= 4 || loadingHint}
                className="text-xs font-bold text-slate-450 dark:text-slate-500 hover:text-mathPurple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {hintLevel === 0
                  ? (language === "es" ? "💡 ¿Necesitas una pista? (−5 XP)" : "💡 Need a hint? (−5 XP)")
                  : hintLevel < 4
                    ? (language === "es" ? `💡 Pista más específica (−5 XP adicionales)` : `💡 More specific hint (−5 more XP)`)
                    : (language === "es" ? "✨ Máximo de pistas alcanzado" : "✨ Maximum hints reached")
                }
                {loadingHint && <span className="animate-spin rounded-full h-3 h-3 border-t-2 border-mathPurple-500" />}
              </button>
            </div>
          )}

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
                {!evaluation.is_correct && evaluation.error_type && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-450 text-[10px] font-black uppercase tracking-wider mb-3">
                    🏷️ {language === "es" ? errorTypeLabelsEs[evaluation.error_type] : errorTypeLabelsEn[evaluation.error_type]}
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-sm mb-3 gap-4">
                  <div className="flex items-center gap-2">
                    {evaluation.is_correct ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                        <span>{language === "es" ? "¡Respuesta Correcta!" : "Correct Answer!"}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        <span>{language === "es" ? "Intento Completado" : "Attempt Logged"}</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) {
                        VoiceService.stop();
                        setIsSpeaking(false);
                      } else {
                        setIsSpeaking(true);
                        VoiceService.speak(evaluation.explanation, language, () => setIsSpeaking(false));
                      }
                    }}
                    title={isSpeaking ? (language === "es" ? "Detener voz" : "Stop voice") : (language === "es" ? "Escuchar explicación" : "Listen to explanation")}
                    className={`p-1.5 rounded-lg border flex items-center justify-center gap-1 transition-all text-xs font-semibold shrink-0 ${
                      isSpeaking
                        ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                        : evaluation.is_correct
                          ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-450 hover:bg-green-500/20"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-450 hover:bg-amber-500/20"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        <span>{language === "es" ? "Silenciar" : "Mute"}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{language === "es" ? "Escuchar" : "Listen"}</span>
                      </>
                    )}
                  </button>
                </div>
                
                {!evaluation.is_correct && evaluation.misconception && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-750 dark:text-amber-400 mb-4 font-semibold">
                    💡 {evaluation.misconception}
                  </div>
                )}

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
