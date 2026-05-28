import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { MathRenderer } from "../components/MathRenderer";
import { Navbar } from "../components/Navbar";
import { useApp } from "../services/AppContext";
import { ArrowLeft, BookOpen, GraduationCap, Play, HelpCircle, Loader2, Volume2, VolumeX, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceService } from "../services/voice";

interface Topic {
  id: number;
  name: string;
  area: string;
  level: string;
}

export const TopicSelection: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useApp();

  const adventureThemes = [
    {
      id: "standard",
      title_es: "Práctica Estándar",
      title_en: "Standard Practice",
      desc_es: "Ejercicios matemáticos puros, directos y enfocados.",
      desc_en: "Pure, direct, and focused mathematical exercises.",
      icon: "🌀",
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "space",
      title_es: "Odisea Espacial",
      title_en: "Space Odyssey",
      desc_es: "Alinea propulsores y escapa de agujeros de gusano resolviendo ecuaciones.",
      desc_en: "Align thrusters and escape wormholes by solving equations.",
      icon: "🚀",
      color: "from-purple-600 to-pink-600",
    },
    {
      id: "fantasy",
      title_es: "Reino de Fantasía",
      title_en: "Fantasy Realm",
      desc_es: "Lanza hechizos antiguos y derrota bestias míticas con tus cálculos.",
      desc_en: "Cast ancient spells and defeat mythical beasts with your calculations.",
      icon: "⚔️",
      color: "from-amber-500 to-red-600",
    },
    {
      id: "sports",
      title_es: "Campeonato Deportivo",
      title_en: "Sports Championship",
      desc_es: "Anota goles y gana copas resolviendo desafíos de velocidad.",
      desc_en: "Score goals and win trophies by solving speed-based challenges.",
      icon: "⚽",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  useEffect(() => {
    return () => {
      VoiceService.stop();
    };
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get("/topics");
        setTopics(res.data);
      } catch (err) {
        console.error("Error fetching topics:", err);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  const handleSelectTopic = async (topic: Topic) => {
    VoiceService.stop();
    setIsSpeaking(false);
    setSelectedTopic(topic);
    setExplanation("");
    setLoadingExplanation(true);
    try {
      const res = await api.post(`/topics/${topic.id}/explain`);
      setExplanation(res.data.explanation);
    } catch (err) {
      console.error("Error fetching topic explanation:", err);
      setExplanation(
        language === "es" 
          ? "Disculpa, tuvimos un problema al cargar la explicación. Por favor reinténtalo."
          : "Sorry, we had a problem loading the explanation. Please try again."
      );
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleStartSession = () => {
    if (selectedTopic) {
      setThemeModalOpen(true);
    }
  };

  const handleStartWithTheme = (themeChosen: string) => {
    if (selectedTopic) {
      setThemeModalOpen(false);
      navigate(`/session/${selectedTopic.id}?theme=${themeChosen}`);
    }
  };

  if (loadingTopics) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] retro-grid text-cyan-400 font-cyber">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
        <span className="tracking-widest uppercase text-xs animate-pulse">Initializing Math Lab Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-[#f1f5f9] pb-16 retro-grid relative overflow-x-hidden">
      {/* Sticky Header Navbar */}
      <Navbar />

      {/* Back button section */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-tactile-slate flex items-center gap-2 px-4 py-2 text-xs font-bold font-cyber uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Topic list (spanning 5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-extrabold text-[#00f0ff] uppercase tracking-widest font-cyber flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
            {language === "es" ? "Temas Disponibles" : "Available Topics"}
          </h3>
          
          <div className="grid grid-cols-1 gap-3.5 max-h-[65vh] overflow-y-auto pr-2">
            {topics.map((tItem) => {
              const isSelected = selectedTopic?.id === tItem.id;
              return (
                <button
                  key={tItem.id}
                  onClick={() => handleSelectTopic(tItem)}
                  className={`text-left p-5 rounded-xl border transition-all flex flex-col justify-between items-start gap-4 relative overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-r from-[rgba(0,240,255,0.15)] to-[rgba(0,240,255,0.05)] border-[#00f0ff] shadow-md scale-[1.01] glow-cyan"
                      : "bg-[#0e1424]/80 border-slate-800/80 hover:border-[#00f0ff]/40 hover:scale-[1.005] hover:bg-[#121a30]/90"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#00f0ff] rounded-bl-xl shadow-[0_0_10px_#00f0ff]" />
                  )}
                  <div className="w-full">
                    <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1.5 font-cyber ${isSelected ? 'text-[#00f0ff]' : 'text-slate-500'}`}>
                      {tItem.area === "Arithmetic" ? (language === "es" ? "Aritmética" : "Arithmetic") : tItem.area === "Algebra" ? (language === "es" ? "Álgebra" : "Algebra") : tItem.area === "Geometry" ? (language === "es" ? "Geometría" : "Geometry") : tItem.area === "Trigonometry" ? (language === "es" ? "Trigonometría" : "Trigonometry") : tItem.area === "Calculus" ? (language === "es" ? "Cálculo" : "Calculus") : (language === "es" ? "Estadística" : "Statistics")}
                    </span>
                    <h4 className="font-extrabold text-white text-base tracking-tight font-display">{tItem.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-950/40 px-3 py-1 rounded-md border border-slate-850">
                    <GraduationCap className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span className="font-cyber tracking-widest uppercase">
                      {tItem.level === "Primary"
                        ? t.primary
                        : tItem.level === "Secondary"
                        ? t.secondary
                        : t.university}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Topic Explanation Display (spanning 7 cols) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!selectedTopic ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] bg-[#0c1220]/75 border border-dashed border-cyan-500/20 rounded-3xl flex flex-col items-center justify-center text-center p-8 transition-colors duration-200"
              >
                <div className="w-16 h-16 rounded-full border border-cyan-500/10 flex items-center justify-center mb-4 bg-cyan-950/20 text-[#00f0ff] animate-pulse">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-extrabold text-[#00f0ff] uppercase tracking-widest font-cyber">
                  {language === "es" ? "SISTEMA EN ESPERA" : "SYSTEM STANDBY"}
                </h4>
                <p className="text-slate-400 text-xs font-body max-w-sm mt-2 leading-relaxed">
                  {language === "es" 
                    ? "Elige uno de los temas del listado para que el TopicAgent genere tu explicación matemática estructurada."
                    : "Choose one of the topics from the list so the TopicAgent can generate your structured math explanation."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTopic.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[500px] tech-brackets scanline shadow-2xl relative overflow-hidden"
              >
                {loadingExplanation ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center font-cyber">
                    <Loader2 className="w-10 h-10 text-[#00f0ff] animate-spin mb-4" />
                    <span className="text-sm font-extrabold text-white tracking-widest uppercase">
                      {language === "es" ? "TopicAgent ESTRUCTURANDO..." : "TopicAgent COMPILES..."}
                    </span>
                    <span className="text-[11px] text-slate-500 max-w-xs mt-2 leading-relaxed tracking-wider">
                      {language === "es" 
                        ? `PROCESANDO ANALOGÍAS MATEMÁTICAS A NIVEL ${selectedTopic.level.toUpperCase()}`
                        : `PROCESSING TAILORED ANALOGIES FOR LEVEL: ${selectedTopic.level.toUpperCase()}`}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-cyan-500/10 pb-4 mb-6 gap-4">
                      <div>
                        <span className="text-[10px] text-[#00f0ff] font-extrabold uppercase tracking-widest block font-cyber">
                          {language === "es" ? "LECCIÓN COGNITIVA ACTIVA" : "ACTIVE COGNITIVE LESSON"}
                        </span>
                        <h3 className="text-2xl font-extrabold font-display text-white mt-1">
                          {selectedTopic.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          if (isSpeaking) {
                            VoiceService.stop();
                            setIsSpeaking(false);
                          } else {
                            setIsSpeaking(true);
                            VoiceService.speak(explanation, language, () => setIsSpeaking(false));
                          }
                        }}
                        className={`px-4 py-2.5 rounded-lg border text-xs font-extrabold uppercase tracking-widest font-cyber shrink-0 flex items-center gap-2 transition-all ${
                          isSpeaking
                            ? "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse"
                            : "bg-cyan-500/10 border-cyan-500/30 text-[#00f0ff] hover:bg-cyan-500/25 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span className="hidden sm:inline">{language === "es" ? "Silenciar" : "Mute"}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span className="hidden sm:inline">{language === "es" ? "Escuchar" : "Listen"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-slate-200 text-sm md:text-[15px] leading-relaxed font-body">
                      <MathRenderer text={explanation} />
                    </div>

                    <div className="border-t border-cyan-500/10 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-left w-full sm:w-auto">
                        <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-cyber">
                          {language === "es" ? "¿Listo para resolver desafíos?" : "Ready to solve challenges?"}
                        </span>
                        <span className="text-xs font-bold text-cyan-400 block mt-0.5 font-cyber tracking-widest">
                          {language === "es" ? "5 ejercicios dinámicos te esperan" : "5 dynamic exercises await you"}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleStartSession}
                        className="w-full sm:w-auto btn-tactile-cyan px-8 py-3.5 font-cyber text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-2"
                      >
                        {language === "es" ? "Iniciar Desafío" : "Start Session"}
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Glassmorphic Adventure Theme Selector Modal */}
      <AnimatePresence>
        {themeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl glass border border-[#00f0ff]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden scanline"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-lg font-bold text-[#00f0ff] uppercase tracking-widest font-cyber mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse text-[#00f0ff]" />
                {language === "es" ? "Selecciona tu Aventura" : "Select Your Adventure"}
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed font-body">
                {language === "es" 
                  ? "NeuralMath genera una misión y una historia continua con tus ejercicios. Elige el tema que prefieras:"
                  : "NeuralMath generates a dynamic narrative quest matching your math problems. Choose your adventure theme:"}
              </p>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
                {adventureThemes.map((themeItem) => (
                  <div
                    key={themeItem.id}
                    onClick={() => handleStartWithTheme(themeItem.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-[#0e1424]/85 hover:border-[#00f0ff]/60 hover:bg-[#12192e] cursor-pointer transition-all duration-150 group shadow-sm hover:scale-[1.01]"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl border border-white/10 shadow-md bg-gradient-to-tr ${themeItem.color} text-white font-cyber shrink-0`}>
                      {themeItem.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-extrabold font-cyber tracking-wide block text-white group-hover:text-[#00f0ff] transition-colors uppercase">
                        {language === "es" ? themeItem.title_es : themeItem.title_en}
                      </span>
                      <span className="text-xs text-slate-400 font-body block mt-0.5 leading-snug">
                        {language === "es" ? themeItem.desc_es : themeItem.desc_en}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setThemeModalOpen(false)}
                  className="btn-tactile-slate px-5 py-2.5 text-xs font-bold font-cyber uppercase tracking-wider"
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
