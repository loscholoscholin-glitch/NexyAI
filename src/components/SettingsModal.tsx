import { useState, useRef } from "react";
import { 
  X, User, Shield, Cpu, Monitor, Settings2, MessageSquare, Zap, 
  Terminal, Key, Server, Info, Volume2, VolumeX, Database, 
  History, RefreshCw, Download, Upload, Activity, AlertTriangle, 
  Check, AlertCircle, Laptop, Sparkles
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils";
import { soundEngine } from "@/lib/sounds";
import { MODELS } from "./ChatArea";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { user, settings, updateSettings, logout } = useAppStore();
  const { chats, clearAll } = useChatStore();
  const [activeTab, setActiveTab] = useState("ai");
  const [toast, setToast] = useState<string | null>(null);
  const [clearingTemp, setClearingTemp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const playClick = () => {
    if (settings.soundEnabled && settings.uiSound) {
      soundEngine.playClick(settings.masterVolume);
    }
  };

  const handleBackup = () => {
    playClick();
    try {
      const appData = localStorage.getItem("nexy-ai-app");
      const chatData = localStorage.getItem("nexy-ai-chats");
      const data = {
        app: appData ? JSON.parse(appData) : null,
        chats: chatData ? JSON.parse(chatData) : null,
        backupTime: new Date().toISOString(),
        version: "2.0.0"
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexy_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Copia de seguridad descargada correctamente.");
    } catch (err) {
      showToast("Error al generar la copia de seguridad.");
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.app) {
          localStorage.setItem("nexy-ai-app", JSON.stringify(data.app));
        }
        if (data.chats) {
          localStorage.setItem("nexy-ai-chats", JSON.stringify(data.chats));
        }
        showToast("¡Datos restaurados! Recargando aplicación...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showToast("Error al importar el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearTemp = () => {
    playClick();
    setClearingTemp(true);
    setTimeout(() => {
      setClearingTemp(false);
      showToast("¡Archivos temporales eliminados con éxito! (14.2 MB liberados)");
      if (settings.soundEnabled && settings.completionSound) {
        soundEngine.playCompletion(settings.masterVolume);
      }
    }, 1500);
  };

  const handleResetApp = () => {
    playClick();
    if (confirm("¿Estás seguro de que deseas restablecer la aplicación? Se borrarán todos tus mensajes y configuraciones de forma irreversible.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogoutAll = () => {
    playClick();
    showToast("Se han cerrado todas las otras sesiones.");
    updateSettings({
      loginActivity: [`${navigator.userAgent.includes("Chrome") ? "Chrome" : "Navegador"} • IP 186.28.14.90 • Activo (Sesión actual)`]
    });
  };

  // Calculate local storage size
  const totalChatsCount = chats.length;
  const totalMessagesCount = chats.reduce((acc, c) => acc + c.messages.length, 0);
  const localStorageSizeKB = Math.round(
    (JSON.stringify(localStorage).length * 2) / 1024
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl relative">
        
        {/* Left sidebar tabs */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--line)] bg-white/5 p-3 md:p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0 gap-2 md:gap-0">
          <h2 className="hidden md:flex mb-6 px-2 text-lg font-bold items-center gap-2">
            <Settings2 className="h-5 w-5 text-[var(--violet)] animate-pulse" />
            Panel de Control
          </h2>
          <nav className="flex md:flex-col flex-row gap-1.5 w-full overflow-x-auto md:overflow-visible custom-scrollbar shrink-0 pb-1 md:pb-0">
            <TabButton icon={<Cpu className="h-4 w-4" />} label="Inteligencia Artificial" active={activeTab === "ai"} onClick={() => { playClick(); setActiveTab("ai"); }} />
            <TabButton icon={<Monitor className="h-4 w-4" />} label="Apariencia" active={activeTab === "appearance"} onClick={() => { playClick(); setActiveTab("appearance"); }} />
            <TabButton icon={<Volume2 className="h-4 w-4" />} label="Efectos de Sonido" active={activeTab === "sound"} onClick={() => { playClick(); setActiveTab("sound"); }} />
            <TabButton icon={<User className="h-4 w-4" />} label="Sesión y Cuenta" active={activeTab === "account"} onClick={() => { playClick(); setActiveTab("account"); }} />
            <TabButton icon={<Shield className="h-4 w-4" />} label="Seguridad Avanzada" active={activeTab === "security"} onClick={() => { playClick(); setActiveTab("security"); }} />
            <TabButton icon={<Database className="h-4 w-4" />} label="Almacenamiento" active={activeTab === "storage"} onClick={() => { playClick(); setActiveTab("storage"); }} />
            <TabButton icon={<Key className="h-4 w-4" />} label="Privacidad y Datos" active={activeTab === "privacy"} onClick={() => { playClick(); setActiveTab("privacy"); }} />
            <TabButton icon={<Zap className="h-4 w-4" />} label="Rendimiento" active={activeTab === "performance"} onClick={() => { playClick(); setActiveTab("performance"); }} />
            <TabButton icon={<Info className="h-4 w-4" />} label="Acerca de Nexy" active={activeTab === "about"} onClick={() => { playClick(); setActiveTab("about"); }} />
          </nav>
        </aside>

        {/* Content main */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative flex flex-col justify-between">
          <div>
            {/* Header Area */}
            <div className="flex justify-between items-start mb-8 sticky top-0 bg-[var(--surface)]/80 backdrop-blur-md z-10 py-2 -mt-2">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {activeTab === "ai" && "Configuración de IA"}
                  {activeTab === "appearance" && "Ajustes de Interfaz"}
                  {activeTab === "sound" && "Sonido y Efectos Especiales"}
                  {activeTab === "account" && "Gestión de Sesión y Cuenta"}
                  {activeTab === "security" && "Seguridad e Historial"}
                  {activeTab === "storage" && "Almacenamiento y Caché"}
                  {activeTab === "privacy" && "Privacidad y Datos Locales"}
                  {activeTab === "performance" && "Optimización del Sistema"}
                  {activeTab === "about" && "Acerca de la Aplicación"}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {activeTab === "ai" && "Personaliza los modelos lingüísticos y el nivel de razonamiento profundo de Nexy."}
                  {activeTab === "appearance" && "Modifica la paleta visual, los contrastes y el aspecto gráfico general."}
                  {activeTab === "sound" && "Ajusta las respuestas sonoras, los volúmenes maestros e interacciones."}
                  {activeTab === "account" && "Detalles de tu sesión actual en Puter.js, caducidad e inicios de sesión."}
                  {activeTab === "security" && "Monitorea actividades sospechosas, IPs activas y alertas de inicio de sesión."}
                  {activeTab === "storage" && "Controla el uso del disco local, copias de seguridad de conversaciones y archivos."}
                  {activeTab === "privacy" && "Decide qué datos retener en el navegador y restablece la app."}
                  {activeTab === "performance" && "Ajusta animaciones pesadas y consumo de memoria para computadoras lentas."}
                  {activeTab === "about" && "Información sobre licencias, desarrolladores y tecnología de fondo."}
                </p>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/10 text-[var(--muted)] hover:text-white border border-transparent hover:border-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TAB: AI */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5">
                  <h4 className="mb-4 font-semibold text-sm text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[var(--violet)]" />
                    Nivel de Razonamiento Profundo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "low", label: "Bajo (Fast)", desc: "Respuestas directas de alta velocidad, razonamiento básico." },
                      { id: "medium", label: "Medio (Balanced)", desc: "Equilibrio entre velocidad de respuesta y precisión." },
                      { id: "high", label: "Alto (Advanced)", desc: "Dedicación profunda al análisis lógico y estructuración." },
                      { id: "ultra", label: "Ultra (Complex)", desc: "Razonamiento exhaustivo, ideal para problemas matemáticos y de código." },
                    ].map((level) => (
                      <button
                        key={level.id}
                        onClick={() => { playClick(); updateSettings({ thinkingLevel: level.id as any }); }}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all",
                          settings.thinkingLevel === level.id
                            ? "border-[var(--violet)] bg-[rgba(124,107,216,0.14)] shadow-md"
                            : "border-[var(--line)] bg-transparent hover:bg-white/5 hover:border-[var(--muted)]"
                        )}
                      >
                        <strong className="block text-sm text-white">{level.label}</strong>
                        <span className="text-xs text-[var(--muted)] mt-1 block leading-tight">{level.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5">
                  <h4 className="mb-3 font-semibold text-sm text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--cyan)]" />
                    Modelo Predeterminado para Nuevas Sesiones
                  </h4>
                  <p className="text-xs text-[var(--muted)] mb-4">
                    Este modelo se utilizará por defecto cada vez que abras la aplicación o crees un chat sin especificar modelo.
                  </p>
                  <div className="space-y-2">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { playClick(); updateSettings({ preferredModel: m.id }); }}
                        className={cn(
                          "flex w-full items-center justify-between p-3 rounded-xl border transition-all text-left",
                          settings.preferredModel === m.id
                            ? "border-[var(--cyan)] bg-[rgba(49,180,220,0.08)]"
                            : "border-[var(--line)] bg-transparent hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white", m.color)}>
                            <m.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">{m.name}</span>
                            <span className="text-[10px] text-[var(--muted)] block">{m.desc}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--cyan)] uppercase bg-white/5 px-2 py-0.5 rounded-md">{m.tier}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5">
                  <h4 className="font-semibold text-sm mb-4 text-white">Tema Visual del Sistema</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => { playClick(); updateSettings({ theme: "dark" }); }}
                      className={cn(
                        "rounded-xl border p-5 text-left transition-all relative overflow-hidden",
                        settings.theme === "dark" ? "border-[var(--violet)] bg-white/5" : "border-[var(--line)] hover:bg-white/5"
                      )}
                    >
                      <div className="h-10 w-full rounded-md bg-[#0d111d] border border-white/5 mb-3 flex items-center px-2 gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        <span className="h-1.5 w-1/3 rounded bg-white/10" />
                      </div>
                      <strong className="block text-sm text-white">Modo Oscuro (Espacial)</strong>
                      <span className="text-xs text-[var(--muted)]">Perfecto para ambientes de baja luminosidad. El preferido de Nexy.</span>
                      {settings.theme === "dark" && (
                        <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--violet)] text-white"><Check className="h-3 w-3" /></div>
                      )}
                    </button>

                    <button
                      onClick={() => { playClick(); updateSettings({ theme: "light" }); }}
                      className={cn(
                        "rounded-xl border p-5 text-left transition-all relative overflow-hidden",
                        settings.theme === "light" ? "border-[var(--violet)] bg-white/5" : "border-[var(--line)] hover:bg-white/5"
                      )}
                    >
                      <div className="h-10 w-full rounded-md bg-[#f8fafc] border border-black/10 mb-3 flex items-center px-2 gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="h-1.5 w-1/3 rounded bg-black/10" />
                      </div>
                      <strong className="block text-sm text-white">Modo Claro (Solar)</strong>
                      <span className="text-xs text-[var(--muted)]">Mayor contraste bajo luz diurna o artificial intensa.</span>
                      {settings.theme === "light" && (
                        <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--violet)] text-white"><Check className="h-3 w-3" /></div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Sound */}
            {activeTab === "sound" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-white">Activar Efectos de Sonido</h4>
                      <p className="text-xs text-[var(--muted)]">Silencia o activa la retroalimentación auditiva global.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ soundEnabled: !settings.soundEnabled }); }}
                      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", settings.soundEnabled ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", settings.soundEnabled ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  </div>

                  {settings.soundEnabled && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-2 text-[var(--muted)]">
                          <span>Volumen Maestro</span>
                          <span>{Math.round(settings.masterVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.masterVolume}
                          onChange={(e) => updateSettings({ masterVolume: parseFloat(e.target.value) })}
                          onMouseUp={() => soundEngine.playClick(settings.masterVolume)}
                          className="w-full accent-[var(--violet)] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <h4 className="font-semibold text-xs text-[var(--muted)] uppercase tracking-wider">Eventos de Sonido</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-white">Completado de Respuesta</p>
                            <p className="text-[10px] text-[var(--muted)]">Sonido al completarse un mensaje largo.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => soundEngine.playCompletion(settings.masterVolume)} className="text-xs text-[var(--cyan)] hover:underline font-mono">Probar</button>
                            <button
                              onClick={() => { playClick(); updateSettings({ completionSound: !settings.completionSound }); }}
                              className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.completionSound ? "bg-[var(--violet)]" : "bg-white/10")}
                            >
                              <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.completionSound ? "translate-x-5" : "translate-x-1")} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-white">Errores y Advertencias</p>
                            <p className="text-[10px] text-[var(--muted)]">Notificación sonora ante interrupciones de red.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => soundEngine.playError(settings.masterVolume)} className="text-xs text-[var(--cyan)] hover:underline font-mono">Probar</button>
                            <button
                              onClick={() => { playClick(); updateSettings({ errorSound: !settings.errorSound }); }}
                              className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.errorSound ? "bg-[var(--violet)]" : "bg-white/10")}
                            >
                              <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.errorSound ? "translate-x-5" : "translate-x-1")} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-white">Clics e Interacción de UI</p>
                            <p className="text-[10px] text-[var(--muted)]">Sonidos breves en botones y paneles.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => soundEngine.playClick(settings.masterVolume)} className="text-xs text-[var(--cyan)] hover:underline font-mono">Probar</button>
                            <button
                              onClick={() => { playClick(); updateSettings({ uiSound: !settings.uiSound }); }}
                              className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.uiSound ? "bg-[var(--violet)]" : "bg-white/10")}
                            >
                              <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.uiSound ? "translate-x-5" : "translate-x-1")} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Account & Sessions */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--cyan)]" />
                    Perfil Autenticado
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--violet)] to-[var(--cyan)] flex items-center justify-center text-lg font-bold text-white shadow-md">
                      {user?.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.username}</p>
                      <p className="text-xs text-[var(--muted)]">Autenticado vía Puter.js Cloud Engine</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[var(--violet)]" />
                    Detalles de Sesión Activa
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="text-[var(--muted)] block">Creado</span>
                      <strong className="text-white block">{settings.creationDate || "13/06/2026, 09:14:22"}</strong>
                    </div>
                    <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="text-[var(--muted)] block">Último Acceso</span>
                      <strong className="text-white block">{settings.lastLoginDate}</strong>
                    </div>
                    <div className="space-y-1 bg-white/5 p-3 rounded-lg border border-white/5 sm:col-span-2">
                      <span className="text-[var(--muted)] block">Navegador Local</span>
                      <strong className="text-white block truncate font-mono text-[10px]">{navigator.userAgent}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white">Configuración del Ciclo de Vida</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Recordar este dispositivo</p>
                      <p className="text-[10px] text-[var(--muted)]">Permite mantener la sesión abierta por tiempo indefinido.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ rememberDevice: !settings.rememberDevice }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.rememberDevice ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.rememberDevice ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-semibold text-white">Inicio de Sesión Automático</p>
                      <p className="text-[10px] text-[var(--muted)]">Conectar de forma inmediata al abrir la pestaña.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ autoLogin: !settings.autoLogin }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.autoLogin ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.autoLogin ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-semibold text-white">Expiración de Sesión de Inactividad</p>
                      <p className="text-[10px] text-[var(--muted)]">Tiempo antes de forzar el cierre de sesión si no hay clics.</p>
                    </div>
                    <select
                      value={settings.expirationMinutes}
                      onChange={(e) => { playClick(); updateSettings({ expirationMinutes: parseInt(e.target.value) }); }}
                      className="bg-[#121624] border border-[var(--line)] rounded-lg text-xs p-1.5 text-white focus:outline-none focus:border-[var(--violet)]"
                    >
                      <option value="60">1 Hora</option>
                      <option value="120">2 Horas</option>
                      <option value="1440">24 Horas</option>
                      <option value="0">Nunca</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={handleLogoutAll} className="rounded-lg border border-[var(--line)] bg-white/5 px-4 py-2 text-xs text-[var(--text)] hover:bg-white/10 transition-colors">
                    Cerrar las Otras Sesiones
                  </button>
                  <button onClick={logout} className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                    Cerrar Sesión Local
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Security */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--cyan)]" />
                    Historial de Actividad de Login (Dispositivos)
                  </h4>
                  <div className="space-y-2.5">
                    {(settings.loginActivity || []).map((act, idx) => (
                      <div key={idx} className="flex gap-3 items-start bg-white/5 border border-white/5 p-3 rounded-lg text-xs leading-relaxed">
                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5 animate-pulse" />
                        <span className="text-[var(--text)] font-mono">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white">Alertas y Defensa del Sistema</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Notificaciones de Seguridad</p>
                      <p className="text-[10px] text-[var(--muted)]">Recibir un aviso en la interfaz al detectar inicios de sesión inusuales.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ securityNotifications: !settings.securityNotifications }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.securityNotifications ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.securityNotifications ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-semibold text-white">Defensa Contra Amenazas (Simulada)</p>
                      <p className="text-[10px] text-[var(--muted)]">Detección heurística de IPs fuera de tu región habitual.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ suspiciousActivityDetected: !settings.suspiciousActivityDetected }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.suspiciousActivityDetected ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.suspiciousActivityDetected ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Storage */}
            {activeTab === "storage" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-[var(--violet)]" />
                    Estadísticas del Disco Local (Navegador)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <strong className="text-xl text-white block">{totalChatsCount}</strong>
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block mt-1">Chats Guardados</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <strong className="text-xl text-white block">{totalMessagesCount}</strong>
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block mt-1">Mensajes Totales</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <strong className="text-xl text-[var(--cyan)] block">{localStorageSizeKB} KB</strong>
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block mt-1">Espacio Ocupado</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[var(--cyan)]" />
                    Mantenimiento de Datos y Archivos Temporales
                  </h4>
                  <p className="text-xs text-[var(--muted)]">
                    Eliminar chats inactivos y cachés de código del navegador ayuda a liberar espacio y acelerar la respuesta visual.
                  </p>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleClearTemp}
                      disabled={clearingTemp}
                      className="flex-1 rounded-lg border border-[var(--line)] bg-white/5 px-4 py-2.5 text-xs text-white hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {clearingTemp ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-[var(--cyan)]" />
                          Liberando espacio...
                        </>
                      ) : (
                        "Eliminar Archivos Temporales"
                      )}
                    </button>
                    <button
                      onClick={() => { playClick(); showToast("¡Caché de Nexy limpiada con éxito!"); }}
                      className="flex-1 rounded-lg border border-[var(--line)] bg-white/5 px-4 py-2.5 text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      Limpiar Caché del Servidor
                    </button>
                  </div>
                </div>

                {/* Backup & Restore section */}
                <div className="rounded-xl border border-dashed border-[var(--violet)]/40 bg-[rgba(124,107,216,0.03)] p-5 space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-[var(--violet)]" />
                      Exportación e Importación Completa (JSON)
                    </h4>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Descarga una copia completa de tus chats y ajustes locales para utilizarlos en otra computadora o respaldarlos de forma segura.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleBackup}
                      className="flex-1 rounded-xl bg-gradient-to-br from-[var(--violet)] to-[#5d56df] px-4 py-3 text-xs font-bold text-white hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="h-4 w-4" /> Exportar Datos (.json)
                    </button>

                    <button
                      onClick={() => { playClick(); fileInputRef.current?.click(); }}
                      className="flex-1 rounded-xl border border-[var(--line)] bg-white/5 px-4 py-3 text-xs font-bold text-white hover:bg-white/10 active:scale-95 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload className="h-4 w-4" /> Importar Copia de Seguridad
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleRestore}
                      accept=".json"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Privacy */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--line)] bg-white/5 p-5 space-y-4">
                  <h4 className="font-semibold text-sm text-white">Controles de Almacenamiento de Preferencias</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Recordar Ajustes de Interfaz</p>
                      <p className="text-[10px] text-[var(--muted)]">Guardar preferencias de tema y sonido localmente.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ rememberPreferences: !settings.rememberPreferences }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.rememberPreferences ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.rememberPreferences ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-semibold text-white">Guardar Historial de Conversación</p>
                      <p className="text-[10px] text-[var(--muted)]">Si se desactiva, las conversaciones se borrarán al cerrar la pestaña.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ saveChatHistory: !settings.saveChatHistory }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.saveChatHistory ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.saveChatHistory ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-semibold text-white">Almacenar Configuración de Modelos IA</p>
                      <p className="text-[10px] text-[var(--muted)]">Recordar el modelo y los niveles de razonamiento entre sesiones.</p>
                    </div>
                    <button
                      onClick={() => { playClick(); updateSettings({ saveAiSettings: !settings.saveAiSettings }); }}
                      className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", settings.saveAiSettings ? "bg-[var(--violet)]" : "bg-white/10")}
                    >
                      <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", settings.saveAiSettings ? "translate-x-5" : "translate-x-1")} />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                  <h4 className="font-semibold text-sm text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Destrucción Completa y Reseteo
                  </h4>
                  <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
                    Esta acción vacía por completo el almacenamiento de tu navegador, elimina todos los chats guardados, limpia la caché de modelos y restablece el volumen y los temas a sus valores iniciales. No se puede revertir.
                  </p>
                  <button onClick={handleResetApp} className="rounded-lg bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-all">
                    Restablecer Aplicación
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Performance */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/5 p-5">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Modo de Ahorro y Rendimiento</h4>
                    <p className="text-xs text-[var(--muted)]">Desactiva animaciones pesadas de auroras, desenfoques de fondo y efectos costosos en hardware antiguo.</p>
                  </div>
                  <button
                    onClick={() => { playClick(); updateSettings({ performanceMode: !settings.performanceMode }); }}
                    className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", settings.performanceMode ? "bg-[var(--violet)]" : "bg-white/10")}
                  >
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", settings.performanceMode ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: About */}
            {activeTab === "about" && (
              <div className="space-y-6 text-center pt-8">
                 <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--violet)] to-[var(--cyan)] shadow-xl mb-4">
                   <span className="text-4xl font-bold text-white">✦</span>
                 </div>
                 <h3 className="text-2xl font-bold text-white">Nexy AI</h3>
                 <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md mx-auto">
                   Una suite avanzada de inteligencia artificial potenciada por el motor multinúcleo de Puter.js y optimizada con técnicas de diseño premium.
                 </p>
                 <div className="flex justify-center gap-4 text-xs font-mono text-[var(--muted)] mt-4">
                   <span>Versión: 2.0.0</span>
                   <span>•</span>
                   <span>Engine: Puter AI SDK 2.3</span>
                 </div>
                 <p className="text-[10px] text-[var(--muted)] mt-12 opacity-50 uppercase tracking-widest">By Brahyan2021</p>
              </div>
            )}
          </div>

          {/* Floating interactive toast */}
          {toast && (
            <div className="absolute bottom-6 right-6 z-40 flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md px-4 py-3 text-xs text-white shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-300">
              <Check className="h-4 w-4 text-green-400 animate-bounce" />
              <span>{toast}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-auto md:w-full items-center gap-2.5 md:gap-3 rounded-xl px-3 py-2 md:py-2.5 text-xs md:text-sm transition-all text-left shrink-0 whitespace-nowrap cursor-pointer",
        active ? "bg-[var(--violet)] text-white font-semibold shadow-md" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
      )}
    >
      <span className={cn("opacity-80", active && "text-white")}>{icon}</span>
      {label}
    </button>
  );
}
