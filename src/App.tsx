/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { AuthView } from "./components/AuthView";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { SettingsModal } from "./components/SettingsModal";
import { useAppStore } from "./store/useAppStore";
import { PuterService } from "./lib/puter";
import { motion, AnimatePresence } from "motion/react";
import { useMouseParallax } from "./lib/useMouseParallax";
// @ts-ignore
import logoNew from "@/assets/images/logo_new_1783973500410.jpg";


export default function App() {
  const { user, settings, login } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Parallax cursor effect for the main container
  const parallax = useMouseParallax(5, 1.8);

  useEffect(() => {
    document.body.className = settings.theme === "light" ? "light-mode" : "";
    if (settings.performanceMode) {
      document.body.classList.add("performance-mode");
    } else {
      document.body.classList.remove("performance-mode");
    }
  }, [settings.theme, settings.performanceMode]);

  useEffect(() => {
    const checkPuterAuth = async () => {
      let retries = 0;
      while (!PuterService.isAvailable() && retries < 10) {
        await new Promise((r) => setTimeout(r, 500));
        retries++;
      }

      if (PuterService.isAvailable()) {
        try {
          // @ts-ignore
          if (window.puter.auth.isSignedIn()) {
            // @ts-ignore
            const puterUser = await window.puter.auth.getUser();
            login(puterUser.username || "Usuario Puter", true);
          }
        } catch (e) {
          console.error("Error checking Puter auth", e);
        }
      }
      setIsInitializing(false);
    };

    checkPuterAuth();
  }, [login]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
        <div className="absolute inset-0 noise" />
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="relative">
            {/* Spinning/pulsing neon outer ring */}
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[var(--violet)] to-[var(--cyan)] opacity-20 blur-xl animate-pulse" />
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-black p-1 shadow-2xl border border-white/10 overflow-hidden">
              <img src={logoNew} alt="Nexy AI" className="h-full w-full object-cover rounded-xl" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent">NEXY AI</h2>
            <p className="text-xs text-[var(--muted)] font-mono tracking-widest uppercase animate-pulse">Iniciando sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="flex h-screen w-full relative overflow-hidden text-[var(--text)] bg-[#07070a] select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 noise" />
      <div className="aurora aurora-one opacity-40" />
      <div className="aurora aurora-two opacity-40" />

      {/* Floating Glass Panel Workspace */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-0 md:p-3 lg:p-4 xl:p-5">
        <motion.div
          initial={settings.performanceMode ? {} : { opacity: 0, scale: 0.97, y: 15 }}
          animate={settings.performanceMode ? {} : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={parallax.style}
          className="relative flex h-full w-full max-w-[1920px] overflow-hidden md:rounded-3xl border border-white/[0.06] bg-slate-950/65 backdrop-blur-[30px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Subtle reflex glow inside the card based on mouse movement */}
          {!settings.performanceMode && (
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-25 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(1200px circle at ${((parallax.coords.x + 1) / 2) * 100}% ${((parallax.coords.y + 1) / 2) * 100}%, rgba(129, 140, 248, 0.12), transparent 45%)`,
              }}
            />
          )}

          {/* Mobile sidebar backdrop */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden fixed inset-0 z-40 bg-black backdrop-blur-sm"
              />
            )}
          </AnimatePresence>

          {/* Main workspace panels */}
          <Sidebar 
            onOpenSettings={() => setShowSettings(true)} 
            isOpenMobile={mobileSidebarOpen} 
            onCloseMobile={() => setMobileSidebarOpen(false)} 
          />
          <ChatArea onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)} />
        </motion.div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

