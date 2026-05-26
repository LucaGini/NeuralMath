import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { MathRenderer } from "../components/MathRenderer";
import { ArrowLeft, BookOpen, GraduationCap, Play, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const navigate = useNavigate();

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
    setSelectedTopic(topic);
    setExplanation("");
    setLoadingExplanation(true);
    try {
      const res = await api.post(`/topics/${topic.id}/explain`);
      setExplanation(res.data.explanation);
    } catch (err) {
      console.error("Error fetching topic explanation:", err);
      setExplanation("Disculpa, tuvimos un problema al cargar la explicación. Por favor reinténtalo.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleStartSession = () => {
    if (selectedTopic) {
      navigate(`/session/${selectedTopic.id}`);
    }
  };

  if (loadingTopics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mathPurple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-16">
      {/* Sticky Header */}
      <header className="border-b border-slate-800 bg-[#0c1220]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xl font-bold tracking-tight text-white block">Áreas de Estudio</span>
          <span className="text-[10px] text-mathPurple-400 uppercase tracking-widest font-semibold">Selecciona un tema para empezar</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Topic list (spanning 5 cols on lg) */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Temas Disponibles</h3>
          <div className="grid grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto pr-2">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTopic(t)}
                className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between items-start gap-4 relative overflow-hidden ${
                  selectedTopic?.id === t.id
                    ? "bg-mathPurple-600/10 border-mathPurple-500 shadow-md shadow-mathPurple-500/5 scale-[1.01]"
                    : "bg-[#0c1220] border-slate-800 hover:border-slate-700 hover:bg-[#12192a]/50"
                }`}
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-mathPurple-500/5 rounded-full blur-lg" />
                <div>
                  <span className="text-[10px] text-mathPurple-400 font-bold uppercase tracking-wider block mb-1">
                    {t.area === "Arithmetic" ? "Aritmética" : t.area === "Algebra" ? "Álgebra" : t.area === "Geometry" ? "Geometría" : t.area === "Trigonometry" ? "Trigonometría" : t.area === "Calculus" ? "Cálculo" : "Estadística"}
                  </span>
                  <h4 className="font-bold text-white text-base">{t.name}</h4>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800/80">
                  <GraduationCap className="w-3.5 h-3.5 text-mathPurple-400" />
                  <span>
                    {t.level === "Primary"
                      ? "Primaria"
                      : t.level === "Secondary"
                      ? "Secundaria"
                      : "Universidad"}
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
                className="h-full min-h-[400px] bg-[#0c1220] border border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 shadow-xl"
              >
                <HelpCircle className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
                <h4 className="text-lg font-bold text-slate-300">Ningún tema seleccionado</h4>
                <p className="text-slate-500 text-sm max-w-sm mt-2">
                  Elige uno de los temas del listado para que el **TopicAgent** genere tu explicación matemática personalizada.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTopic.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[#0c1220] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between min-h-[500px]"
              >
                {loadingExplanation ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Loader2 className="w-10 h-10 text-mathPurple-500 animate-spin mb-4" />
                    <span className="text-sm font-semibold text-slate-400">
                      TopicAgent estructurando lección...
                    </span>
                    <span className="text-[11px] text-slate-500 max-w-xs mt-2">
                      Organizando analogías y fórmulas matemáticas para tu nivel de{" "}
                      {selectedTopic.level === "Primary"
                        ? "Primaria"
                        : selectedTopic.level === "Secondary"
                        ? "Secundaria"
                        : "Universidad"}.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed">
                      <MathRenderer text={explanation} />
                    </div>

                    <div className="border-t border-slate-800/80 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <span className="text-[11px] text-slate-500 block">¿Listo para resolver desafíos?</span>
                        <span className="text-xs font-bold text-mathPurple-400 block">5 ejercicios dinámicos te esperan</span>
                      </div>
                      <button
                        onClick={handleStartSession}
                        className="w-full sm:w-auto bg-gradient-to-r from-mathPurple-600 to-indigo-600 hover:from-mathPurple-500 hover:to-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-mathPurple-600/20 text-sm"
                      >
                        Iniciar Desafío
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
    </div>
  );
};
