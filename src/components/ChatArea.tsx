import { useState, useRef, useEffect } from "react";
import { Send, Settings2, Trash2, Paperclip, Copy, RotateCcw, Square, X, Star, Brain, Cpu, Zap, Sparkles, Command, ChevronUp, Check, ShieldAlert, Pin, RefreshCw, Plus, Menu } from "lucide-react";
import { useChatStore, Attachment } from "@/store/useChatStore";
import { useAppStore } from "@/store/useAppStore";
import { PuterService } from "@/lib/puter";
import { cn, formatSize } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { StatusIndicator } from "./StatusIndicator";
import { soundEngine } from "@/lib/sounds";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import logoNew from "@/assets/images/logo_new_1783973500410.jpg";


export const MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    tier: "Advanced",
    icon: Sparkles,
    desc: "Modelo insignia para razonamiento de alta velocidad y análisis avanzado.",
    speed: "⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐⭐",
    color: "from-emerald-500 to-teal-600"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    tier: "Fast",
    icon: Zap,
    desc: "Superrápido y liviano, ideal para respuestas instantáneas y tareas cotidianas.",
    speed: "⚡⚡⚡⚡⚡",
    quality: "⭐⭐⭐⭐",
    color: "from-sky-500 to-blue-600"
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    tier: "Standard",
    icon: Cpu,
    desc: "Modelo clásico, altamente confiable y eficiente para tareas generales.",
    speed: "⚡⚡⚡⚡⚡",
    quality: "⭐⭐⭐",
    color: "from-amber-500 to-orange-600"
  }
];

const getFriendlyErrorMessage = (err: any) => {
  const msg = err?.message?.toLowerCase() || "";
  if (msg.includes("abort")) return "Generación detenida.";
  if (msg.includes("timeout") || msg.includes("time out")) return "Se agotó el tiempo de espera. El servidor tardó demasiado en responder.";
  if (msg.includes("network") || msg.includes("failed to fetch")) return "Se perdió la conexión. Revisa tu internet e intenta de nuevo.";
  if (msg.includes("auth") || msg.includes("unauthorized") || msg.includes("token")) return "Error de autenticación. Por favor, inicia sesión nuevamente.";
  if (msg.includes("unavailable") || msg.includes("overloaded")) return "La IA no está disponible temporalmente. Por favor, intenta en unos minutos.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Has alcanzado el límite de peticiones. Espera un momento antes de continuar.";
  return `Ocurrió un error: ${err.message || "Desconocido"}.`;
};

