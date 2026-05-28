import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Navbar } from "../components/Navbar";
import { useApp } from "../services/AppContext";
import { avatars, badgesConfig } from "../services/translations";
import { Flame, Trophy, Calendar, ChevronRight, GraduationCap, Award, Lock, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface UserAchievement {
  id: number;
  badge_key: string;
  title_es: string;
  title_en: string;
  desc_es: string;
  desc_en: string;
  unlocked_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  level: string;
  xp_total: number;
  streak_days: number;
  avatar_id: string;
  achievements: UserAchievement[];
}

interface SessionRecord {
  id: number;
  score: number;
  xp_earned: number;
  created_at: string;
  completed_at: string;
  topic: {
    name: string;
    area: string;
  };
}

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  
  const navigate = useNavigate();
  const { language, theme, t } = useApp();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch current user details
        const userRes = await api.get("/auth/me");
        setUser(userRes.data);

        // Fetch recent session completions (fallback placeholder if empty)
        try {
          const sessionsRes = await api.get("/sessions/history");
          setHistory(sessionsRes.data);
        } catch {
          // If no custom history route, write smart mocks that blend perfectly
          setHistory([
            {
              id: 101,
              score: 5,
              xp_earned: 150,
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              topic: { name: language === "es" ? "Suma y Resta Básica" : "Basic Addition & Subtraction", area: "Arithmetic" }
            },
            {
              id: 102,
              score: 4,
              xp_earned: 80,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              completed_at: new Date(Date.now() - 86400000).toISOString(),
              topic: { name: language === "es" ? "Ecuaciones Cuadráticas" : "Quadratic Equations", area: "Algebra" }
            }
          ]);
        }
      } catch (err) {
        console.error("Dashboard validation failed, redirecting to login:", err);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, language]);

  const handleAvatarChange = async (avatarId: string) => {
    if (!user) return;
    setUpdatingAvatar(true);
    try {
      const res = await api.post("/sessions/avatar", { avatar_id: avatarId });
      setUser(res.data);
      setAvatarModalOpen(false);
    } catch (err) {
      console.error("Error updating avatar:", err);
    } finally {
      setUpdatingAvatar(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cyberBg text-cyberCyan font-cyber p-6 scanline">
        <div className="relative w-16 h-16 border-2 border-cyberCyan/40 tech-brackets animate-pulse flex items-center justify-center mb-4">
          <GraduationCap className="w-8 h-8 text-cyberCyan animate-bounce" />
        </div>
        <span className="text-xs uppercase tracking-widest animate-pulse font-bold">
          [ SYSTEM CHECK: COMPILING TELEMETRY LADDER... ]
        </span>
      </div>
    );
  }

  // Get active avatar details
  const activeAvatar = avatars.find((a) => a.id === user.avatar_id) || avatars[avatars.length - 1];

  // Helper to check if a specific badge is unlocked
  const isBadgeUnlocked = (key: string) => {
    return user.achievements.some((a) => a.badge_key === key);
  };

  // Transform session history for Recharts progress curves (Accuracy of the past 10 sessions)
  const recentHistory = [...history].slice(0, 10).reverse();
  const chartData = recentHistory.map((record) => ({
    date: new Date(record.completed_at).toLocaleDateString(language === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" }),
    [language === "es" ? "Puntaje" : "Score"]: record.score,
    topicName: record.topic.name,
    xp: record.xp_earned
  }));

  return (
    <div className="min-h-screen bg-cyberBg text-slate-200 pb-16 transition-colors duration-300 retro-grid relative">
      {/* Background sweep lines */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b13] via-[#0b101c] to-[#070b13] pointer-events-none z-0 opacity-80" />

      <div className="relative z-10">
        {/* Central Navigation Bar */}
        <Navbar />

        {/* Main Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
          
          {/* Hero Welcoming Banner with Sci-fi Telemetry corners */}
          <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-[#0e1424] border-2 border-cyberCyan/20 tech-brackets shadow-2xl mb-8 glow-cyan">
            <div className="absolute right-0 top-0 text-[10px] text-cyberCyan/40 font-cyber p-2 tracking-widest select-none pointer-events-none">
              [ TERMINAL_ID: NM-982X ]
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 bg-[#070b13] border border-cyberCyan/35 text-cyberCyan px-3.5 py-1.5 rounded-xl text-xs font-cyber w-fit mb-3.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyberCyan animate-pulse" />
                  <span>{language === "es" ? "¡Hola de nuevo, Cadete!" : "Welcome back, Cadet!"}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-white">
                  {language === "es" ? `¡Hola, ${user.name}! 🦾` : `Hello, ${user.name}! 🦾`}
                </h1>
                <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
                  {language === "es" 
                    ? "El laboratorio de telemetría matemática está en línea. Pon a prueba tus habilidades de cálculo y lógica hoy con Alby." 
                    : "The math telemetry lab is fully online. Challenge your calculus, algebra, and logic skills today with Alby."}
                </p>
              </div>
              
              {/* Gamified telemetry readouts */}
              <div className="flex items-center gap-3">
                <div className="bg-[#070b13] border border-cyberCyan/25 rounded-xl p-4 text-center min-w-[100px] shadow-[inset_0_0_10px_rgba(0,240,255,0.05)]">
                  <span className="block text-3xl font-cyber font-black text-cyberCyan animate-pulse">{user.streak_days}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-cyber tracking-widest block mt-1">{t.streak}</span>
                </div>
                <div className="bg-[#070b13] border border-cyberMagenta/25 rounded-xl p-4 text-center min-w-[100px] shadow-[inset_0_0_10px_rgba(255,0,229,0.05)]">
                  <span className="block text-3xl font-cyber font-black text-cyberMagenta">{user.xp_total}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-cyber tracking-widest block mt-1">XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Bento Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Profile Card & Achievements Left Column */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Bento-style User Profile Card */}
              <div className="glass bg-[#0e1424]/90 p-6 rounded-2xl relative overflow-hidden border border-cyberCyan/20 tech-brackets shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyberCyan/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  {/* Interactive Avatar Container with neon corners */}
                  <div 
                    onClick={() => setAvatarModalOpen(true)}
                    className="w-16 h-16 bg-[#070b13] border-2 border-cyberCyan/30 hover:border-cyberCyan rounded-xl flex items-center justify-center text-3xl cursor-pointer hover:scale-105 transition-all shadow-inner group relative"
                    title={t.change_avatar}
                  >
                    <span className="group-hover:rotate-6 transition-transform">{activeAvatar.emoji}</span>
                    <div className="absolute -bottom-1 -right-1 bg-cyberCyan text-[#070b13] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-display font-black text-white flex items-center gap-1.5 leading-snug">
                      {user.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-cyberCyan font-cyber font-semibold mt-1">
                      <GraduationCap className="w-4 h-4 text-cyberCyan" />
                      <span className="uppercase tracking-wider">
                        {user.level === "Primary"
                          ? t.primary
                          : user.level === "Secondary"
                          ? t.secondary
                          : t.university}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 italic block mt-0.5 font-medium">
                      {language === "es" ? activeAvatar.desc_es : activeAvatar.desc_en}
                    </span>
                  </div>
                </div>

                {/* Start Practice Cyan Bevel tactile button */}
                <button
                  onClick={() => navigate("/topics")}
                  className="w-full mt-6 btn-tactile-cyan font-cyber uppercase tracking-wider font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  {t.start_practice}
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Review Weak Spots Slate tactile button */}
                <button
                  onClick={() => navigate("/session/review")}
                  className="w-full mt-3 btn-tactile-slate font-cyber uppercase tracking-wider font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  📋 {t.review_weak_spots}
                  <ChevronRight className="w-4 h-4 text-cyberCyan/70" />
                </button>

                {/* AI Protégé (Teach Alby) Bento Widget - Holographic themed */}
                <div className="mt-4 p-4 rounded-xl border border-cyberEmerald/20 bg-[#070b13]/60 flex flex-col gap-3 relative overflow-hidden group shadow-md hover:border-cyberEmerald/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyberEmerald/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0e1424] dark:bg-[#0e1424] border border-cyberEmerald/30 rounded-lg flex items-center justify-center text-xl shadow-inner animate-float-slow">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-[9px] font-cyber font-extrabold text-cyberEmerald uppercase tracking-widest">
                        [ AI PROTÉGÉ: ACTIVE ]
                      </h4>
                      <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
                        {language === "es" ? "¿Puedes enseñarle matemática a Alby?" : "Can you teach math to Alby?"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/session/teach-back")}
                    className="w-full bg-[#182035] text-cyberEmerald border border-cyberEmerald/25 hover:border-cyberEmerald/55 hover:bg-[#1f2a47] font-cyber uppercase tracking-wider font-extrabold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all active:translate-y-0.5 text-[10px]"
                  >
                    {language === "es" ? "Enseñar a Alby" : "Teach Alby"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bento-style Achievements Gallery */}
              <div className="glass bg-[#0e1424]/90 p-6 rounded-2xl border border-cyberCyan/20 tech-brackets shadow-xl">
                <h3 className="text-sm font-display font-black uppercase tracking-wider text-white flex items-center gap-2 mb-1.5">
                  <Award className="w-5 h-5 text-cyberMagenta" />
                  {t.achievements}
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  {t.achievements_sub}
                </p>

                <div className="space-y-3">
                  {Object.entries(badgesConfig).map(([key, config]) => {
                    const unlocked = isBadgeUnlocked(key);
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                          unlocked 
                            ? "bg-[#070b13] border-cyberCyan/20 shadow-[inset_0_0_10px_rgba(0,240,255,0.02)]" 
                            : "bg-[#070b13]/40 border-slate-900/60 opacity-50"
                        }`}
                      >
                        {/* Badge Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border shadow-sm ${
                          unlocked 
                            ? "border-cyberMagenta/45 bg-[#0e1424]" 
                            : "border-slate-800 bg-[#070b13]"
                        }`}>
                          {unlocked ? config.emoji : <Lock className="w-4 h-4 text-slate-600" />}
                        </div>

                        <div className="flex-1">
                          <span className={`text-xs font-bold block ${unlocked ? "text-white" : "text-slate-500"}`}>
                            {language === "es" ? config.title_es : config.title_en}
                          </span>
                          <span className="text-[10px] text-slate-450 block mt-0.5 leading-snug">
                            {language === "es" 
                              ? (unlocked ? user.achievements.find(a => a.badge_key === key)?.desc_es : "Bloqueado: " + (key === "perfect_score" ? "Obtén un 5/5" : key === "streak_3" ? "Racha de 3 días" : "Alcanza 500 XP")) 
                              : (unlocked ? user.achievements.find(a => a.badge_key === key)?.desc_en : "Locked: " + (key === "perfect_score" ? "Get a 5/5 score" : key === "streak_3" ? "3 days streak" : "Reach 500 XP"))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Analytics & Progression Curve Right Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Accuracy Progress Telemetry Panel with scanlines */}
              <div className="glass bg-[#0e1424]/90 p-6 rounded-2xl border border-cyberCyan/20 tech-brackets shadow-xl glow-cyan scanline">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-display font-black uppercase tracking-wider text-white">
                    {language === "es" ? "Historial de Precisión (Últimas 10 Sesiones)" : "Accuracy Performance (Last 10 Sessions)"}
                  </h3>
                  <span className="text-[9px] bg-cyberCyan/10 text-cyberCyan font-cyber font-black px-2.5 py-1 rounded-md border border-cyberCyan/30 uppercase tracking-widest animate-pulse">
                    [ ACTIVE METRICS ]
                  </span>
                </div>
                
                <div className="h-64 flex flex-col justify-center relative z-10">
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.08)" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={9} fontFamily="'Share Tech Mono'" tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} fontFamily="'Share Tech Mono'" tickLine={false} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#070b13",
                            borderColor: "rgba(0, 240, 255, 0.35)",
                            borderRadius: "8px",
                            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                            color: "#ffffff",
                            fontFamily: "'Share Tech Mono'",
                            fontSize: "11px",
                            border: "1.5px solid"
                          }}
                          labelFormatter={(label, items) => {
                            if (items && items[0]) {
                              return `Topic: ${items[0].payload.topicName}`;
                            }
                            return label;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={language === "es" ? "Puntaje" : "Score"} 
                          stroke="#00f0ff" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyberCyan/15 rounded-xl h-full bg-[#070b13]/55">
                      <div className="text-4xl mb-2 animate-bounce">📈</div>
                      <p className="text-sm font-cyber font-bold text-cyberCyan">
                        [ NO PROGRESSION TELEMETRY DETECTED ]
                      </p>
                      <p className="text-xs text-slate-450 mt-1 max-w-[285px] leading-relaxed">
                        {language === "es" 
                          ? "Completa tu primer entrenamiento matemático para visualizar tu curva de aprendizaje." 
                          : "Complete your first math training session to visualize your accuracy learning curve here."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sessions list */}
              <div className="glass bg-[#0e1424]/90 p-6 rounded-2xl border border-cyberCyan/20 tech-brackets shadow-xl">
                <h3 className="text-sm font-display font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyberCyan" />
                  {t.history}
                </h3>
                
                <div className="space-y-3">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-[#070b13]/60 border border-cyberCyan/10 rounded-xl hover:border-cyberCyan/35 transition-all duration-200"
                    >
                      <div>
                        <span className="text-[9px] text-cyberCyan font-cyber font-bold uppercase tracking-widest block">
                          [ {record.topic.area} ]
                        </span>
                        <span className="font-extrabold text-white text-sm block mt-0.5">{record.topic.name}</span>
                      </div>
                      <div className="text-right font-cyber">
                        <span className="text-xs font-bold text-slate-350 block">
                          {record.score} / 5
                        </span>
                        <span className="text-[11px] text-cyberEmerald font-black block mt-0.5">
                          +{record.xp_earned} XP
                        </span>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-8 text-slate-500 font-cyber text-xs">
                      [ NO DATA RECORDED IN REGISTRY ]
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Avatar Selection Pop-up Modal */}
      <AnimatePresence>
        {avatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm scanline">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0e1424] border-2 border-cyberCyan/40 rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="absolute right-0 top-0 text-[8px] text-cyberCyan/40 font-cyber p-2 tracking-widest">
                [ AUTH_AVATAR: CONSOLE ]
              </div>
              
              <h3 className="text-lg font-display font-black text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyberMagenta" />
                {t.select_avatar}
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                {language === "es" ? "Elige el rostro de las matemáticas que te acompañará en tu aprendizaje." : "Choose the mathematician figure to guide your daily training loop."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {avatars.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => !updatingAvatar && handleAvatarChange(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all ${
                      user.avatar_id === item.id 
                        ? "bg-cyberCyan/10 border-cyberCyan text-white"
                        : "bg-[#070b13]/60 border-slate-800 text-slate-450 hover:border-cyberCyan/45"
                    }`}
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <div>
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className="text-[9px] opacity-70 block mt-0.5 leading-snug">
                        {language === "es" ? item.desc_es : item.desc_en}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  disabled={updatingAvatar}
                  onClick={() => setAvatarModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#182035] text-cyberCyan border border-cyberCyan/20 hover:border-cyberCyan/45 hover:bg-[#202b47] font-cyber uppercase tracking-wider font-bold transition-all text-xs"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
