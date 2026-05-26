import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { MathRenderer } from "../components/MathRenderer";
import { ArrowLeft, CheckCircle2, AlertCircle, Play, ChevronRight, Trophy, Flame, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  id: number;
  question: str;
  difficulty_level: string;
  order_index: number;
}

interface Evaluation {
  is_correct: boolean;
  explanation: string;
}

interface CompletionSummary {
  score: number;
  total_questions: number;
  xp_earned: number;
  streak_days: number;
  motivation_message: string;
}

export const Session: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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
      try {
        const res = await api.post("/sessions/start", {
          topic_id: parseInt(topicId || "0"),
        });
        setSessionId(res.data.session_id);
        setTopicName(res.data.topic_name);
        setExercises(res.data.exercises);
      } catch (err) {
        console.error("Error starting session:", err);
        alert("No se pudo iniciar la sesión. Regresando a temas.");
        navigate("/topics");
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [topicId, navigate]);

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
      alert("Ocurrió un error al procesar tu respuesta.");
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
      try {
        const res = await api.post(`/sessions/${sessionId}/complete`);
        setCompletedSummary(res.data);
      } catch (err) {
        console.error("Error completing session:", err);
        alert("Ocurrió un error al finalizar la sesión.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mathPurple-500 mb-4"></div>
        <span className="text-sm font-semibold text-slate-400">ExerciseAgent generando retos...</span>
      </div>
    );
  }

  // End of Session Summary screen
  if (completedSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mathPurple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-8"
        >
          <div>
            <span className="text-xs text-mathPurple-400 font-bold uppercase tracking-widest block mb-1">
              Desafío Completado
            </span>
            <h2 className="text-3xl font-black text-white">{topicName}</h2>
          </div>

          {/* Gamified Stat badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#161c2c] border border-slate-800/80 p-5 rounded-2xl flex flex-col items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-500 mb-2 animate-bounce" />
              <span className="text-2xl font-black text-white">{completedSummary.score} / {completedSummary.total_questions}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Aciertos</span>
            </div>
            
            <div className="bg-[#161c2c] border border-slate-800/80 p-5 rounded-2xl flex flex-col items-center justify-center">
              <Flame className="w-8 h-8 text-orange-500 mb-2" />
              <span className="text-2xl font-black text-white">{completedSummary.streak_days} Días</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Racha Activa</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-mathPurple-600/20 to-indigo-600/20 border border-mathPurple-500/20 py-4 px-6 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-mathPurple-300">Puntos de Experiencia:</span>
            <span className="text-xl font-black text-green-400">+{completedSummary.xp_earned} XP</span>
          </div>

          {/* Motivator Agent Box */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative text-left">
            <div className="absolute -top-3.5 left-6 bg-slate-950 border border-slate-800 px-3 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mathPurple-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MotivatorAgent</span>
            </div>
            <p className="text-slate-300 text-sm italic leading-relaxed mt-2">
              "{completedSummary.motivation_message}"
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-mathPurple-600/20 transition-all hover:scale-[1.01]"
          >
            Volver al Panel
          </button>
        </motion.div>
      </div>
    );
  }

  const activeExercise = exercises[currentIndex];
  const progressPercent = ((currentIndex + (evaluation ? 1 : 0)) / exercises.length) * 100;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between">
      {/* Top Bar with Duolingo Progress */}
      <header className="border-b border-slate-900 bg-[#0c1220] px-6 py-4 flex items-center justify-between gap-6">
        <button
          onClick={() => {
            if (confirm("¿Estás seguro de que quieres salir? Perderás el progreso de esta sesión.")) {
              navigate("/topics");
            }
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xl bg-slate-800 h-3.5 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="bg-gradient-to-r from-mathPurple-500 to-indigo-500 h-full rounded-full"
          />
        </div>

        <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          {currentIndex + 1} / {exercises.length}
        </span>
      </header>

      {/* Main Core Question Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-[#0c1220] border border-slate-800/80 p-8 rounded-3xl shadow-xl space-y-6"
        >
          <div>
            <span className="text-[10px] text-mathPurple-400 font-bold uppercase tracking-widest bg-mathPurple-500/10 border border-mathPurple-500/20 px-3 py-1 rounded-full">
              Reto {currentIndex + 1} — {activeExercise?.difficulty_level || "Medio"}
            </span>
          </div>

          <div className="prose prose-invert text-lg md:text-xl text-slate-100 font-medium py-4">
            <MathRenderer text={activeExercise?.question || ""} />
          </div>

          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => {
                if (!evaluation) setUserAnswer(e.target.value);
              }}
              placeholder="Ingresa tu respuesta..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-mathPurple-500 focus:bg-slate-950 transition-colors text-base"
              disabled={!!evaluation}
              required
              autoFocus
            />

            {!evaluation && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all text-sm disabled:opacity-50"
              >
                {submitting ? "Evaluando respuesta..." : "Enviar Respuesta"}
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
                className={`border rounded-2xl p-5 text-left relative overflow-hidden ${
                  evaluation.is_correct
                    ? "bg-green-500/5 border-green-500/35 text-green-300"
                    : "bg-amber-500/5 border-amber-500/35 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-3">
                  {evaluation.is_correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span>¡Respuesta Correcta!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span>Intento Completado (¡Aprende del error!)</span>
                    </>
                  )}
                </div>
                
                <div className="text-slate-300 text-sm leading-relaxed prose prose-invert">
                  <MathRenderer text={evaluation.explanation} />
                </div>

                <button
                  onClick={handleContinue}
                  className={`w-full mt-5 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all text-sm ${
                    evaluation.is_correct
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      
      {/* Bottom decorative banner */}
      <footer className="py-4 text-center text-[10px] text-slate-600 uppercase tracking-widest bg-slate-950/40 border-t border-slate-900">
        NeuralMath Interactive Learning Loop
      </footer>
    </div>
  );
};