export function ChatArea({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { chats, activeChatId, addMessage, updateLastMessage, deleteChat, createChat, toggleFavorite, togglePin, removeMessage, truncateChat } = useChatStore();
  const { user, settings, updateSettings } = useAppStore();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<{file: File, id: string}[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentModelInfo = MODELS.find(m => m.id === settings.preferredModel) || MODELS[0];

  const activeChat = chats.find((c) => c.id === activeChatId);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length, loading]);

  useEffect(() => {
    const validModelIds = MODELS.map(m => m.id);
    if (!validModelIds.includes(settings.preferredModel)) {
      updateSettings({ preferredModel: "gpt-4o" });
    }
  }, [settings.preferredModel, updateSettings]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({ file: f, id: Math.random().toString(36).slice(2) }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ file: f, id: Math.random().toString(36).slice(2) }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (loading || !activeChatId) return;

    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    const msgIndex = chat.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1 || msgIndex === 0) return;

    // We assume the message before the assistant is the user prompt.
    // However, it could be a longer history. 
    // To regenerate, we keep history up to the user message that prompted this response.
    const userMsg = chat.messages[msgIndex - 1];
    if (userMsg.role !== "user") return;

    // We keep all messages up to the user message, and we remove this assistant message
    const history = chat.messages.slice(0, msgIndex).map(m => {
      // If it's the last user message, we could try to re-attach the file, but 
      // files are not stored in memory (we only stored their metadata like size, name).
      // Since we don't have the original File objects anymore in store, we just send the text content.
      // This is a known limitation when not having a backend to upload files to.
      return {
        role: m.role,
        content: m.content
      };
    });

    // Update store: replace this assistant message with a new empty one
    removeMessage(activeChatId, messageId);
    addMessage(activeChatId, { role: "assistant", content: "" });
    
    setLoading(true);
    abortControllerRef.current = new AbortController();

    await PuterService.streamChat(
      history,
      { thinkingLevel: settings.thinkingLevel, model: settings.preferredModel || "gpt-4o" },
      (_chunk, fullText) => {
        if (abortControllerRef.current?.signal.aborted) return;
        updateLastMessage(activeChatId, fullText);
      },
      (fullText) => {
        if (abortControllerRef.current?.signal.aborted) return;
        updateLastMessage(activeChatId, fullText);
        setLoading(false);
        abortControllerRef.current = null;
        if (settings.soundEnabled && settings.completionSound) soundEngine.playCompletion(settings.masterVolume);
      },
      (err) => {
        if (abortControllerRef.current?.signal.aborted) return;

        if (settings.preferredModel !== "gpt-4o-mini") {
          console.warn("Model failed, falling back to gpt-4o-mini", err);
          updateLastMessage(activeChatId, "⚠️ El modelo seleccionado no estuvo disponible. Cambiando automáticamente a GPT-4o Mini para completar tu respuesta...");
          setTimeout(async () => {
             await PuterService.streamChat(
                history,
                { thinkingLevel: settings.thinkingLevel, model: "gpt-4o-mini" },
                (_chunk, retryText) => {
                   if (abortControllerRef.current?.signal.aborted) return;
                   updateLastMessage(activeChatId, retryText);
                },
                (retryText) => {
                   updateLastMessage(activeChatId, retryText);
                   setLoading(false);
                   updateSettings({ preferredModel: "gpt-4o-mini" });
                   if (settings.soundEnabled && settings.completionSound) soundEngine.playCompletion(settings.masterVolume);
                },
                (retryErr) => {
                   updateLastMessage(activeChatId, getFriendlyErrorMessage(retryErr), true);
                   setLoading(false);
                   if (settings.soundEnabled && settings.errorSound) soundEngine.playError(settings.masterVolume);
                }
             );
          }, 1500);
          return;
        }

        updateLastMessage(activeChatId, getFriendlyErrorMessage(err), true);
        setLoading(false);
        abortControllerRef.current = null;
        if (settings.soundEnabled && settings.errorSound) soundEngine.playError(settings.masterVolume);
      }
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || loading || !activeChatId) return;

    if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);

    const userContent = prompt.trim();
    const currentAttachments = [...attachments];
    
    setPrompt("");
    setAttachments([]);
    
    const attachmentMeta: Attachment[] = currentAttachments.map(a => ({
      name: a.file.name,
      size: a.file.size,
      type: a.file.type,
    }));

    let context = userContent;
    let messageContent: any[] = [];
    if (currentAttachments.some(a => a.file.type.startsWith('image/'))) {
      if (userContent) {
        messageContent.push({ type: "text", text: userContent });
      }
    }

    for (const a of currentAttachments) {
       if (a.file.type.startsWith('image/')) {
          try {
             const base64 = await new Promise<string>((resolve) => {
               const reader = new FileReader();
               reader.onload = () => resolve(reader.result as string);
               reader.readAsDataURL(a.file);
             });
             messageContent.push({ type: "image_url", image_url: { url: base64 } });
          } catch(e) {}
       } else if (a.file.type.startsWith('text/') || a.file.name.endsWith('.md') || a.file.name.endsWith('.json') || a.file.name.endsWith('.ts') || a.file.name.endsWith('.js')) {
          try {
             const text = await a.file.text();
             context += `\n\n[Archivo: ${a.file.name}]\n${text}`;
          } catch(e) {}
       }
    }

    const finalContent = messageContent.length > 0 ? (context && messageContent.length === 0 ? context : messageContent) : context;

    addMessage(activeChatId, { role: "user", content: userContent, attachments: attachmentMeta });
    
    // Add placeholder for assistant
    addMessage(activeChatId, { role: "assistant", content: "" });
    setLoading(true);
    abortControllerRef.current = new AbortController();

    const history = activeChat?.messages.concat({ id: "temp", role: "user", content: finalContent as any, createdAt: Date.now() }).map((m) => ({
      role: m.role,
      content: m.content,
    })) || [];

    await PuterService.streamChat(
      history,
      { thinkingLevel: settings.thinkingLevel, model: settings.preferredModel || "gpt-4o" },
      (_chunk, fullText) => {
        if (abortControllerRef.current?.signal.aborted) return;
        updateLastMessage(activeChatId, fullText);
      },
      (fullText) => {
        if (abortControllerRef.current?.signal.aborted) return;
        updateLastMessage(activeChatId, fullText);
        setLoading(false);
        abortControllerRef.current = null;
        if (settings.soundEnabled && settings.completionSound) soundEngine.playCompletion(settings.masterVolume);
      },
      (err) => {
        if (abortControllerRef.current?.signal.aborted) return;

        if (settings.preferredModel !== "gpt-4o-mini") {
          console.warn("Model failed, falling back to gpt-4o-mini", err);
          updateLastMessage(activeChatId, "⚠️ El modelo seleccionado no estuvo disponible. Cambiando automáticamente a GPT-4o Mini para completar tu respuesta...");
          setTimeout(async () => {
             await PuterService.streamChat(
                history,
                { thinkingLevel: settings.thinkingLevel, model: "gpt-4o-mini" },
                (_chunk, retryText) => {
                   if (abortControllerRef.current?.signal.aborted) return;
                   updateLastMessage(activeChatId, retryText);
                },
                (retryText) => {
                   updateLastMessage(activeChatId, retryText);
                   setLoading(false);
                   updateSettings({ preferredModel: "gpt-4o-mini" });
                   if (settings.soundEnabled && settings.completionSound) soundEngine.playCompletion(settings.masterVolume);
                },
                (retryErr) => {
                   updateLastMessage(activeChatId, getFriendlyErrorMessage(retryErr), true);
                   setLoading(false);
                   if (settings.soundEnabled && settings.errorSound) soundEngine.playError(settings.masterVolume);
                }
             );
          }, 1500);
          return;
        }

        updateLastMessage(activeChatId, getFriendlyErrorMessage(err), true);
        setLoading(false);
        abortControllerRef.current = null;
        if (settings.soundEnabled && settings.errorSound) soundEngine.playError(settings.masterVolume);
      }
    );
  };

  const handleClear = () => {
    if (activeChatId && confirm("¿Limpiar esta conversación?")) {
      deleteChat(activeChatId);
      createChat();
    }
  };

  if (!activeChat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-8 text-center relative select-none h-full">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden absolute top-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-white transition-all cursor-pointer hover:bg-white/[0.06] active:scale-95"
          title="Mostrar conversaciones"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Decorative background grid and sparkles */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04),transparent_50%)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="flex flex-col items-center max-w-md z-10"
        >
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-25 blur-xl animate-pulse" />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-1 border border-white/10 shadow-2xl overflow-hidden">
              <img src={logoNew} alt="Nexy" className="h-full w-full object-cover rounded-xl" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black tracking-tight text-white mb-2">
            ¡Hola, <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--violet)] bg-clip-text text-transparent">{user?.username}</span>!
          </h2>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed font-medium">
            Bienvenido a tu suite de IA privada y acelerada. Inicia una conversación para comenzar a explorar, analizar o redactar.
          </p>
          
          <button
            onClick={() => {
              if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
              createChat();
            }}
            className="group relative flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--violet)] to-[#5d56df] px-6 py-4 font-bold text-sm text-white shadow-[0_8px_25px_rgba(93,86,223,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(93,86,223,0.5)] active:scale-95 duration-200 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
            Comenzar chat nuevo
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-1 flex-col overflow-hidden relative h-full justify-between"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Premium File Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md border-2 border-dashed border-indigo-500 m-5 rounded-[2rem]"
          >
             <div className="text-center p-10 bg-slate-950/80 rounded-2xl border border-white/10 shadow-2xl max-w-xs">
               <Paperclip className="w-12 h-12 mx-auto mb-4 text-indigo-400 animate-bounce" />
               <h3 className="text-xl font-bold text-white mb-2">Suelta los archivos</h3>
               <p className="text-xs text-zinc-400">Inserta imágenes o documentos para contextualizar la IA.</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Workspace Header */}
      <header className="mx-4 md:mx-6 mt-4 md:mt-5 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-slate-900/10 p-3 md:p-4 shadow-sm backdrop-blur-md z-10 gap-2">
        <div className="flex items-center gap-2.5 md:gap-3 overflow-hidden">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Mostrar conversaciones"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="overflow-hidden pr-2">
            <p className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase leading-none mb-1">Nexy AI Workspace</p>
            <h2 className="truncate font-semibold text-sm text-white">{activeChat.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
              togglePin(activeChatId!);
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/5 cursor-pointer",
              activeChat.pinned ? "text-[var(--violet)] bg-white/5" : "text-zinc-500 hover:text-white"
            )}
            title={activeChat.pinned ? "Desanclar conversación" : "Anclar conversación"}
          >
            <Pin className="h-4 w-4" fill={activeChat.pinned ? "currentColor" : "none"} />
          </button>
          
          <button
            onClick={() => {
              if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
              toggleFavorite(activeChatId!);
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white/5 cursor-pointer", 
              activeChat.favorite ? "text-amber-400 bg-white/5" : "text-zinc-500 hover:text-white"
            )}
            title={activeChat.favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Star className="h-4 w-4" fill={activeChat.favorite ? "currentColor" : "none"} />
          </button>
          
          <div className="h-4 w-px bg-white/[0.06] mx-1" />

          <button
            onClick={handleClear}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
            title="Limpiar conversación"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Scrollable Workspace */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 scroll-smooth custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-6 pb-20">
          {activeChat.messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-[3vh] sm:mt-[6vh] max-w-xl rounded-3xl border border-white/[0.06] bg-slate-900/10 p-6 sm:p-8 text-center shadow-xl backdrop-blur-md"
            >
              <div className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/10 p-0.5">
                <img src={logoNew} alt="Nexy" className="h-full w-full object-cover rounded-xl" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">¿En qué podemos colaborar hoy?</h3>
              <p className="mb-8 text-xs text-zinc-400 font-medium">Formula tus preguntas, adjunta archivos para análisis o escribe propuestas. Nexy mantendrá un historial privado.</p>
              
              {/* Bento prompt cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Resume un texto largo", icon: Command, prompt: "¡Hola! Ayúdame a resumir o estructurar este texto largo de manera concisa: " },
                  { label: "Explícame física cuántica", icon: Brain, prompt: "Explícame de forma intuitiva y paso a paso cómo funciona la física cuántica." },
                  { label: "Redactar una idea creativa", icon: Sparkles, prompt: "Redacta un texto creativo o propuesta para: " },
                  { label: "Ayúdame a programar", icon: Cpu, prompt: "Escribe una función TypeScript eficiente y segura para: " }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => setPrompt(item.prompt)}
                      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs text-zinc-300 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-indigo-500/[0.04] cursor-pointer"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 group-hover:bg-indigo-500/20 text-indigo-400 group-hover:text-indigo-300 shrink-0 transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {activeChat.messages.map((msg, idx) => {
                const isAI = msg.role === "assistant";
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.05, 0.3) }}
                    className={cn("group flex gap-4 w-full", !isAI ? "flex-row-reverse" : "flex-row")}
                  >
                    {/* Avatars */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border p-0.5 shadow-sm text-xs font-bold",
                        isAI 
                          ? "bg-gradient-to-br from-[#7c6bf0] to-[#31b4dc] border-white/20 text-white overflow-hidden" 
                          : "bg-indigo-500/20 border-indigo-500/20 text-indigo-300"
                      )}
                    >
                      {isAI ? (
                        <img src={logoNew} alt="Nexy" className="h-full w-full object-cover rounded-[10px]" />
                      ) : (
                        user?.username.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className={cn("max-w-[85%] min-w-[200px]", !isAI && "flex flex-col items-end")}>
                      {/* Name header & inline actions */}
                      <div className="mb-1.5 text-[10px] font-mono tracking-wider text-zinc-500 flex items-center gap-3">
                        <span className="font-bold text-zinc-400">{isAI ? "NEXY AI" : "TÚ"}</span>
                        {!isAI && !loading && (
                          <button 
                            onClick={() => {
                              setPrompt(msg.content);
                              if (confirm("¿Editar y reescribir desde aquí? Se perderán los mensajes posteriores.")) {
                                truncateChat(activeChatId!, msg.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-zinc-500 hover:text-white cursor-pointer"
                          >
                             Editar
                          </button>
                        )}
                      </div>

                      {/* Message Bubble Container */}
                      <div
                        className={cn(
                          "rounded-2xl px-5 py-3.5 shadow-md",
                          !isAI
                            ? "bg-gradient-to-br from-indigo-600/90 to-indigo-700/95 border border-indigo-500/20 text-white rounded-tr-none"
                            : "border border-white/[0.06] bg-white/[0.02] backdrop-blur-md rounded-tl-none text-zinc-100"
                        )}
                      >
                        {/* Render attachments meta if exists */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3 border-b border-white/[0.06] pb-2">
                            {msg.attachments.map((att, i) => (
                               <div key={i} className="flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-[10px] text-zinc-300">
                                 <Paperclip className="h-3 w-3 text-zinc-400" />
                                 <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                                 <span className="opacity-60">{formatSize(att.size)}</span>
                               </div>
                            ))}
                          </div>
                        )}

                        {msg.error ? (
                          <span className="text-red-400 text-xs font-medium flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            {msg.content}
                          </span>
                        ) : (
                          (!msg.content && loading && msg === activeChat.messages[activeChat.messages.length - 1]) ? (
                            <StatusIndicator 
                              attachmentsCount={activeChat.messages[activeChat.messages.length - 2]?.attachments?.length || 0}
                              hasImages={activeChat.messages[activeChat.messages.length - 2]?.attachments?.some((a: any) => a.type?.startsWith("image/")) || false}
                              thinkingLevel={settings.thinkingLevel}
                            />
                          ) : (
                            <div className="prose prose-invert prose-xs leading-relaxed max-w-none text-sm break-words selection:bg-indigo-500/30">
                              <MarkdownRenderer content={msg.content || ""} />
                            </div>
                          )
                        )}
                      </div>

                      {/* Hover action footer */}
                      {isAI && !msg.error && msg.content && (
                        <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                           <button 
                             onClick={() => {
                               if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                               navigator.clipboard.writeText(msg.content);
                             }} 
                             className="flex items-center gap-1.5 rounded-lg p-1 text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer"
                           >
                             <Copy className="h-3.5 w-3.5" /> Copiar
                           </button>
                           {!loading && msg === activeChat.messages[activeChat.messages.length - 1] && (
                             <button 
                               onClick={() => {
                                 if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                                 handleRegenerate(msg.id);
                               }} 
                               className="flex items-center gap-1.5 rounded-lg p-1 text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer"
                             >
                               <RefreshCw className="h-3 w-3" /> Regenerar
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Footer controls & prompt input area */}
      <div className="mx-auto w-full max-w-4xl p-2.5 sm:p-4 shrink-0">
        {/* Model Selector Bar */}
        <div className="flex items-center justify-between mb-2.5 px-2.5 relative select-none">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                setShowModelSelector(!showModelSelector);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-[#dbe3fb] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all shadow-sm cursor-pointer"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400 font-mono uppercase">Modelo:</span>
              <span className="text-white">{currentModelInfo?.name || "GPT-4o"}</span>
              <ChevronUp className={cn("h-3.5 w-3.5 text-zinc-400 transition-transform duration-200", showModelSelector && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showModelSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-3.5 z-30 w-80 rounded-2xl border border-white/[0.08] bg-slate-950 p-2 shadow-2xl backdrop-blur-xl"
                >
                  <div className="px-2.5 pb-2 pt-1.5 border-b border-white/[0.06] mb-1">
                    <h4 className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">Modelos Disponibles</h4>
                  </div>
                  <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                    {MODELS.map((m) => {
                      const isSelected = settings.preferredModel === m.id;
                      const ModelIcon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                            updateSettings({ preferredModel: m.id });
                            setShowModelSelector(false);
                          }}
                          className={cn(
                            "flex w-full flex-col gap-1 rounded-xl p-2.5 text-left transition-all hover:bg-white/[0.04] cursor-pointer",
                            isSelected && "bg-indigo-500/10 border border-indigo-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[11px] shrink-0", m.color)}>
                                <ModelIcon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-bold text-white">{m.name}</span>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-normal pl-8">{m.desc}</p>
                          <div className="flex items-center gap-3 pl-8 text-[9px] text-zinc-500 pt-1">
                            <span>Velocidad: <span className="text-zinc-300 font-medium">{m.speed}</span></span>
                            <span>•</span>
                            <span>Razonamiento: <span className="text-zinc-300 font-medium">{m.quality}</span></span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Core Thinking level badge */}
          <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
            <Cpu className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-bold text-zinc-400 uppercase tracking-widest">{settings.thinkingLevel} thinking</span>
          </div>
        </div>

        {/* Stop button while generating */}
        <AnimatePresence>
          {loading && (
             <motion.div 
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 5 }}
               className="flex justify-center mb-3.5"
             >
               <button 
                 onClick={stopGeneration} 
                 className="flex items-center gap-2 rounded-xl bg-slate-900 border border-white/[0.08] px-4 py-2 text-xs font-semibold text-zinc-200 shadow-md hover:bg-white/5 transition-colors cursor-pointer"
               >
                 <Square className="h-3 w-3 fill-white text-white" />
                 Detener generación
               </button>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Input box form */}
        <form
          onSubmit={handleSend}
          className="glass-panel flex flex-col rounded-2xl p-2 shadow-2xl border border-white/[0.06] transition-all focus-within:-translate-y-0.5 focus-within:border-indigo-500/30 focus-within:shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
        >
          {/* File attachments queue display */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1.5 border-b border-white/[0.04] mb-1.5">
                {attachments.map(att => (
                  <motion.div 
                    key={att.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] shadow-sm relative group"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400"><Paperclip className="h-3.5 w-3.5" /></div>
                    <div className="flex flex-col pr-4">
                      <span className="truncate max-w-[100px] font-semibold text-white">{att.file.name}</span>
                      <span className="text-[9px] text-zinc-500">{formatSize(att.file.size)}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeAttachment(att.id)} 
                      className="absolute right-1 text-zinc-500 hover:text-red-400 cursor-pointer p-1 rounded-md"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
              title="Adjuntar archivo"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
              accept="image/*,text/*,.pdf,.doc,.docx,.json,.md,.csv,.ts,.js"
            />

            {/* Main Textarea */}
            <textarea
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Pregunta algo o arrastra un archivo..."
              className="max-h-[160px] min-h-[44px] w-full resize-none bg-transparent px-2.5 py-3 text-xs text-white outline-none placeholder:text-zinc-600 font-medium custom-scrollbar leading-relaxed"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={(!prompt.trim() && attachments.length === 0) || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--violet)] to-[#5d56df] text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:hover:translate-y-0 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </form>

        {/* Footer brand info */}
        <p className="mt-2 text-center text-[9px] text-zinc-600 font-mono tracking-wider flex items-center justify-center gap-1.5 uppercase select-none">
          <span>Local storage persistence enabled</span>
          <span className="opacity-40">•</span>
          <span>Powered by Puter</span>
          <span className="opacity-40">•</span>
          <span>By Brahyan2021 & Nexy AI</span>
        </p>
      </div>
    </div>
  );
}
