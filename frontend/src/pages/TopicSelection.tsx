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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mathPurple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-700 dark:text-slate-200 pb-16 transition-colors duration-200">
      {/* Sticky Header Navbar */}
      <Navbar />

      {/* Back button section */}
      <div className="max-w-6xl mx-auto px-6 mt-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 transition-all text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Topic list (spanning 5 cols on lg) */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            {language === "es" ? "Temas Disponibles" : "Available Topics"}
          </h3>
          <div className="grid grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto pr-2">
            {topics.map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => handleSelectTopic(tItem)}
                className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between items-start gap-4 relative overflow-hidden ${
                  selectedTopic?.id === tItem.id
                    ? "bg-mathPurple-50 dark:bg-mathPurple-600/10 border-mathPurple-500 shadow-md scale-[1.01]"
                    : "bg-white dark:bg-[#0c1220] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-[#12192a]/50"
                }`}
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-mathPurple-500/5 rounded-full blur-lg" />
                <div>
                  <span className="text-[10px] text-mathPurple-600 dark:text-mathPurple-400 font-bold uppercase tracking-wider block mb-1">
                    {tItem.area === "Arithmetic" ? (language === "es" ? "Aritmética" : "Arithmetic") : tItem.area === "Algebra" ? (language === "es" ? "Álgebra" : "Algebra") : tItem.area === "Geometry" ? (language === "es" ? "Geometría" : "Geometry") : tItem.area === "Trigonometry" ? (language === "es" ? "Trigonometría" : "Trigonometry") : tItem.area === "Calculus" ? (language === "es" ? "Cálculo" : "Calculus") : (language === "es" ? "Estadística" : "Statistics")}
                  </span>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">{tItem.name}</h4>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800/80">
                  <GraduationCap className="w-3.5 h-3.5 text-mathPurple-600 dark:text-mathPurple-400" />
                  <span>
                    {tItem.level === "Primary"
                      ? t.primary
                      : tItem.level === "Secondary"
                      ? t.secondary
                      : t.university}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Topic Explanation Display (spanning 7 cols) */}
        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            {!selectedTopic ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 shadow-md dark:shadow-xl transition-colors duration-200"
              >
                <HelpCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4 animate-pulse" />
                <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  {language === "es" ? "Ningún tema seleccionado" : "No topic selected"}
                </h4>
                <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm mt-2">
                  {language === "es" 
                    ? "Elige uno de los temas del listado para que el TopicAgent genere tu explicación matemática personalizada."
                    : "Choose one of the topics from the list so the TopicAgent can generate your custom math explanation."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTopic.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-md dark:shadow-xl flex flex-col justify-between min-h-[500px] transition-colors duration-200"
              >
                {loadingExplanation ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Loader2 className="w-10 h-10 text-mathPurple-500 animate-spin mb-4" />
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {language === "es" ? "TopicAgent estructurando lección..." : "TopicAgent compiling lesson..."}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-2">
                      {language === "es" 
                        ? `Organizando analogías y fórmulas matemáticas para tu nivel de ${selectedTopic.level === "Primary" ? "Primaria" : selectedTopic.level === "Secondary" ? "Secundaria" : "Universidad"}.`
                        : `Organizing math analogies and formulas tailored for your ${selectedTopic.level} level.`}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                          {language === "es" ? "Lección Interactiva" : "Interactive Lesson"}
                        </span>
                        <h3 className="text-xl font-black text-slate-850 dark:text-white mt-0.5">
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
                        title={isSpeaking ? (language === "es" ? "Detener voz" : "Stop voice") : (language === "es" ? "Escuchar lección" : "Listen to lesson")}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold shrink-0 ${
                          isSpeaking
                            ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                            : "bg-mathPurple-500/10 border-mathPurple-500/30 text-mathPurple-700 dark:text-mathPurple-400 hover:bg-mathPurple-500/20"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4 animate-pulse" />
                            <span>{language === "es" ? "Silenciar" : "Mute"}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>{language === "es" ? "Escuchar" : "Listen"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                      <MathRenderer text={explanation} />
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                          {language === "es" ? "¿Listo para resolver desafíos?" : "Ready to solve challenges?"}
                        </span>
                        <span className="text-xs font-bold text-mathPurple-600 dark:text-mathPurple-400 block">
                          {language === "es" ? "5 ejercicios dinámicos te esperan" : "5 dynamic exercises await you"}
                        </span>
                      </div>
                      <button
                        onClick={handleStartSession}
                        className="w-full sm:w-auto bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-mathPurple-600/20 text-sm"
                      >
                        {language === "es" ? "Iniciar Desafío" : "Start Session"}
                        <Play className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-colors duration-200"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mathPurple-500" />
                {language === "es" ? "Selecciona tu Aventura" : "Select Your Adventure"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                {language === "es" 
                  ? "NeuralMath genera una misión y una historia continua con tus ejercicios. Elige el tema que prefieras:"
                  : "NeuralMath generates a dynamic narrative quest matching your math problems. Choose your adventure theme:"}
              </p>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
                {adventureThemes.map((themeItem) => (
                  <div
                    key={themeItem.id}
                    onClick={() => handleStartWithTheme(themeItem.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-mathPurple-500/50 hover:bg-mathPurple-50/10 dark:hover:bg-[#12192a] cursor-pointer hover:scale-[1.01] transition-all duration-150 group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-md bg-gradient-to-tr ${themeItem.color} text-white`}>
                      {themeItem.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-extrabold block text-slate-800 dark:text-white group-hover:text-mathPurple-600 dark:group-hover:text-mathPurple-400 transition-colors">
                        {language === "es" ? themeItem.title_es : themeItem.title_en}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                        {language === "es" ? themeItem.desc_es : themeItem.desc_en}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setThemeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
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
