import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { MathRenderer } from "../components/MathRenderer";
import { useApp } from "../services/AppContext";
import { badgesConfig } from "../services/translations";
import { ArrowLeft, CheckCircle2, AlertCircle, Play, ChevronRight, Trophy, Flame, Sparkles, Award, Volume2, VolumeX, Loader2 } from "lucide-react";
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
  const { t, language, theme } = useApp();
  const chosenTheme = searchParams.get("theme") || "standard";

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

  useEffect(() => {
    // Reset timer when question changes
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      VoiceService.stop();
    };
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const isReview = topicId === "review";
      const isTeachBack = topicId === "teach-back";
      setLoadingMsg(
        language === "es" 
          ? "ExerciseAgent generando retos..." 
          : "ExerciseAgent generating challenges..."
      );
      try {
        const res = isTeachBack
          ? await api.post("/sessions/teach-back/start")
          : isReview
            ? await api.post("/sessions/review/start")
            : await api.post("/sessions/start", {
                topic_id: parseInt(topicId || "0"),
                theme: chosenTheme,
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
      } else {
        SoundEffects.playIncorrect();
      }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] retro-grid text-cyan-400 font-cyber p-6">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
        <span className="tracking-widest uppercase text-xs animate-pulse">
          {loadingMsg}
        </span>
      </div>
    );
  }

  // End of Session Summary screen
  if (completedSummary) {
    const hasNewBadges = completedSummary.newly_unlocked && completedSummary.newly_unlocked.length > 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b13] retro-grid p-6 relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg glass border border-[#00f0ff]/30 p-8 rounded-2xl shadow-2xl relative z-10 text-center space-y-6 scanline font-cyber"
        >
          <div>
            <span className="text-[10px] text-[#00f0ff] font-extrabold uppercase tracking-widest block mb-1">
              {language === "es" ? "DESAFÍO COMPLETADO" : "CHALLENGE COMPLETED"}
            </span>
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">{topicName}</h2>
          </div>

          {/* Newly unlocked achievements / badges */}
          {hasNewBadges && (
            <div className="space-y-3">
              {completedSummary.newly_unlocked.map((badge) => {
                const config = badgesConfig[badge.badge_key] || { emoji: "🏆", color: "from-yellow-400 to-amber-600" };
                return (
                  <motion.div
                    key={badge.badge_key}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3.5 text-left shadow-lg"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl border border-amber-550 bg-gradient-to-tr ${config.color} shrink-0`}>
                      {config.emoji}
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-450 font-black uppercase tracking-widest block font-cyber">
                        {t.new_badge}
                      </span>
                      <span className="text-sm font-bold text-white block mt-0.5 font-display">
                        {language === "es" ? badge.title_es : badge.title_en}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight font-body">
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
            <div className="bg-[#0e1424] border border-slate-800 p-5 rounded-xl flex flex-col items-center justify-center transition-all">
              <Trophy className="w-8 h-8 text-yellow-500 mb-2 animate-bounce" />
              <span className="text-2xl font-black text-white font-cyber">
                {completedSummary.score} / {completedSummary.total_questions}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1.5 font-cyber">
                {language === "es" ? "Aciertos" : "Correct"}
              </span>
            </div>
            
            <div className="bg-[#0e1424] border border-slate-800 p-5 rounded-xl flex flex-col items-center justify-center transition-all">
              <Flame className="w-8 h-8 text-orange-500 mb-2 animate-pulse" />
              <span className="text-2xl font-black text-white font-cyber">
                {completedSummary.streak_days} {language === "es" ? "Días" : "Days"}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1.5 font-cyber">
                {t.active_streak}
              </span>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-[#00f0ff]/30 py-4 px-6 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider font-cyber">
              {language === "es" ? "Puntos de Experiencia:" : "Experience Points:"}
            </span>
            <span className="text-lg font-black text-[#00ff66] font-cyber">
              +{completedSummary.xp_earned} XP
            </span>
          </div>

          {/* Motivator Agent Box */}
          <div className="bg-[#0a0f1d] border border-slate-800 p-6 rounded-xl relative text-left shadow-inner">
            <div className="absolute -top-3.5 left-6 bg-[#070b13] border border-slate-800 px-3 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
              <span className="text-[9px] font-bold text-[#00f0ff] uppercase tracking-widest font-cyber">
                MotivatorAgent
              </span>
            </div>
            <p className="text-slate-300 text-xs italic leading-relaxed mt-2 font-body font-medium">
              "{completedSummary.motivation_message}"
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full btn-tactile-cyan py-4 font-cyber text-sm uppercase tracking-widest font-extrabold flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] flex flex-col justify-between retro-grid relative overflow-x-hidden">
      {/* Top Bar with Gamified Progress */}
      <header className="glass border-b border-slate-800 bg-[#0c1220]/75 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-6 shadow-md relative overflow-hidden scanline">
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
          className="btn-tactile-slate p-2.5 rounded-lg flex items-center justify-center border-slate-800 text-cyan-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xl bg-slate-950 border border-slate-800/80 h-3 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="bg-gradient-to-r from-cyan-400 via-teal-400 to-[#00f0ff] h-full rounded-full glow-cyan shadow-[0_0_10px_#00f0ff]"
          />
        </div>

        <span className="text-xs font-bold font-cyber text-[#00f0ff] bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-lg">
          {currentIndex + 1} / {exercises.length}
        </span>
      </header>

      {/* Main Core Question Section */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl glass border border-slate-800 p-8 rounded-2xl shadow-2xl hover:border-[#00f0ff]/30 transition-all duration-300 glow-cyan space-y-6 tech-brackets scanline relative overflow-hidden"
        >
          <div>
            <span className="text-[10px] text-[#00f0ff] font-extrabold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-lg font-cyber">
              {language === "es" ? "RETO" : "CHALLENGE"} {currentIndex + 1} — {activeExercise?.difficulty_level.toUpperCase() || "MEDIUM"}
            </span>
          </div>

          <div className="prose dark:prose-invert text-lg md:text-xl text-white font-bold py-4 font-display leading-relaxed">
            <MathRenderer text={activeExercise?.question || ""} />
          </div>

          {/* If Teach-Back Alby Task, render Alby's holographic classmate console */}
          {activeExercise?.protege_answer && activeExercise?.protege_explanation && (
            <div className="border border-cyan-500/20 bg-[#090e1a]/95 p-6 rounded-xl space-y-4 relative overflow-hidden shadow-inner scanline">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-center text-3xl animate-pulse">
                  🤖
                </div>
                <div>
                  <span className="text-[10px] text-[#00f0ff] font-extrabold uppercase tracking-widest block font-cyber">
                    {language === "es" ? "COMPAÑERO VIRTUAL" : "VIRTUAL CLASSMATE"}
                  </span>
                  <h4 className="font-extrabold font-cyber text-white text-base tracking-wide">ALBY_v1.0.3</h4>
                </div>
              </div>
              
              <div className="bg-[#050810] border border-cyan-500/10 p-4 rounded-lg space-y-2">
                <span className="text-[9px] font-extrabold font-cyber text-cyan-400 uppercase tracking-widest block">
                  {language === "es" ? "Respuesta de Alby:" : "Alby's Answer:"}
                </span>
                <div className="text-sm font-extrabold text-white font-cyber bg-[#070b13] border border-cyan-500/20 p-2.5 rounded-md">
                  <MathRenderer text={activeExercise.protege_answer || ""} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-extrabold font-cyber text-slate-500 uppercase tracking-widest block">
                  {language === "es" ? "Razonamiento de Alby:" : "Alby's Reasoning:"}
                </span>
                <p className="text-slate-300 text-xs leading-relaxed italic font-body font-medium bg-[#050810]/50 p-3 rounded-lg border border-slate-900/60">
                  <MathRenderer text={activeExercise.protege_explanation || ""} />
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            {activeExercise?.protege_answer ? (
              /* === TEACH BACK TUTOR REVIEW TEXTAREA === */
              <div className="space-y-2">
                <label className="text-xs font-bold font-cyber text-[#00f0ff] uppercase tracking-wider block">
                  ✍️ {language === "es" ? "Tu corrección / explicación para Alby:" : "Your corrective feedback for Alby:"}
                </label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => {
                    if (!evaluation) setUserAnswer(e.target.value);
                  }}
                  placeholder={language === "es" ? "Escríbele una explicación a Alby indicando qué error cometió y cómo llegar a la solución correcta..." : "Write Alby an explanation showing his error and how to reach the correct answer..."}
                  rows={4}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] transition-all text-sm font-body focus:ring-4 focus:ring-cyan-500/10"
                  disabled={!!evaluation}
                  required
                  autoFocus
                />
              </div>
            ) : (
              <>
                {/* === MULTIPLE CHOICE === */}
                {activeExercise?.exercise_type === "multiple_choice" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                    {activeExercise.choices?.map((choice, idx) => {
                      const isSelected = selectedChoice === choice;
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          disabled={!!evaluation}
                          onClick={() => !evaluation && setSelectedChoice(choice)}
                          className={`p-4 rounded-xl text-left text-sm transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px] w-full
                            ${isSelected
                              ? "btn-tactile-cyan"
                              : "btn-tactile-slate"
                            }
                            ${evaluation ? "cursor-not-allowed opacity-75" : "cursor-pointer"}
                          `}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 font-cyber ${isSelected ? 'text-[#070b13]' : 'text-slate-500'}`}>
                            {language === "es" ? "Opción" : "Option"} {["A", "B", "C", "D"][idx]}
                          </span>
                          <div className="flex-1 flex items-center font-display font-bold">
                            <MathRenderer text={choice} />
                          </div>
                        </motion.button>
                      );
                    })}
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
                    className="w-full bg-[#0a0f1d] border border-slate-800 focus:border-[#00f0ff] rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none transition-colors text-base text-center font-cyber font-bold focus:ring-4 focus:ring-cyan-500/10"
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
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00f0ff] transition-colors text-base font-cyber text-center focus:ring-4 focus:ring-cyan-500/10"
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
                className="w-full btn-tactile-magenta py-4 font-cyber text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
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
                  className="p-4 rounded-xl bg-[#0a0f1d] border border-cyan-500/20 text-[#00f0ff] text-xs font-cyber leading-relaxed shadow-inner"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-1.5 text-cyan-400">
                    💡 {language === "es" ? `Pista ${hintLevel}/4` : `Hint ${hintLevel}/4`}
                  </span>
                  <MathRenderer text={currentHint} />
                </motion.div>
              )}
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={hintLevel >= 4 || loadingHint}
                className="text-xs font-bold font-cyber text-slate-500 hover:text-[#00f0ff] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {hintLevel === 0
                  ? (language === "es" ? "💡 ¿Necesitas una pista? (−5 XP)" : "💡 Need a hint? (−5 XP)")
                  : hintLevel < 4
                    ? (language === "es" ? `💡 Pista más específica (−5 XP adicionales)` : `💡 More specific hint (−5 more XP)`)
                    : (language === "es" ? "✨ Máximo de pistas alcanzado" : "✨ Maximum hints reached")
                }
                {loadingHint && <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-[#00f0ff]" />}
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
                className={`border rounded-xl p-5 text-left relative overflow-hidden transition-colors font-cyber scanline ${
                  evaluation.is_correct
                    ? "bg-[#081a14]/95 border-emerald-500/35 text-emerald-350 shadow-md shadow-emerald-500/5"
                    : "bg-[#1a1208]/95 border-amber-500/35 text-amber-300 shadow-md shadow-amber-500/5"
                }`}
              >
                {!evaluation.is_correct && evaluation.error_type && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
                    🏷️ {language === "es" ? errorTypeLabelsEs[evaluation.error_type] : errorTypeLabelsEn[evaluation.error_type]}
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-sm mb-3 gap-4">
                  <div className="flex items-center gap-2">
                    {evaluation.is_correct ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-[#00ff66] animate-bounce" />
                        <span className="font-extrabold uppercase tracking-widest text-xs">{language === "es" ? "¡Respuesta Correcta!" : "Correct Answer!"}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-550" />
                        <span className="font-extrabold uppercase tracking-widest text-xs">{language === "es" ? "Intento Completado" : "Attempt Logged"}</span>
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
                    className={`p-1.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider shrink-0 ${
                      isSpeaking
                        ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        : evaluation.is_correct
                          ? "bg-[#081a14] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-[#1a1208] border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
                
                {!evaluation.is_correct && evaluation.misconception && (
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-400 mb-4 font-body font-semibold leading-relaxed shadow-sm">
                    💡 {evaluation.misconception}
                  </div>
                )}

                <div className="text-slate-300 text-sm leading-relaxed prose dark:prose-invert font-body">
                  <MathRenderer text={evaluation.explanation} />
                </div>

                <button
                  onClick={handleContinue}
                  className={`w-full mt-5 font-cyber text-xs uppercase tracking-widest font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 ${
                    evaluation.is_correct
                      ? "btn-tactile-cyan bg-[#00ff66] border-[#00cc52] text-[#070b13]"
                      : "btn-tactile-magenta"
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
      <footer className="py-4 text-center text-[10px] text-slate-550 uppercase tracking-widest bg-slate-950/80 border-t border-slate-900 font-cyber">
        NeuralMath Interactive Learning Loop
      </footer>
    </div>
  );
};
