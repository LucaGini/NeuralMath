import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import Navbar from "../components/Navbar";
import { 
  Users, 
  Settings, 
  Activity, 
  Search, 
  Lock, 
  History, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Database, 
  KeySquare, 
  RefreshCw, 
  UserCheck, 
  UserMinus,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// TypeScript interfaces
interface UserRow {
  id: number;
  name: string;
  email: string;
  level: string;
  xp_total: number;
  alby_xp: number;
  streak_days: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuditLogRow {
  id: number;
  admin_email: string;
  action: string;
  target_email?: string | null;
  details?: Record<string, any> | null;
  timestamp: string;
}

interface AgentConfigRow {
  agent_key: string;
  system_prompt: string;
  temperature: number;
  model_name: string;
  updated_at: string;
  history_count: number;
}

interface AgentHistoryRow {
  id: number;
  agent_key: string;
  system_prompt: string;
  temperature: number;
  model_name: string;
  admin_email: string;
  created_at: string;
}

interface TopicRow {
  id: number;
  name: string;
  area: string;
  level: string;
  subtopics: any;
  is_active: boolean;
}

interface TelemetryStats {
  total_users: number;
  total_sessions: number;
  agent_error_rate: number;
  dau_7_days: { date: string; count: number }[];
  top_topics: { topic_name: string; session_count: number }[];
}

export const AdminConsole: React.FC = () => {
  const { theme, language, showAlert, showConfirm } = useApp();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "curriculum" | "agents" | "audit">("stats");

  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // States for Telemetry
  const [stats, setStats] = useState<TelemetryStats | null>(null);

  // States for Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userLimit] = useState(10);

  // States for Curriculum
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("All");
  const [topicPage, setTopicPage] = useState(1);
  const [totalTopics, setTotalTopics] = useState(0);
  const [topicLimit] = useState(10);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<number | null>(null);
  const [topicFormName, setTopicFormName] = useState("");
  const [topicFormArea, setTopicFormArea] = useState("Algebra");
  const [topicFormLevel, setTopicFormLevel] = useState("Primary");
  const [topicFormSubtopics, setTopicFormSubtopics] = useState([
    { name: "", description: "" },
    { name: "", description: "" },
    { name: "", description: "" },
  ]);

  // States for Agent Settings
  const [agentConfigs, setAgentConfigs] = useState<AgentConfigRow[]>([]);
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("topic");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedTemperature, setEditedTemperature] = useState(0.7);
  const [editedModel, setEditedModel] = useState("gemini-2.0-flash");
  const [agentHistory, setAgentHistory] = useState<AgentHistoryRow[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);

  // States for Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [auditLimit] = useState(15);
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // Temp Password Modal
  const [tempPasswordUserEmail, setTempPasswordUserEmail] = useState("");
  const [generatedTempPassword, setGeneratedTempPassword] = useState("");
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);

  // Manual XP Edit Modal
  const [xpEditUser, setXpEditUser] = useState<UserRow | null>(null);
  const [xpChangeValue, setXpChangeValue] = useState<number>(0);
  const [showXpModal, setShowXpModal] = useState(false);
  const [savingXp, setSavingXp] = useState(false);

  // Fetch Telemetry Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: {
          page: userPage,
          limit: userLimit,
          q: q || undefined
        }
      });
      setUsers(res.data.users);
      setTotalUsers(res.data.total);
    } catch (err) {
      console.error("Error fetching users list:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Topics
  const fetchTopics = async () => {
    setTopicsLoading(true);
    try {
      const res = await api.get("/admin/topics", {
        params: {
          page: topicPage,
          limit: topicLimit,
          level: selectedLevelFilter !== "All" ? selectedLevelFilter : undefined
        }
      });
      setTopics(res.data.topics);
      setTotalTopics(res.data.total);
    } catch (err) {
      console.error("Error fetching curriculum topics:", err);
    } finally {
      setTopicsLoading(false);
    }
  };

  // Fetch Agent Configurations
  const fetchAgentConfigs = async () => {
    setAgentsLoading(true);
    try {
      const res = await api.get("/admin/agents/config");
      setAgentConfigs(res.data);
      const active = res.data.find((c: AgentConfigRow) => c.agent_key === selectedAgentKey);
      if (active) {
        setEditedPrompt(active.system_prompt);
        setEditedTemperature(active.temperature);
        setEditedModel(active.model_name);
      }
    } catch (err) {
      console.error("Error fetching agent configs:", err);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Fetch Agent History
  const fetchAgentHistory = async (key: string) => {
    try {
      const res = await api.get(`/admin/agents/config/${key}/history`);
      setAgentHistory(res.data);
    } catch (err) {
      console.error("Error fetching agent history:", err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("/admin/audit-logs", {
        params: {
          page: auditPage,
          limit: auditLimit,
          action: auditActionFilter || undefined
        }
      });
      setAuditLogs(res.data.logs);
      setTotalLogs(res.data.total);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Initialize data on mount and active tab change
  useEffect(() => {
    if (activeTab === "stats") fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "curriculum") fetchTopics();
    if (activeTab === "agents") fetchAgentConfigs();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, userPage, auditPage, auditActionFilter, topicPage, selectedLevelFilter]);

  // Handle Search Users
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers();
  };

  // Soft Deactivate User Action
  const handleDeactivate = (userId: number, email: string) => {
    showConfirm(
      language === "es"
        ? `¿Estás seguro de que deseas desactivar la cuenta del alumno (${email})? El alumno no podrá iniciar sesión pero se conservará todo su historial académico.`
        : `Are you sure you want to deactivate this student account (${email})? The student won't be able to log in, but all academic history will be preserved.`,
      async () => {
        try {
          await api.put(`/admin/users/${userId}/deactivate`);
          showAlert(language === "es" ? "Cuenta desactivada correctamente." : "Account deactivated successfully.");
          fetchUsers();
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Error al desactivar");
        }
      }
    );
  };

  // Reactivate User Action
  const handleReactivate = (userId: number, email: string) => {
    showConfirm(
      language === "es"
        ? `¿Deseas reactivar el acceso para el alumno (${email})?`
        : `Do you want to reactivate access for student (${email})?`,
      async () => {
        try {
          await api.put(`/admin/users/${userId}/reactivate`);
          showAlert(language === "es" ? "Cuenta reactivada correctamente." : "Account reactivated successfully.");
          fetchUsers();
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Error al reactivar");
        }
      }
    );
  };

  // Promote to Admin User Action
  const handleMakeAdmin = (userId: number, email: string) => {
    showConfirm(
      language === "es"
        ? `¿Deseas promover a Administrador al usuario (${email})? Esta acción otorga privilegios de edición completos sobre prompts y currícula.`
        : `Do you want to promote user (${email}) to Admin? This action grants full editing privileges over prompts and curricula.`,
      async () => {
        try {
          await api.put(`/admin/users/${userId}/make-admin`);
          showAlert(language === "es" ? "Usuario promovido a Administrador." : "User promoted to Admin.");
          fetchUsers();
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Error al promover");
        }
      }
    );
  };

  // Revoke Admin User Action
  const handleRemoveAdmin = (userId: number, email: string) => {
    showConfirm(
      language === "es"
        ? `¿Deseas revocar el rol de Administrador al usuario (${email})? Volverá a tener permisos estándar de Alumno.`
        : `Do you want to revoke Admin role from user (${email})? They will return to standard student permissions.`,
      async () => {
        try {
          await api.put(`/admin/users/${userId}/remove-admin`);
          showAlert(language === "es" ? "Rol de Administrador revocado correctamente." : "Admin role revoked successfully.");
          fetchUsers();
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Error al revocar");
        }
      }
    );
  };

  // Reset Password Action
  const handleResetPassword = (userId: number, email: string) => {
    showConfirm(
      language === "es"
        ? `¿Estás seguro de que deseas restablecer la contraseña de (${email})? Se generará una contraseña temporal de un solo uso.`
        : `Are you sure you want to reset the password for (${email})? A single-use temporary password will be generated.`,
      async () => {
        try {
          const res = await api.post(`/admin/users/${userId}/reset-password`);
          setTempPasswordUserEmail(email);
          setGeneratedTempPassword(res.data.temp_password);
          setShowTempPasswordModal(true);
          fetchUsers();
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Error al restablecer");
        }
      }
    );
  };

  // Manual XP Edit Action
  const openXpEdit = (user: UserRow) => {
    setXpEditUser(user);
    setXpChangeValue(0);
    setShowXpModal(true);
  };

  const handleSaveXpEdit = async () => {
    if (!xpEditUser) return;
    setSavingXp(true);
    try {
      await api.put(`/admin/users/${xpEditUser.id}/edit-xp`, {
        xp_change: xpChangeValue
      });
      showAlert(
        language === "es"
          ? "XP de usuario editada correctamente."
          : "User XP edited successfully."
      );
      setShowXpModal(false);
      fetchUsers();
    } catch (err: any) {
      showAlert(err.response?.data?.detail || "Error al editar XP");
    } finally {
      setSavingXp(false);
    }
  };

  // Toggle Topic Active Status Action
  const handleToggleTopic = async (topicId: number, currentStatus: boolean, name: string) => {
    try {
      const res = await api.put(`/admin/topics/${topicId}/toggle`);
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, is_active: res.data.is_active } : t));
    } catch (err: any) {
      showAlert(err.response?.data?.detail || "Error al cambiar estado del tema");
    }
  };

  const handleOpenCreateTopic = () => {
    setEditingTopic(null);
    setTopicFormName("");
    setTopicFormArea("Algebra");
    setTopicFormLevel("Primary");
    setTopicFormSubtopics([
      { name: "", description: "" },
      { name: "", description: "" },
      { name: "", description: "" },
    ]);
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (topic: TopicRow) => {
    setEditingTopic(topic);
    setTopicFormName(topic.name);
    setTopicFormArea(topic.area);
    setTopicFormLevel(topic.level);
    const filled = topic.subtopics || [];
    setTopicFormSubtopics([
      filled[0] || { name: "", description: "" },
      filled[1] || { name: "", description: "" },
      filled[2] || { name: "", description: "" },
    ]);
    setTopicModalOpen(true);
  };

  const handleSaveTopic = async () => {
    if (!topicFormName.trim()) return;
    const validSubtopics = topicFormSubtopics.filter(s => s.name.trim());
    setSavingTopic(true);
    try {
      if (editingTopic) {
        await api.put(`/admin/topics/${editingTopic.id}/edit`, {
          name: topicFormName,
          area: topicFormArea,
          level: topicFormLevel,
          subtopics: validSubtopics,
        });
      } else {
        await api.post("/admin/topics/create", {
          name: topicFormName,
          area: topicFormArea,
          level: topicFormLevel,
          subtopics: validSubtopics,
        });
      }
      setTopicModalOpen(false);
      fetchTopics();
    } catch (err) {
      console.error("Error saving topic:", err);
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = (topic: TopicRow) => {
    showConfirm(
      language === "es"
        ? `¿Eliminar permanentemente el tema "${topic.name}"? Esta acción no se puede deshacer.`
        : `Permanently delete "${topic.name}"? This cannot be undone.`,
      async () => {
        setDeletingTopicId(topic.id);
        try {
          await api.delete(`/admin/topics/${topic.id}`);
          fetchTopics();
        } catch (err) {
          console.error("Error deleting topic:", err);
        } finally {
          setDeletingTopicId(null);
        }
      }
    );
  };

  // Update selected agent prompt form
  const handleAgentSelect = (key: string) => {
    setSelectedAgentKey(key);
    const active = agentConfigs.find(c => c.agent_key === key);
    if (active) {
      setEditedPrompt(active.system_prompt);
      setEditedTemperature(active.temperature);
      setEditedModel(active.model_name);
    } else {
      setEditedPrompt("");
      setEditedTemperature(0.7);
      setEditedModel("gemini-2.0-flash");
    }
  };

  // Save Agent Configuration Action
  const handleSaveAgentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAgent(true);
    try {
      await api.put("/admin/agents/config", {
        agent_key: selectedAgentKey,
        system_prompt: editedPrompt,
        temperature: editedTemperature,
        model_name: editedModel
      });
      showAlert(
        language === "es"
          ? `Configuración de ${selectedAgentKey} guardada y versionada correctamente.`
          : `Configuration for ${selectedAgentKey} successfully saved and versioned.`
      );
      fetchAgentConfigs();
    } catch (err: any) {
      showAlert(err.response?.data?.detail || "Error al guardar configuración");
    } finally {
      setSavingAgent(false);
    }
  };

  // Open Version History Rollback Modal
  const handleOpenHistory = async () => {
    await fetchAgentHistory(selectedAgentKey);
    setShowHistoryModal(true);
  };

  // Restore previous version of agent config
  const handleRestoreVersion = async (historyId: number) => {
    showConfirm(
      language === "es"
        ? "¿Seguro que deseas restaurar esta versión histórica y sobrescribir la configuración del agente activo actual?"
        : "Are you sure you want to restore this historical version and overwrite the current active agent configuration?",
      async () => {
        try {
          await api.post("/admin/agents/config/restore", { history_id: historyId });
          showAlert(language === "es" ? "Versión restaurada con éxito." : "Version restored successfully.");
          setShowHistoryModal(false);
          fetchAgentConfigs();
        } catch (err: any) {
          showAlert(err.response?.data?.detail || "Error al restaurar");
        }
      }
    );
  };

  // Color dynamic rules for error rate indicators
  const getErrorRateBadgeClass = (rate: number) => {
    if (rate < 5) return "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400";
    if (rate < 15) return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
    return "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-paper-950 math-grid text-paper-700 dark:text-paper-100 pb-16 transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-500 mb-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>{language === "es" ? "Consola de Administración" : "Admin Panel Context"}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-paper-800 dark:text-white">
              NeuralMath Admin
            </h1>
            <p className="text-paper-500 dark:text-paper-400 text-xs md:text-sm">
              {language === "es"
                ? "Gestión global, monitoreo de errores LLM, versionado de prompts de IA y mantenimiento del alumnado."
                : "Global settings, error rate analysis, versioned agent prompts, and students directory."}
            </p>
          </div>
          
          {/* Refresh metrics button */}
          <button
            onClick={() => {
              if (activeTab === "stats") fetchStats();
              if (activeTab === "users") fetchUsers();
              if (activeTab === "curriculum") fetchTopics();
              if (activeTab === "agents") fetchAgentConfigs();
              if (activeTab === "audit") fetchAuditLogs();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 text-xs font-bold uppercase tracking-wider text-paper-600 dark:text-paper-400 transition-all self-start md:self-auto"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            {language === "es" ? "Actualizar Datos" : "Refresh Data"}
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex overflow-x-auto gap-2 bg-white dark:bg-paper-900 p-1.5 rounded-2xl border border-paper-250 dark:border-paper-800 mb-8 scrollbar-none">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "stats"
                ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                : "text-paper-550 hover:text-paper-800 dark:text-paper-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {language === "es" ? "Telemetría" : "Telemetry"}
          </button>
          
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                : "text-paper-550 hover:text-paper-800 dark:text-paper-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            {language === "es" ? "Alumnos" : "Students"}
          </button>
          
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "curriculum"
                ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                : "text-paper-550 hover:text-paper-800 dark:text-paper-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {language === "es" ? "Currícula" : "Curricula"}
          </button>

          <button
            onClick={() => setActiveTab("agents")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "agents"
                ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                : "text-paper-550 hover:text-paper-800 dark:text-paper-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60"
            }`}
          >
            <Settings className="w-4 h-4" />
            {language === "es" ? "Agentes de IA" : "AI Agents"}
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                : "text-paper-550 hover:text-paper-800 dark:text-paper-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-paper-800/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            {language === "es" ? "Actividad" : "Audit Trail"}
          </button>
        </div>

        {/* ==================== 1. TELEMETRY TAB ==================== */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            {statsLoading ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <>
                {/* Global KPIs cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 p-6 shadow-sm transition-all relative overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 block mb-1">
                      {language === "es" ? "Usuarios Registrados" : "Registered Users"}
                    </span>
                    <h3 className="text-4xl font-extrabold text-paper-800 dark:text-white">
                      {stats?.total_users || 0}
                    </h3>
                  </div>

                  <div className="bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 p-6 shadow-sm transition-all relative overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 block mb-1">
                      {language === "es" ? "Sesiones Completadas" : "Total Sessions Done"}
                    </span>
                    <h3 className="text-4xl font-extrabold text-paper-800 dark:text-white">
                      {stats?.total_sessions || 0}
                    </h3>
                  </div>

                  <div className={`bg-white dark:bg-paper-900 rounded-3xl border p-6 shadow-sm transition-all relative overflow-hidden ${
                    stats ? getErrorRateBadgeClass(stats.agent_error_rate).split(" ")[1] : "border-paper-250 dark:border-paper-800"
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 block mb-1">
                      {language === "es" ? "Tasa de Error de IA" : "AI Client Fallback Rate"}
                    </span>
                    <h3 className="text-4xl font-extrabold text-paper-800 dark:text-white">
                      {stats?.agent_error_rate || 0}%
                    </h3>
                    {stats && stats.agent_error_rate >= 15 && (
                      <div className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {language === "es" ? "Alto índice de fallbacks detectados" : "High rate of API errors detected"}
                      </div>
                    )}
                  </div>
                </div>

                {/* DAU graph & Popular topics section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* DAU Line Chart */}
                  <div className="lg:col-span-2 bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 block mb-4">
                      {language === "es" ? "Usuarios Activos Diarios (Últimos 7 Días)" : "Daily Active Users (Last 7 Days)"}
                    </span>
                    
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.dau_7_days || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#292524" : "#e7e5e4"} />
                          <XAxis 
                            dataKey="date" 
                            stroke={theme === "dark" ? "#78716c" : "#57534e"}
                            fontSize={11}
                          />
                          <YAxis 
                            allowDecimals={false}
                            stroke={theme === "dark" ? "#78716c" : "#57534e"}
                            fontSize={11}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === "dark" ? "#1c1917" : "#ffffff",
                              borderColor: theme === "dark" ? "#292524" : "#e7e5e4",
                              borderRadius: "12px",
                              color: theme === "dark" ? "#fafaf9" : "#1c1917"
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#f59e0b" 
                            strokeWidth={3} 
                            activeDot={{ r: 8 }} 
                            name="DAU"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top attempted topics */}
                  <div className="bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 block mb-4">
                      {language === "es" ? "Temas Más Practicados" : "Top 5 Attempted Topics"}
                    </span>

                    <div className="space-y-4">
                      {stats?.top_topics && stats.top_topics.length > 0 ? (
                        stats.top_topics.map((t, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-paper-50 dark:bg-paper-950 border border-paper-200 dark:border-paper-850"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-black text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-paper-700 dark:text-paper-200 truncate max-w-[150px]">
                                {t.topic_name}
                              </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-paper-400">
                              {t.session_count} {language === "es" ? "sesiones" : "sessions"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-paper-400 py-12">
                          {language === "es" ? "Aún no hay datos de uso en este MVP" : "No usage data logged in the database yet"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== 2. STUDENTS TAB ==================== */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 shadow-sm p-6 overflow-hidden">
            
            {/* Search Bar */}
            <form onSubmit={handleUserSearch} className="flex gap-2 max-w-md mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-400" />
                <input
                  type="text"
                  placeholder={language === "es" ? "Buscar por nombre o correo..." : "Search name or email..."}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-all text-paper-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl shadow-sm transition-all"
              >
                {language === "es" ? "Buscar" : "Search"}
              </button>
            </form>

            {/* Users Table */}
            {usersLoading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-paper-200 dark:border-paper-800 text-[10px] font-black uppercase tracking-widest text-paper-400">
                      <th className="pb-4 pl-2">ID</th>
                      <th className="pb-4">{language === "es" ? "Nombre / Correo" : "Name / Email"}</th>
                      <th className="pb-4">{language === "es" ? "Nivel" : "Level"}</th>
                      <th className="pb-4">XP Total</th>
                      <th className="pb-4">Alby XP</th>
                      <th className="pb-4">Streak</th>
                      <th className="pb-4">Rol</th>
                      <th className="pb-4">Estado</th>
                      <th className="pb-4 text-right pr-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <tr 
                          key={user.id} 
                          className="border-b border-paper-100 dark:border-paper-850 hover:bg-paper-50/40 dark:hover:bg-paper-900/20 text-xs transition-colors"
                        >
                          <td className="py-4 pl-2 font-bold text-paper-400">{user.id}</td>
                          <td className="py-4">
                            <div>
                              <div className="font-extrabold text-paper-800 dark:text-white">{user.name}</div>
                              <div className="text-[10px] text-paper-400 dark:text-paper-500 font-semibold">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-4 font-semibold">
                            <span className="px-2.5 py-1 rounded-lg bg-paper-100 dark:bg-paper-800 text-paper-600 dark:text-paper-300 border border-paper-200 dark:border-paper-750 font-black text-[9px] uppercase tracking-wider">
                              {user.level}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-paper-700 dark:text-paper-350">{user.xp_total} XP</td>
                          <td className="py-4 font-bold text-primary-600 dark:text-primary-400">{user.alby_xp} XP</td>
                          <td className="py-4 font-bold text-primary-600 dark:text-primary-400">🔥 {user.streak_days}</td>
                          <td className="py-4">
                            {user.is_admin ? (
                              <span className="px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/25 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest">
                                Admin
                              </span>
                            ) : (
                              <span className="text-[10px] text-paper-400 font-bold uppercase tracking-wider">
                                {language === "es" ? "Alumno" : "Student"}
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            {user.is_active ? (
                              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-wider">
                                {language === "es" ? "Activo" : "Active"}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-650 dark:text-red-400 text-[9px] font-black uppercase tracking-wider">
                                {language === "es" ? "Inactivo" : "Inactive"}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit XP */}
                              <button
                                onClick={() => openXpEdit(user)}
                                className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 text-paper-500 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                title="Ajustar XP manualmente"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => handleResetPassword(user.id, user.email)}
                                className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 text-paper-500 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                title={language === "es" ? "Restablecer contraseña" : "Reset Password"}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              {/* Promover / Revocar Admin */}
                              {user.is_admin ? (
                                user.email !== "admin@neuralmath.edu" && (
                                  <button
                                    onClick={() => handleRemoveAdmin(user.id, user.email)}
                                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 text-paper-500 dark:text-paper-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                    title={language === "es" ? "Quitar rol Admin" : "Revoke Admin Role"}
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => handleMakeAdmin(user.id, user.email)}
                                  className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 text-paper-500 dark:text-paper-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                  title={language === "es" ? "Promover a Admin" : "Make Admin"}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Toggle active state (solo para no-admins) */}
                              {!user.is_admin && (
                                user.is_active ? (
                                  <button
                                    onClick={() => handleDeactivate(user.id, user.email)}
                                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-red-500/10 hover:border-red-500/20 text-paper-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                    title={language === "es" ? "Desactivar usuario" : "Deactivate user"}
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivate(user.id, user.email)}
                                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-green-500/10 hover:border-green-500/20 text-paper-400 hover:text-green-500 dark:hover:text-green-400 transition-all"
                                    title={language === "es" ? "Reactivar usuario" : "Reactivate user"}
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-xs text-paper-400 font-semibold">
                          {language === "es" ? "No se encontraron alumnos registrados" : "No registered students found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalUsers > userLimit && (
              <div className="flex items-center justify-between border-t border-paper-200 dark:border-paper-800 pt-4 mt-6">
                <span className="text-[10px] text-paper-400 font-bold uppercase tracking-wider">
                  {language === "es"
                    ? `Mostrando ${users.length} de ${totalUsers} alumnos`
                    : `Showing ${users.length} of ${totalUsers} students`}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black px-2">{userPage}</span>
                  <button
                    onClick={() => setUserPage(p => ((p * userLimit) < totalUsers ? p + 1 : p))}
                    disabled={userPage * userLimit >= totalUsers}
                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. CURRICULA TAB ==================== */}
        {activeTab === "curriculum" && (
          <div className="bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 shadow-sm p-6">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-paper-800 dark:text-white">
                {language === "es" ? "Currícula" : "Curriculum"}
              </h3>
              <button
                onClick={handleOpenCreateTopic}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary-600/20"
              >
                <span>+</span>
                {language === "es" ? "Nuevo Tema" : "New Topic"}
              </button>
            </div>

            {/* Filter by academic level */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {["All", "Primary", "Secondary", "University"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => { setSelectedLevelFilter(lvl); setTopicPage(1); }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedLevelFilter === lvl
                      ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                      : "bg-paper-50 dark:bg-paper-950 border border-paper-200 dark:border-paper-850 text-paper-550 hover:text-paper-800 dark:text-paper-400 dark:hover:text-white"
                  }`}
                >
                  {lvl === "All" ? (language === "es" ? "Todos los niveles" : "All levels") : lvl}
                </button>
              ))}
            </div>

            {/* Topics list */}
            {topicsLoading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-paper-200 dark:border-paper-800 text-[10px] font-black uppercase tracking-widest text-paper-400">
                      <th className="pb-4 pl-2">ID</th>
                      <th className="pb-4">{language === "es" ? "Tema" : "Topic"}</th>
                      <th className="pb-4">Área</th>
                      <th className="pb-4">Nivel Académico</th>
                      <th className="pb-4">Conceptos Asociados</th>
                      <th className="pb-4">Visibilidad Alumno</th>
                      <th className="pb-4 text-right pr-2">{language === "es" ? "Editar" : "Edit"}</th>
                      <th className="pb-4 text-right pr-2">Acción Rápida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics && topics.length > 0 ? (
                      topics.map((topic) => (
                        <tr 
                          key={topic.id} 
                          className="border-b border-paper-100 dark:border-paper-850 hover:bg-paper-50/40 dark:hover:bg-paper-900/20 text-xs transition-colors"
                        >
                          <td className="py-4 pl-2 font-bold text-paper-400">{topic.id}</td>
                          <td className="py-4 font-extrabold text-paper-800 dark:text-white">
                            {topic.name}
                          </td>
                          <td className="py-4 font-bold text-paper-550 dark:text-paper-400">
                            {topic.area}
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/25 text-[9px] font-black uppercase tracking-widest">
                              {topic.level}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {topic.subtopics && Array.isArray(topic.subtopics) ? (
                                topic.subtopics.slice(0, 3).map((st: any, sIdx: number) => (
                                  <span 
                                    key={sIdx}
                                    className="px-1.5 py-0.5 bg-paper-100 dark:bg-paper-800 text-paper-600 dark:text-paper-400 border border-paper-200 dark:border-paper-750 text-[8px] font-semibold rounded"
                                  >
                                    {st.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-paper-400 font-semibold italic">Standard</span>
                              )}
                              {topic.subtopics && topic.subtopics.length > 3 && (
                                <span className="text-[8px] text-paper-400 font-bold self-center">
                                  +{topic.subtopics.length - 3} más
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 font-semibold">
                            {topic.is_active ? (
                              <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-wider">
                                {language === "es" ? "Habilitado" : "Enabled"}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-650 dark:text-red-400 text-[9px] font-black uppercase tracking-wider">
                                {language === "es" ? "Oculto" : "Disabled"}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex justify-end gap-1.5">
                              {/* Editar */}
                              <button
                                onClick={() => handleOpenEditTopic(topic)}
                                className="px-3 py-1.5 rounded-lg border border-paper-300 dark:border-paper-700 text-xs font-bold text-paper-600 dark:text-paper-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                              >
                                {language === "es" ? "Editar" : "Edit"}
                              </button>

                              {/* Eliminar */}
                              <button
                                onClick={() => handleDeleteTopic(topic)}
                                disabled={deletingTopicId === topic.id}
                                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-xs font-bold text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                              >
                                {deletingTopicId === topic.id ? "..." : (language === "es" ? "Eliminar" : "Delete")}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <button
                              onClick={() => handleToggleTopic(topic.id, topic.is_active, topic.name)}
                              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                topic.is_active 
                                  ? "bg-paper-100 dark:bg-paper-800 text-paper-600 dark:text-paper-400 hover:bg-red-500/10 hover:text-red-500" 
                                  : "bg-green-500 text-white shadow-sm hover:bg-green-400"
                              }`}
                            >
                              {topic.is_active ? (language === "es" ? "Desactivar" : "Disable") : (language === "es" ? "Activar" : "Enable")}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-paper-400 font-semibold">
                          {language === "es" ? "No se encontraron temas en la currícula" : "No curriculum topics registered in DB"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Curriculum Pagination Controls */}
            {totalTopics > topicLimit && (
              <div className="flex items-center justify-between border-t border-paper-200 dark:border-paper-800 pt-4 mt-6">
                <span className="text-[10px] text-paper-400 font-bold uppercase tracking-wider">
                  {language === "es"
                    ? `Mostrando ${topics.length} de ${totalTopics} temas`
                    : `Showing ${topics.length} of ${totalTopics} topics`}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTopicPage(p => Math.max(1, p - 1))}
                    disabled={topicPage === 1}
                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black px-2">{topicPage}</span>
                  <button
                    onClick={() => setTopicPage(p => ((p * topicLimit) < totalTopics ? p + 1 : p))}
                    disabled={topicPage * topicLimit >= totalTopics}
                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. AI AGENTS TAB ==================== */}
        {activeTab === "agents" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left sidebar: list of agents */}
            <div className="lg:col-span-1 bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 shadow-sm p-4 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-paper-400 block px-2 mb-2">
                {language === "es" ? "Orquesta de Agentes" : "Select Agent"}
              </span>

              {agentConfigs.map((agent) => (
                <button
                  key={agent.agent_key}
                  onClick={() => handleAgentSelect(agent.agent_key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                    selectedAgentKey === agent.agent_key
                      ? "bg-primary-600 dark:bg-primary-500 text-white shadow-sm"
                      : "text-paper-600 hover:text-paper-850 dark:text-paper-400 dark:hover:text-white hover:bg-paper-50 dark:hover:bg-paper-950/60"
                  }`}
                >
                  <span className="capitalize">{agent.agent_key}Agent</span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded transition-all ${
                    selectedAgentKey === agent.agent_key
                      ? "bg-white/20 text-white"
                      : "bg-paper-100 dark:bg-paper-800 text-paper-500 dark:text-paper-400"
                  }`}>
                    {agent.history_count} v
                  </span>
                </button>
              ))}
            </div>

            {/* Right content: Agent prompt settings form */}
            <div className="lg:col-span-3 bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 shadow-sm p-6">
              
              {agentsLoading ? (
                <div className="min-h-[350px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <form onSubmit={handleSaveAgentConfig} className="space-y-6">
                  {/* Title & History button */}
                  <div className="flex items-center justify-between border-b border-paper-100 dark:border-paper-850 pb-4">
                    <div>
                      <h3 className="text-sm font-extrabold capitalize text-paper-800 dark:text-white">
                        Configuración de {selectedAgentKey}Agent
                      </h3>
                      <p className="text-[11px] text-paper-400 dark:text-paper-500">
                        {language === "es" 
                          ? "Edita las variables y directivas de comportamiento del modelo" 
                          : "Modify model variables and system guidelines"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenHistory}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 text-[10px] font-black uppercase tracking-widest text-paper-600 dark:text-paper-400 transition-all"
                    >
                      <History className="w-3.5 h-3.5 text-primary-500" />
                      {language === "es" ? "Historial" : "Version Logs"}
                    </button>
                  </div>

                  {/* Provider Model & Temperature */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 mb-2">
                        {language === "es" ? "Modelo LLM Activo" : "Active AI Model"}
                      </label>
                      <select
                        value={editedModel}
                        onChange={(e) => setEditedModel(e.target.value)}
                        className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all text-paper-700 dark:text-paper-350"
                      >
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recomendado)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 mb-2">
                        {language === "es" ? `Temperatura (${editedTemperature})` : `Temperature (${editedTemperature})`}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.1"
                        value={editedTemperature}
                        onChange={(e) => setEditedTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-paper-150 dark:bg-paper-850 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-primary-500 focus:outline-none py-2"
                      />
                      <div className="flex justify-between text-[8px] text-paper-450 dark:text-paper-500 font-bold uppercase tracking-wider mt-1">
                        <span>Preciso (0.0)</span>
                        <span>Creativo (1.5)</span>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Textarea */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400 mb-2">
                      System Prompt / Instrucciones Base
                    </label>
                    <textarea
                      rows={12}
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      placeholder="Escribe el system prompt aquí..."
                      className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-primary-500 transition-all text-paper-800 dark:text-paper-100 font-mono leading-relaxed"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingAgent}
                      className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      {savingAgent ? (language === "es" ? "Guardando..." : "Saving...") : (language === "es" ? "Guardar y Versionar" : "Save & Create Version")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ==================== 5. AUDIT LOGS TAB ==================== */}
        {activeTab === "audit" && (
          <div className="bg-white dark:bg-paper-900 rounded-3xl border border-paper-250 dark:border-paper-800 shadow-sm p-6">
            
            {/* Filter by Action */}
            <div className="flex items-center gap-4 mb-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-paper-400 mb-1.5">
                  Filtrar por Acción
                </label>
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all text-paper-700 dark:text-paper-350"
                >
                  <option value="">Todas las acciones</option>
                  <option value="DEACTIVATE_USER">Desactivar Alumno</option>
                  <option value="REACTIVATE_USER">Reactivar Alumno</option>
                  <option value="MAKE_ADMIN">Promover a Admin</option>
                  <option value="RESET_PASSWORD">Restablecer Clave</option>
                  <option value="MANUAL_XP_EDIT">Editar XP</option>
                  <option value="TOGGLE_TOPIC">Toggle Tema</option>
                  <option value="UPDATE_AGENT_CONFIG">Actualizar Agente</option>
                  <option value="RESTORE_AGENT_CONFIG">Restaurar Agente</option>
                </select>
              </div>
            </div>

            {/* Audit Table */}
            {auditLoading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-paper-200 dark:border-paper-800 text-[10px] font-black uppercase tracking-widest text-paper-400">
                      <th className="pb-4 pl-2">Timestamp</th>
                      <th className="pb-4">Administrador</th>
                      <th className="pb-4">Acción Realizada</th>
                      <th className="pb-4">Afectado (Usuario)</th>
                      <th className="pb-4 pr-2">Detalles del Suceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs && auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr 
                          key={log.id} 
                          className="border-b border-paper-100 dark:border-paper-850 hover:bg-paper-50/40 dark:hover:bg-paper-900/20 text-xs transition-colors"
                        >
                          <td className="py-4 pl-2 font-bold text-paper-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 font-bold text-paper-700 dark:text-paper-300">
                            {log.admin_email}
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded bg-paper-100 dark:bg-paper-800 text-paper-600 dark:text-paper-400 text-[9px] font-black uppercase tracking-widest border border-paper-200/50 dark:border-paper-800/80">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 font-semibold text-paper-600 dark:text-paper-400">
                            {log.target_email || "-"}
                          </td>
                          <td className="py-4 pr-2">
                            <pre className="text-[10px] font-mono text-paper-500 dark:text-paper-400 bg-paper-50 dark:bg-paper-950 p-2 rounded-lg border border-paper-250/40 dark:border-paper-850/50 overflow-x-auto max-w-sm scrollbar-none">
                              {JSON.stringify(log.details)}
                            </pre>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-paper-400 font-semibold">
                          {language === "es" ? "No se registraron logs de auditoría en la BD" : "No admin audit logs registered in DB"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalLogs > auditLimit && (
              <div className="flex items-center justify-between border-t border-paper-200 dark:border-paper-800 pt-4 mt-6">
                <span className="text-[10px] text-paper-400 font-bold uppercase tracking-wider">
                  {language === "es"
                    ? `Mostrando ${auditLogs.length} de ${totalLogs} registros`
                    : `Showing ${auditLogs.length} of ${totalLogs} entries`}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                    disabled={auditPage === 1}
                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black px-2">{auditPage}</span>
                  <button
                    onClick={() => setAuditPage(p => ((p * auditLimit) < totalLogs ? p + 1 : p))}
                    disabled={auditPage * auditLimit >= totalLogs}
                    className="p-1.5 rounded-lg border border-paper-250 dark:border-paper-800 hover:bg-paper-100 dark:hover:bg-paper-800 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODAL: TEMPORARY PASSWORD VIEW ==================== */}
      {showTempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-primary-500/10 border border-primary-500/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner">
                <KeySquare className="w-7 h-7" />
              </div>
 
              <div className="space-y-2 w-full">
                <h4 className="font-extrabold text-paper-800 dark:text-white text-base">
                  {language === "es" ? "Nueva Contraseña Temporal" : "New Temporary Password"}
                </h4>
                <p className="text-paper-600 dark:text-paper-400 text-xs font-medium leading-relaxed">
                  {language === "es"
                    ? `La contraseña para el alumno (${tempPasswordUserEmail}) ha sido restablecida. Proporciona esta clave única para que pueda iniciar sesión. Deberá cambiarla posteriormente en su perfil.`
                    : `Password for student (${tempPasswordUserEmail}) successfully reset. Copy this credentials block so they can sign in. They must rotate it from their profile afterwards.`}
                </p>
 
                {/* Password display container */}
                <div className="bg-paper-50 dark:bg-paper-950 p-4 rounded-xl border border-paper-250 dark:border-paper-800 select-all font-mono text-base font-black tracking-widest text-primary-750 dark:text-primary-450 shadow-inner mt-4">
                  {generatedTempPassword}
                </div>
              </div>
 
              <button
                onClick={() => setShowTempPasswordModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-sm mt-6"
              >
                {language === "es" ? "Entendido y Copiado" : "Understood & Copied"}
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ==================== MODAL: MANUAL XP ADJUSTMENT ==================== */}
      {showXpModal && xpEditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 rounded-3xl p-6 shadow-xl relative">
            <h3 className="text-base font-bold text-paper-800 dark:text-white mb-2 flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary-500" />
              {language === "es" ? "Ajustar Puntos XP" : "Adjust XP Points"}
            </h3>
            <p className="text-xs text-paper-400 dark:text-paper-500 mb-4 leading-relaxed">
              {language === "es"
                ? `Edita los puntos del alumno (${xpEditUser.email}). Ingresa un valor positivo para añadir o un valor negativo para restar.`
                : `Edit XP details for student (${xpEditUser.email}). Type a positive value to add or negative to subtract.`}
            </p>
 
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-paper-400 mb-1">
                  XP Actual
                </label>
                <div className="text-sm font-bold text-paper-700 dark:text-paper-300">
                  {xpEditUser.xp_total} XP
                </div>
              </div>
 
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-paper-400 mb-1.5">
                  Variación de XP
                </label>
                <input
                  type="number"
                  value={xpChangeValue}
                  onChange={(e) => setXpChangeValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-primary-500 transition-all text-paper-800 dark:text-white"
                  placeholder="e.g. +100 o -50"
                  required
                />
              </div>
 
              <div className="flex gap-3 pt-4 border-t border-paper-100 dark:border-paper-850">
                <button
                  onClick={() => setShowXpModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-paper-250 dark:border-paper-800 text-paper-500 dark:text-paper-400 hover:bg-paper-100 dark:hover:bg-paper-800 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  onClick={handleSaveXpEdit}
                  disabled={savingXp}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  {savingXp ? "..." : (language === "es" ? "Guardar" : "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: VERSION HISTORY ROLLBACK ==================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col max-h-[85vh]">
            
            <h3 className="text-base font-bold text-paper-800 dark:text-white mb-1 flex items-center gap-2 border-b border-paper-100 dark:border-paper-850 pb-3">
              <History className="w-5 h-5 text-primary-500" />
              {language === "es" 
                ? `Historial de Versiones: ${selectedAgentKey}Agent` 
                : `Version History Trail: ${selectedAgentKey}Agent`}
            </h3>

            <div className="overflow-y-auto my-4 pr-1 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-paper-200 dark:border-paper-800 text-[10px] font-black uppercase tracking-widest text-paper-400">
                    <th className="pb-3 pl-2">Fecha</th>
                    <th className="pb-3">Administrador</th>
                    <th className="pb-3">Modelo / Temp</th>
                    <th className="pb-3">System Prompt (Directiva)</th>
                    <th className="pb-3 text-right pr-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {agentHistory && agentHistory.length > 0 ? (
                    agentHistory.map((hist) => (
                      <tr 
                        key={hist.id} 
                        className="border-b border-paper-100 dark:border-paper-850 hover:bg-paper-50/40 dark:hover:bg-paper-900/20 text-[11px] transition-colors"
                      >
                        <td className="py-4 pl-2 font-bold text-paper-400 whitespace-nowrap">
                          {new Date(hist.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 font-bold text-paper-700 dark:text-paper-350 whitespace-nowrap">
                          {hist.admin_email}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <div>
                            <span className="font-bold">{hist.model_name}</span>
                            <span className="text-[10px] text-paper-400 block">t = {hist.temperature}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="max-w-xs md:max-w-md truncate font-mono text-[10px] bg-paper-50 dark:bg-paper-950/20 p-2 border border-paper-250 dark:border-paper-800 rounded-lg">
                            {hist.system_prompt}
                          </div>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => handleRestoreVersion(hist.id)}
                            className="bg-primary-600 hover:bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
                          >
                            {language === "es" ? "Restaurar" : "Restore"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-paper-400 font-semibold text-xs">
                        {language === "es" ? "No hay registros previos en la bitácora histórica" : "No previous configurations recorded in history log"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-paper-100 dark:border-paper-850 pt-3">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="py-3 px-5 rounded-xl border border-paper-250 dark:border-paper-800 text-paper-600 dark:text-paper-400 hover:bg-paper-100 dark:hover:bg-paper-800 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE / EDIT TOPIC ==================== */}
      <AnimatePresence>
        {topicModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <h3 className="text-base font-bold text-paper-800 dark:text-white mb-2">
                {editingTopic === null
                  ? (language === "es" ? "Nuevo Tema" : "New Topic")
                  : (language === "es" ? `Editar Tema: ${editingTopic.name}` : `Edit Topic: ${editingTopic.name}`)}
              </h3>
              
              {/* Scrollable form body */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 my-2 scrollbar-none">
                {/* Nombre del tema */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-paper-400 mb-1">
                    {language === "es" ? "Nombre del tema *" : "Topic Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={topicFormName}
                    onChange={(e) => setTopicFormName(e.target.value)}
                    placeholder={language === "es" ? "Ej. Ecuaciones Lineales" : "e.g. Linear Equations"}
                    className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all text-paper-800 dark:text-white"
                  />
                </div>

                {/* Area and Level Selects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-paper-400 mb-1">
                      {language === "es" ? "Área" : "Area"}
                    </label>
                    <select
                      value={topicFormArea}
                      onChange={(e) => setTopicFormArea(e.target.value)}
                      className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all text-paper-700 dark:text-paper-350"
                    >
                      {["Arithmetic", "Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics"].map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-paper-400 mb-1">
                      {language === "es" ? "Nivel" : "Level"}
                    </label>
                    <select
                      value={topicFormLevel}
                      onChange={(e) => setTopicFormLevel(e.target.value)}
                      className="w-full bg-paper-50 dark:bg-paper-950 border border-paper-250 dark:border-paper-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-all text-paper-700 dark:text-paper-350"
                    >
                      {["Primary", "Secondary", "University"].map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subtopics Section */}
                <div className="space-y-3 pt-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-paper-500 dark:text-paper-400">
                    {language === "es" ? "Subtemas (1 a 3 recomendados)" : "Subtopics (1 to 3 recommended)"}
                  </span>
                  
                  {topicFormSubtopics.map((subtopic, index) => (
                    <div key={index} className="p-3 rounded-2xl bg-paper-50 dark:bg-paper-950 border border-paper-200 dark:border-paper-850 space-y-2">
                      <span className="block text-[9px] font-bold text-primary-500 uppercase tracking-wider">
                        {language === "es" ? `Subtema ${index + 1}` : `Subtopic ${index + 1}`}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={language === "es" ? "Nombre" : "Name"}
                          value={subtopic.name}
                          onChange={(e) => {
                            const newSub = [...topicFormSubtopics];
                            newSub[index].name = e.target.value;
                            setTopicFormSubtopics(newSub);
                          }}
                          className="w-full bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary-500 transition-all text-paper-800 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder={language === "es" ? "Descripción" : "Description"}
                          value={subtopic.description}
                          onChange={(e) => {
                            const newSub = [...topicFormSubtopics];
                            newSub[index].description = e.target.value;
                            setTopicFormSubtopics(newSub);
                          }}
                          className="w-full bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary-500 transition-all text-paper-800 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-paper-100 dark:border-paper-850 mt-2">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-paper-250 dark:border-paper-800 text-paper-500 dark:text-paper-400 hover:bg-paper-100 dark:hover:bg-paper-800 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {language === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTopic}
                  disabled={savingTopic || !topicFormName.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
                >
                  {savingTopic
                    ? (language === "es" ? "Guardando..." : "Saving...")
                    : (language === "es" ? "Guardar" : "Save")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminConsole;
