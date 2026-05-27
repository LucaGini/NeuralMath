import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { useApp } from "../services/AppContext";
import { BarChart2, Award, Zap, Brain, Sparkles, BookOpen, Clock, Activity, Target } from "lucide-react";
import { motion } from "framer-motion";

interface SkillMasteryItem {
  skill: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
  status: "mastered" | "improving" | "needs_work";
  last_topic: string;
  avg_time_ms?: number;
}

export const Progress: React.FC = () => {
  const [skills, setSkills] = useState<SkillMasteryItem[]>([]);
  const [recommendedTopic, setRecommendedTopic] = useState<{ topic_id: number; skill: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language, t } = useApp();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const skillsRes = await api.get("/sessions/skills/mastery");
        setSkills(skillsRes.data);

        const recRes = await api.get("/sessions/skills/recommended-topic");
        setRecommendedTopic(recRes.data);
      } catch (err) {
        console.error("Error fetching progress data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgressData();
  }, []);

  const handleContinuePath = () => {
    if (recommendedTopic) {
      navigate(`/session/${recommendedTopic.topic_id}`);
    } else {
      navigate("/topics");
    }
  };

  const formatSkillName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "mastered":
        return {
          color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
          label: t.mastered,
          bar: "bg-gradient-to-r from-emerald-500 to-green-500",
          emoji: "🟢"
        };
      case "improving":
        return {
          color: "text-yellow-600 dark:text-yellow-450 bg-yellow-500/10 border-yellow-500/20",
          label: t.improving,
          bar: "bg-gradient-to-r from-amber-500 to-yellow-500",
          emoji: "🟡"
        };
      case "needs_work":
      default:
        return {
          color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
          label: t.needs_work,
          bar: "bg-gradient-to-r from-rose-500 to-red-500",
          emoji: "🔴"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mathPurple-500"></div>
      </div>
    );
  }

  // Calculate high-level stats
  const totalExercisesAnswered = skills.reduce((sum, s) => sum + s.total_attempts, 0);
  const averageAccuracy = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.accuracy, 0) / skills.length
    : 0;
  const masteredCount = skills.filter((s) => s.status === "mastered").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-700 dark:text-slate-200 pb-16 transition-colors duration-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8 w-full">
        {/* Header section with glass background */}
        <div className="relative bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm dark:shadow-2xl overflow-hidden transition-colors">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-mathPurple-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] text-mathPurple-600 dark:text-mathPurple-400 font-black uppercase tracking-widest block mb-1">
                {t.progress}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-855 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-8 h-8 text-mathPurple-500" />
                {t.skill_map}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
                {language === "es"
                  ? "Monitorea tu dominio en cada habilidad. Nuestro tutor IA adapta tu ruta para maximizar tu aprendizaje."
                  : "Monitor your mastery of individual math concepts. Our AI tutor adjusts your learning path dynamically."}
              </p>
            </div>

            {skills.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinuePath}
                className="bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-mathPurple-600/20 transition-all shrink-0 flex items-center justify-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4 fill-white" />
                {t.continue_path}
              </motion.button>
            )}
          </div>
        </div>

        {skills.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center shadow-sm space-y-4 transition-colors"
          >
            <Brain className="w-16 h-16 text-slate-350 dark:text-slate-600 mx-auto animate-pulse" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {language === "es" ? "Tu mapa está vacío" : "Your Skill Map is empty"}
            </h3>
            <p className="text-slate-500 dark:text-slate-450 text-sm max-w-sm mx-auto">
              {t.skill_map_empty}
            </p>
            <button
              onClick={() => navigate("/topics")}
              className="mt-2 text-mathPurple-500 font-bold text-sm hover:underline"
            >
              {language === "es" ? "Comenzar práctica" : "Start practicing"}
            </button>
          </motion.div>
        ) : (
          /* Stats summaries + Grid */
          <div className="space-y-8">
            {/* Quick stats panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 transition-colors">
                <div className="w-12 h-12 bg-mathPurple-500/10 rounded-xl flex items-center justify-center text-mathPurple-500">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-850 dark:text-white block">
                    {totalExercisesAnswered}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                    {language === "es" ? "Respuestas Totales" : "Total Answers"}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 transition-colors">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-850 dark:text-white block">
                    {masteredCount}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                    {language === "es" ? "Habilidades Dominadas" : "Skills Mastered"}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 transition-colors">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-850 dark:text-white block">
                    {(averageAccuracy * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                    {language === "es" ? "Precisión Promedio" : "Average Accuracy"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mastery Grid Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mathPurple-500" />
                {language === "es" ? "Desglose por Habilidad" : "Breakdown by Skill"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((item, idx) => {
                  const cfg = getStatusConfig(item.status);
                  return (
                    <motion.div
                      key={item.skill}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-800 dark:text-white text-base">
                            {formatSkillName(item.skill)}
                          </h3>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {item.last_topic}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${cfg.color}`}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </div>

                      {/* Accuracy progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-450 dark:text-slate-500">
                            {language === "es" ? "Precisión" : "Accuracy"}
                          </span>
                          <span className="text-slate-700 dark:text-slate-350">
                            {item.correct_attempts} / {item.total_attempts} ({Math.round(item.accuracy * 100)}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.bar}`}
                            style={{ width: `${item.accuracy * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats details bar */}
                      {item.avg_time_ms && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-500">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {language === "es" ? "Velocidad promedio" : "Avg speed"}
                          </span>
                          <span className="font-bold text-slate-705 dark:text-slate-400">
                            {(item.avg_time_ms / 1000).toFixed(1)}s
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
