import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../services/AppContext";
import { Navbar } from "../components/Navbar";
import { User, Mail, Lock, Save, Eye, EyeOff, Sparkles, ShieldCheck, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export const Profile: React.FC = () => {
  const { language, showAlert, t } = useApp();
  const navigate = useNavigate();

  // Profile fields state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("Primary");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Input states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setName(res.data.name);
        setEmail(res.data.email);
        setLevel(res.data.level || "Primary");
      } catch (err: any) {
        setError(
          language === "es"
            ? "No se pudieron obtener los detalles del perfil."
            : "Could not retrieve profile details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [language]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(language === "es" ? "El nombre completo es requerido." : "Full name is required.");
      return;
    }

    // Password validation if they entered something
    if (password.trim()) {
      if (password.length < 6) {
        setError(
          language === "es"
            ? "La contraseña debe tener al menos 6 caracteres."
            : "Password must be at least 6 characters long."
        );
        return;
      }
      if (password !== confirmPassword) {
        setError(
          language === "es"
            ? "Las contraseñas no coinciden."
            : "Passwords do not match."
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = { name, level };
      if (password.trim()) {
        payload.password = password;
      }

      await api.put("/auth/me", payload);

      // Reset password fields
      setPassword("");
      setConfirmPassword("");

      showAlert(
        language === "es"
          ? "¡Perfil actualizado con éxito! Los cambios se han guardado correctamente en tu cuenta."
          : "Profile updated successfully! The changes have been saved to your account."
      );
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          (language === "es"
            ? "Hubo un error al actualizar el perfil. Inténtalo de nuevo."
            : "An error occurred while updating your profile. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  const levelOptions = [
    { id: "Primary", labelEs: "Primaria", labelEn: "Primary", emoji: "🎒", descEs: "Temas y ejercicios iniciales", descEn: "Basic math & initial topics", color: "from-emerald-500/10 to-teal-500/10 border-emerald-550/20 text-emerald-600 dark:text-emerald-450 hover:border-emerald-500/40" },
    { id: "Secondary", labelEs: "Secundaria", labelEn: "Secondary", emoji: "📐", descEs: "Álgebra, geometría y ecuaciones", descEn: "Algebra, geometry & equations", color: "from-primary-500/10 to-amber-500/10 border-primary-500/20 text-primary-600 dark:text-primary-450 hover:border-primary-500/40" },
    { id: "University", labelEs: "Universidad", labelEn: "University", emoji: "🎓", descEs: "Cálculo y álgebra lineal avanzada", descEn: "Advanced calculus & linear algebra", color: "from-chalk-500/10 to-chalk-600/10 border-chalk-550/20 text-chalk-600 dark:text-chalk-400 hover:border-chalk-500/40" }
  ];

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-paper-950 math-grid text-paper-700 dark:text-paper-100 transition-colors duration-200">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-12 relative">
        {/* Background ambient glows removed */}

        {/* Section Header */}
        <div className="mb-10 text-center md:text-left relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center md:justify-start gap-2.5 mb-2"
          >
            <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 shadow-inner">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
              {language === "es" ? "Ajustes de Cuenta" : "Account Settings"}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-extrabold tracking-tight"
          >
            {language === "es" ? "Tu Perfil Matemático" : "Your Mathematical Profile"}
          </motion.h1>
          <p className="text-paper-500 dark:text-paper-400 mt-2 text-sm">
            {language === "es" 
              ? "Personaliza tus datos y cambia tu nivel para adaptar las lecciones a tu medida." 
              : "Customize your details and change your level to tailor lessons to your needs."}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-paper-500 dark:text-paper-400">
              {t.loading}
            </p>
          </div>
        ) : (
          <motion.form 
            onSubmit={handleSaveProfile}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-paper-900 border border-paper-250 dark:border-paper-800 p-8 rounded-3xl shadow-sm dark:shadow-2xl space-y-8 relative z-10"
          >
            {/* Header profile status */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-paper-50 dark:bg-paper-950/40 border border-paper-200 dark:border-paper-800/60">
              <div className="w-14 h-14 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner">
                {name.trim() ? name.substring(0, 2).toUpperCase() : "NM"}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-paper-800 dark:text-white leading-tight">
                  {name || (language === "es" ? "Estudiante" : "Student")}
                </h4>
                <p className="text-xs text-paper-500 dark:text-paper-400 mt-0.5">
                  {email}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 px-3 py-1 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activo</span>
              </div>
            </div>

            {/* Error Message banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold rounded-2xl flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Personal Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-paper-600 dark:text-paper-455 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-500" />
                  <span>{language === "es" ? "Nombre Completo" : "Full Name"}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-paper-50 dark:bg-paper-950/60 border border-paper-250 dark:border-paper-800 rounded-2xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all dark:text-white"
                    placeholder={language === "es" ? "Ingresa tu nombre..." : "Enter your full name..."}
                    required
                  />
                </div>
              </div>

              {/* Email Input (Read only) */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-paper-600 dark:text-paper-455 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-paper-400" />
                  <span>{language === "es" ? "Correo Electrónico" : "Email Address"}</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-paper-100 dark:bg-paper-950/30 border border-paper-250 dark:border-paper-800/40 rounded-2xl px-4 py-3.5 text-sm font-semibold text-paper-450 dark:text-paper-500 cursor-not-allowed select-none focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Academic Level Picker Section */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-paper-600 dark:text-paper-455 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                <span>{language === "es" ? "Nivel Académico" : "Academic Level"}</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {levelOptions.map((opt) => {
                  const isSelected = level.toLowerCase() === opt.id.toLowerCase();
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setLevel(opt.id)}
                      className={`cursor-pointer p-4 rounded-2xl border bg-paper-50/45 dark:bg-paper-950/20 text-center md:text-left flex flex-col items-center md:items-start space-y-2 select-none transition-all duration-300 ${opt.color} ${
                        isSelected 
                          ? "ring-2 ring-primary-500 border-primary-500 bg-primary-500/5 shadow-md shadow-primary-550/5 dark:bg-primary-500/10" 
                          : "opacity-75 hover:opacity-100 hover:scale-[1.02]"
                      }`}
                    >
                      <div className="text-2xl">{opt.emoji}</div>
                      <div>
                        <h5 className="font-extrabold text-sm dark:text-white leading-tight">
                          {language === "es" ? opt.labelEs : opt.labelEn}
                        </h5>
                        <p className="text-[10px] text-paper-450 dark:text-paper-500 mt-1 leading-snug">
                          {language === "es" ? opt.descEs : opt.descEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password Management Divider */}
            <div className="h-px bg-paper-150 dark:bg-paper-800/60" />

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-primary-500" />
                    <span>{language === "es" ? "Cambiar Contraseña" : "Change Password"}</span>
                  </h4>
                  <p className="text-[10px] text-paper-500 dark:text-paper-400 mt-0.5">
                    {language === "es" 
                      ? "Completa estos campos únicamente si deseas actualizar tu contraseña." 
                      : "Fill these fields only if you wish to update your password."}
                  </p>
                </div>

                {email === "estudiante@neuralmath.edu" && (
                  <div className="p-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[10px] font-bold max-w-xs md:max-w-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                    <span>
                      {language === "es"
                        ? "Bloqueado en demo pública"
                        : "Locked for public demo"}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* New Password */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-paper-600 dark:text-paper-455">
                    {language === "es" ? "Nueva Contraseña" : "New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={email === "estudiante@neuralmath.edu"}
                      className={`w-full bg-paper-50 dark:bg-paper-950/60 border border-paper-250 dark:border-paper-800 rounded-2xl pl-4 pr-11 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all dark:text-white ${
                        email === "estudiante@neuralmath.edu" ? "cursor-not-allowed opacity-60" : ""
                      }`}
                      placeholder={
                        email === "estudiante@neuralmath.edu"
                          ? (language === "es" ? "Acceso denegado en demo" : "Access denied in demo")
                          : (language === "es" ? "Mínimo 6 caracteres..." : "Minimum 6 characters...")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={email === "estudiante@neuralmath.edu"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-paper-400 hover:text-paper-600 dark:hover:text-white p-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-paper-600 dark:text-paper-455">
                    {language === "es" ? "Confirmar Nueva Contraseña" : "Confirm New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={email === "estudiante@neuralmath.edu"}
                      className={`w-full bg-paper-50 dark:bg-paper-950/60 border border-paper-250 dark:border-paper-800 rounded-2xl pl-4 pr-11 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all dark:text-white ${
                        email === "estudiante@neuralmath.edu" ? "cursor-not-allowed opacity-60" : ""
                      }`}
                      placeholder={
                        email === "estudiante@neuralmath.edu"
                          ? (language === "es" ? "Acceso denegado en demo" : "Access denied in demo")
                          : (language === "es" ? "Repite la contraseña..." : "Repeat the password...")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={email === "estudiante@neuralmath.edu"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-paper-400 hover:text-paper-600 dark:hover:text-white p-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-6 border-t border-paper-150 dark:border-paper-800/60">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3.5 rounded-2xl border border-paper-250 dark:border-paper-800 text-xs font-extrabold uppercase tracking-widest text-paper-550 dark:text-paper-400 hover:bg-paper-100 dark:hover:bg-paper-800/60 hover:text-paper-750 dark:hover:text-white transition-all select-none"
              >
                {language === "es" ? "Volver al Panel" : "Back to Panel"}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-7 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 shadow-lg shadow-primary-600/10 active:scale-[0.98] transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === "es" ? "Guardando..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4.5 h-4.5" />
                    <span>{language === "es" ? "Guardar Cambios" : "Save Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </main>
    </div>
  );
};

export default Profile;
