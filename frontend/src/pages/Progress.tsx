import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { useApp } from "../services/AppContext";
import { BarChart2, Award, Zap, Brain, Sparkles, BookOpen, Clock, Activity, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface SkillMasteryItem {
  skill: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
  status: "mastered" | "improving" | "needs_work";
  last_topic: string;
  avg_time_ms?: number;
}

interface ErrorDiagnosticItem {
  error_type: string;
  label_es: string;
  label_en: string;
  count: number;
}

interface ErrorDiagnostics {
  total_errors: number;
  primary_error_type: string | null;
  advice_es: string;
  advice_en: string;
  diagnostics: ErrorDiagnosticItem[];
}

export const Progress: React.FC = () => {
  const [skills, setSkills] = useState<SkillMasteryItem[]>([]);
  const [recommendedTopic, setRecommendedTopic] = useState<{ topic_id: number; skill: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [diagnostics, setDiagnostics] = useState<ErrorDiagnostics | null>(null);
  const navigate = useNavigate();
  const { language, theme, t } = useApp();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const skillsRes = await api.get("/sessions/skills/mastery");
        setSkills(skillsRes.data);

        const recRes = await api.get("/sessions/skills/recommended-topic");
        setRecommendedTopic(recRes.data);

        const diagRes = await api.get("/sessions/errors/diagnostics");
        setDiagnostics(diagRes.data);
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

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(skills.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSkills = skills.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Map diagnostics data for Recharts Radar
  const diagnosticsChartData = diagnostics?.diagnostics.map((item) => ({
    subject: language === "es" ? item.label_es : item.label_en,
    A: item.count,
    fullMark: Math.max(...(diagnostics?.diagnostics.map((d) => d.count) || [5])),
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] math-grid text-slate-700 dark:text-slate-200 pb-16 transition-colors duration-200">
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

            {/* Metacognitive Diagnostics Heatmap (Sprint 7 / Option 1) */}
            {diagnostics && diagnostics.total_errors > 0 && (
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-md dark:shadow-xl relative overflow-hidden transition-colors duration-200">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                  <Brain className="w-5 h-5 text-mathPurple-500 animate-pulse" />
                  {language === "es" ? "Mapa de Calor de Errores" : "Cognitive Error Heatmap"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Radar Chart Column */}
                  <div className="md:col-span-5 h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={diagnosticsChartData}>
                        <PolarGrid stroke={theme === "dark" ? "#1e293b" : "#cbd5e1"} />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          stroke="#64748b" 
                          fontSize={9}
                          tick={{ fill: theme === "dark" ? "#94a3b8" : "#475569", fontWeight: "bold" }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 'auto']} 
                          stroke="#64748b"
                          fontSize={8}
                        />
                        <Radar 
                          name="Errores" 
                          dataKey="A" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.25} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Metacognitive Advice Advisor Column */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-gradient-to-r from-mathPurple-600/10 to-indigo-650/10 border border-mathPurple-500/20 p-6 rounded-2xl relative text-left">
                      <div className="absolute -top-3 left-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-0.5 rounded-full flex items-center gap-1.5 transition-colors">
                        <Sparkles className="w-3.5 h-3.5 text-mathPurple-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          MetacognitiveAdvisor
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <span className="text-xs font-bold text-mathPurple-700 dark:text-mathPurple-300 block">
                          {language === "es" 
                            ? `¡Detectamos un patrón de error! De tus últimos ${diagnostics.total_errors} descuidos:` 
                            : `Error pattern detected! From your last ${diagnostics.total_errors} slips:`}
                        </span>
                        <p className="text-slate-650 dark:text-slate-350 text-sm md:text-base leading-relaxed italic font-medium">
                          "{language === "es" ? diagnostics.advice_es : diagnostics.advice_en}"
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
                      {language === "es"
                        ? "* Este diagnóstico es generado en tiempo real analizando la taxonomía algebraica de tus respuestas incorrectas evaluadas por la IA."
                        : "* This diagnostic is calculated in real-time by analyzing the algebraic taxonomy of your incorrect answers checked by the AI."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {diagnostics && diagnostics.total_errors === 0 && (
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden transition-colors duration-200 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl flex items-center justify-center text-3xl mx-auto animate-bounce">
                  🏆
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  {language === "es" ? "¡Precisión Algebraica Impecable!" : "Impeccable Algebraic Accuracy!"}
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-405 max-w-md mx-auto leading-relaxed font-medium">
                  {language === "es"
                    ? "No hemos registrado ningún patrón de error conceptual o de cálculo en tus entrenamientos recientes. ¡Tu mente está sumamente afilada y lista para mayores desafíos!"
                    : "We haven't logged any algebraic misconception or calculation slips in your recent practice sessions. Your mind is fully sharp and ready for higher challenges!"}
                </p>
              </div>
            )}

            {/* Mastery Grid Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mathPurple-500" />
                {language === "es" ? "Desglose por Habilidad" : "Breakdown by Skill"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedSkills.map((item, idx) => {
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

              {/* Sleek Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    title={language === "es" ? "Página anterior" : "Previous page"}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-r from-mathPurple-600 to-indigo-600 border-mathPurple-500 text-white shadow-md shadow-mathPurple-600/10"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    title={language === "es" ? "Siguiente página" : "Next page"}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
