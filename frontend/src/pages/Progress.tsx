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
          color: "border-cyberEmerald text-cyberEmerald bg-[#00ff66]/10 shadow-[0_0_10px_rgba(0,255,102,0.1)]",
          label: t.mastered,
          bar: "bg-gradient-to-r from-emerald-600 to-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]",
          glowClass: "glow-emerald",
          emoji: "🟢"
        };
      case "improving":
        return {
          color: "border-cyberAmber text-cyberAmber bg-cyberAmber/10 shadow-[0_0_10px_rgba(255,183,0,0.1)]",
          label: t.improving,
          bar: "bg-gradient-to-r from-amber-600 to-cyberAmber shadow-[0_0_10px_rgba(255,183,0,0.3)]",
          glowClass: "glow-cyan",
          emoji: "🟡"
        };
      case "needs_work":
      default:
        return {
          color: "border-cyberMagenta text-cyberMagenta bg-cyberMagenta/10 shadow-[0_0_10px_rgba(255,0,229,0.1)]",
          label: t.needs_work,
          bar: "bg-gradient-to-r from-rose-600 to-cyberMagenta shadow-[0_0_10px_rgba(255,0,229,0.3)]",
          glowClass: "glow-magenta",
          emoji: "🔴"
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] retro-grid relative">
        <div className="absolute inset-0 bg-[#070b13]/60 backdrop-blur-md pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#00f0ff]/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#00f0ff] animate-spin" />
          </div>
          <span className="font-cyber text-[#00f0ff] text-xs uppercase tracking-widest animate-pulse">
            {language === "es" ? "Cargando Telemetría..." : "Loading Telemetry..."}
          </span>
        </div>
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
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] font-body retro-grid relative pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8 w-full relative z-10">
        
        {/* Header section with telemetry brackets & neon cyber layout */}
        <div className="relative glass p-8 rounded-3xl border border-[#00f0ff]/20 tech-brackets glow-cyan overflow-hidden">
          {/* Decorative futuristic scanline overlay inside header */}
          <div className="absolute inset-0 scanline opacity-[0.03] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#ff00e5]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] text-cyberCyan font-cyber font-bold uppercase tracking-[0.2em] block mb-1">
                {t.progress} // SYSTEMS_DIAGNOSTIC
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-black text-white flex items-center gap-3 uppercase tracking-wide">
                <BarChart2 className="w-8 h-8 text-cyberCyan animate-float-slow" />
                {t.skill_map}
              </h1>
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                {language === "es"
                  ? "Monitorea tu dominio en cada habilidad matemática. Nuestro tutor IA adapta tu ruta para maximizar tu aprendizaje."
                  : "Monitor your mastery of individual math concepts. Our AI tutor adjusts your learning path dynamically."}
              </p>
            </div>

            {skills.length > 0 && (
              <button
                onClick={handleContinuePath}
                className="btn-tactile-cyan font-cyber font-bold py-3.5 px-6 rounded-2xl shadow-lg shrink-0 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#070b13] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 fill-current animate-pulse" />
                {t.continue_path}
              </button>
            )}
          </div>
        </div>

        {skills.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-12 rounded-3xl text-center space-y-4 border border-[#ff00e5]/20 glow-magenta"
          >
            <Brain className="w-16 h-16 text-cyberMagenta mx-auto animate-pulse" />
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
              {language === "es" ? "Tu mapa está vacío" : "Your Skill Map is empty"}
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {t.skill_map_empty}
            </p>
            <button
              onClick={() => navigate("/topics")}
              className="mt-2 text-cyberCyan font-cyber font-bold text-sm hover:underline uppercase tracking-wider"
            >
              {language === "es" ? "Comenzar práctica" : "Start practicing"}
            </button>
          </motion.div>
        ) : (
          /* Stats summaries + Grid */
          <div className="space-y-8">
            {/* Quick stats panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Stat 1: Total Answers */}
              <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-[#00f0ff]/20 hover:border-[#00f0ff]/40 transition-all glow-cyan relative overflow-hidden group">
                <div className="absolute inset-0 scanline opacity-[0.015] pointer-events-none" />
                <div className="w-12 h-12 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl flex items-center justify-center text-cyberCyan group-hover:scale-105 transition-transform duration-300">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-3xl font-cyber font-extrabold text-white block">
                    {totalExercisesAnswered}
                  </span>
                  <span className="text-[10px] text-cyberCyan font-cyber uppercase tracking-widest font-bold">
                    {language === "es" ? "Respuestas Totales" : "Total Answers"}
                  </span>
                </div>
              </div>

              {/* Stat 2: Skills Mastered */}
              <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-[#00ff66]/20 hover:border-[#00ff66]/40 transition-all glow-emerald relative overflow-hidden group">
                <div className="absolute inset-0 scanline opacity-[0.015] pointer-events-none" />
                <div className="w-12 h-12 bg-[#00ff66]/10 border border-[#00ff66]/30 rounded-xl flex items-center justify-center text-cyberEmerald group-hover:scale-105 transition-transform duration-300">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-3xl font-cyber font-extrabold text-white block">
                    {masteredCount}
                  </span>
                  <span className="text-[10px] text-cyberEmerald font-cyber uppercase tracking-widest font-bold">
                    {language === "es" ? "Habilidades Dominadas" : "Skills Mastered"}
                  </span>
                </div>
              </div>

              {/* Stat 3: Average Accuracy */}
              <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-[#ff00e5]/20 hover:border-[#ff00e5]/40 transition-all glow-magenta relative overflow-hidden group">
                <div className="absolute inset-0 scanline opacity-[0.015] pointer-events-none" />
                <div className="w-12 h-12 bg-[#ff00e5]/10 border border-[#ff00e5]/30 rounded-xl flex items-center justify-center text-cyberMagenta group-hover:scale-105 transition-transform duration-300">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-3xl font-cyber font-extrabold text-white block">
                    {(averageAccuracy * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-cyberMagenta font-cyber uppercase tracking-widest font-bold">
                    {language === "es" ? "Precisión Promedio" : "Average Accuracy"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mastery Grid Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyberCyan animate-pulse" />
                {language === "es" ? "Desglose por Habilidad" : "Breakdown by Skill"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skills.map((item, idx) => {
                  const cfg = getStatusConfig(item.status);
                  return (
                    <motion.div
                      key={item.skill}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass p-6 rounded-2xl border border-slate-800/80 hover:border-[#00f0ff]/30 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden tech-brackets"
                    >
                      {/* Scanline CRT overlay for beautiful retro tactile depth */}
                      <div className="absolute inset-0 scanline opacity-[0.025] pointer-events-none" />
                      
                      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                        <div className="space-y-1">
                          <h3 className="font-display font-bold text-white text-base group-hover:text-cyberCyan transition-colors uppercase tracking-wide">
                            {formatSkillName(item.skill)}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-cyber flex items-center gap-1.5 uppercase">
                            <BookOpen className="w-3.5 h-3.5 text-cyberCyan" />
                            {item.last_topic}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-cyber font-bold uppercase tracking-wider border ${cfg.color}`}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </div>

                      {/* Accuracy progress bar / Neon Telemetry Gauge */}
                      <div className="space-y-2.5 relative z-10">
                        <div className="flex justify-between text-xs font-cyber">
                          <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                            {language === "es" ? "Precisión" : "Accuracy"}
                          </span>
                          <span className="text-white font-bold">
                            {item.correct_attempts} / {item.total_attempts} ({Math.round(item.accuracy * 100)}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-[#182035] rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${cfg.bar}`}
                            style={{ width: `${item.accuracy * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats details bar */}
                      {item.avg_time_ms && (
                        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-cyber relative z-10 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#ff00e5]" />
                            {language === "es" ? "Velocidad promedio" : "Avg speed"}
                          </span>
                          <span className="font-extrabold text-cyberCyan bg-[#182035] border border-slate-700/40 px-2.5 py-0.5 rounded-md">
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
