import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { PuterService } from "./../lib/puter";
import { useMouseParallax } from "./../lib/useMouseParallax";
import { motion } from "motion/react";
// @ts-ignore
import logoNew from "@/assets/images/logo_new_1783973500410.jpg";

export function AuthView() {
  const login = useAppStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Subtle 3D tilt effect on the login card
  const parallax = useMouseParallax(8, 3.5);

  const handlePuterSignIn = async () => {
    if (!PuterService.isAvailable()) {
      setError("Puter no está disponible. Revisa tu conexión o recarga.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // @ts-ignore
      await window.puter.auth.signIn();
      // @ts-ignore
      const user = await window.puter.auth.getUser();
      login(user.username || "Usuario Puter", true);
    } catch (err: any) {
      setError("No se pudo iniciar sesión con Puter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#06060a]">
      {/* Dynamic Background Noise and Ambient Gradients */}
      <div className="absolute inset-0 noise opacity-25" />
      <div className="aurora aurora-one opacity-30 scale-125" />
      <div className="aurora aurora-two opacity-30 scale-125" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 70, damping: 20 }}
        style={parallax.style}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/60 p-6 sm:p-10 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.85)] backdrop-blur-3xl"
      >
        {/* Cursor light reflection effect */}
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-30 transition-opacity duration-700"
          style={{
            background: `radial-gradient(400px circle at ${((parallax.coords.x + 1) / 2) * 100}% ${((parallax.coords.y + 1) / 2) * 100}%, rgba(129, 140, 248, 0.18), transparent 50%)`,
          }}
        />

        {/* Premium Brand Logo Container */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl shadow-xl bg-gradient-to-br from-[var(--violet)] to-[var(--cyan)] p-1 overflow-hidden group border border-white/20">
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img src={logoNew} alt="Nexy AI Logo" className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-110" />
        </div>

        {/* Branding Headers */}
        <h1 className="mb-2 text-4xl font-black tracking-wider text-white">
          NEXY <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--violet)] bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mb-8 text-xs font-mono tracking-widest text-[var(--muted)] uppercase">Inteligencia Amplificada</p>

        {/* Connecting State or login actions */}
        <div className="space-y-4">
          <button
            onClick={handlePuterSignIn}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--violet)] to-[#5d56df] px-6 py-4 font-bold text-sm text-white shadow-[0_10px_25px_rgba(93,86,223,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(93,86,223,0.5)] active:scale-95 disabled:opacity-75 disabled:hover:translate-y-0 cursor-pointer"
          >
            {/* Pulsing glow inside button */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
            
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              "Conectar con Puter"
            )}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400"
          >
            {error}
          </motion.div>
        )}
        
        <div className="mt-10 pt-6 border-t border-white/[0.05]">
          <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
            Powered by Puter OS • By Brahyan2021
          </p>
        </div>
      </motion.div>
    </div>
  );
}

