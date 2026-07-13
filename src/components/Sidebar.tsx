import { useState } from "react";
import { MessageSquare, Plus, Search, Settings, Moon, Sun, LogOut, Pin, Star } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils";
import { soundEngine } from "@/lib/sounds";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import logoNew from "@/assets/images/logo_new_1783973500410.jpg";

export function Sidebar({ 
  onOpenSettings,
  isOpenMobile,
  onCloseMobile
}: { 
  onOpenSettings: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}) {
  const { user, settings, updateSettings, logout } = useAppStore();
  const { chats, activeChatId, createChat, setActiveChat } = useChatStore();
  const [search, setSearch] = useState("");

  const sortedChats = [...chats].sort((a, b) => {
    // Pinned chats first, then newest updated
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const filteredChats = sortedChats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className={cn(
      "w-80 flex-col border-r border-white/[0.06] bg-slate-950 p-5 select-none h-full justify-between shrink-0 transition-transform duration-300 md:bg-slate-950/40 md:backdrop-blur-md md:flex md:translate-x-0 md:static",
      isOpenMobile 
        ? "fixed inset-y-0 left-0 z-50 flex translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]" 
        : "fixed inset-y-0 left-0 z-50 hidden translate-x-[-100%] md:flex"
    )}>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--violet)] to-[var(--cyan)] text-white shadow-xl overflow-hidden p-0.5 border border-white/20 transition-transform group-hover:scale-105 duration-300">
              <img src={logoNew} alt="Nexy AI" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider leading-none text-white flex items-center gap-1.5">
                NEXY <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--violet)] bg-clip-text text-transparent">AI</span>
              </span>
              <span className="text-[10px] text-[var(--muted)] font-mono tracking-widest uppercase mt-0.5">Workspace</span>
            </div>
          </a>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => {
            if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
            createChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="group relative mb-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--violet)] to-[#5d56df] p-3.5 font-bold text-sm text-white shadow-[0_4px_20px_rgba(93,86,223,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(93,86,223,0.5)] active:scale-95 duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" /> 
          Nueva conversación
        </button>

        {/* Search */}
        <div className="mb-4 relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] transition-colors group-focus-within:text-[var(--violet)]" />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 pl-10 text-xs text-[var(--text)] outline-none transition-all hover:bg-white/[0.06] focus:border-[var(--violet)]/50 focus:bg-white/[0.08] placeholder:text-zinc-500"
          />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1.5 custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-zinc-600 text-xs font-mono">Sin conversaciones</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredChats.map((chat, idx) => {
                const isActive = activeChatId === chat.id;
                return (
                  <motion.div
                    key={chat.id}
                    initial={settings.performanceMode ? {} : { opacity: 0, x: -10 }}
                    animate={settings.performanceMode ? {} : { opacity: 1, x: 0 }}
                    exit={settings.performanceMode ? {} : { opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.4) }}
                  >
                    <button
                      onClick={() => {
                        if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                        setActiveChat(chat.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={cn(
                        "group/item flex w-full items-center gap-3 rounded-xl p-3 text-left text-xs transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent border-l-2 border-[var(--violet)] text-white shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-[var(--text)]"
                      )}
                    >
                      <MessageSquare className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[var(--cyan)]" : "text-zinc-500 group-hover/item:text-zinc-300")} />
                      <span className="truncate flex-1 font-medium">{chat.title}</span>
                      
                      {/* Icons for Favorites and Pinned */}
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.pinned && (
                          <Pin className="h-3 w-3 text-[var(--violet)] fill-[var(--violet)] opacity-70" />
                        )}
                        {chat.favorite && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 opacity-75" />
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="mt-4 border-t border-white/[0.06] pt-4 space-y-2.5">
        <button
          onClick={() => {
            if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
            updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
          }}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] p-2.5 text-xs text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-[var(--text)] active:scale-[0.98] cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            {settings.theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            Tema del sistema
          </span>
          <span className="text-[10px] font-mono text-zinc-500 capitalize">{settings.theme === "dark" ? "Oscuro" : "Claro"}</span>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 shadow-inner">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c6bf0] to-[#31b4dc] text-xs font-bold text-white shadow-lg shrink-0">
            {user?.username.slice(0, 2).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-green-500" />
          </div>
          <div className="flex-1 overflow-hidden">
            <strong className="block truncate text-xs font-semibold text-white">{user?.username}</strong>
            <small className="block truncate text-[10px] text-[var(--muted)] flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
              Sincronizado
            </small>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => {
                if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                onOpenSettings();
              }} 
              className="p-1.5 text-zinc-500 hover:text-[var(--cyan)] hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer"
              title="Configuración"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => {
                if (settings.soundEnabled && settings.uiSound) soundEngine.playClick(settings.masterVolume);
                logout();
              }} 
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase">By Brahyan2021 & Nexy AI</span>
        </div>
      </div>
    </aside>
  );
}

