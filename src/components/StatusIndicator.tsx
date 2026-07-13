import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface StatusIndicatorProps {
  attachmentsCount: number;
  hasImages: boolean;
  thinkingLevel: string;
}

export function StatusIndicator({ attachmentsCount, hasImages, thinkingLevel }: StatusIndicatorProps) {
  const [status, setStatus] = useState("Entendiendo solicitud");
  const [dots, setDots] = useState("");

  useEffect(() => {
    let processPhase = "Pensando";
    if (hasImages) processPhase = "Analizando imagen";
    else if (attachmentsCount > 1) processPhase = "Leyendo archivos";
    else if (attachmentsCount === 1) processPhase = "Leyendo documento";
    else if (thinkingLevel === "ultra" || thinkingLevel === "high") processPhase = "Razonando profundamente";

    const phases = [
      "Entendiendo solicitud",
      "Revisando contexto",
      processPhase,
      "Procesando información",
      "Estructurando respuesta",
      "Dando formato y estilo",
      "Listo"
    ];

    setStatus(phases[0]);
    const timer1 = setTimeout(() => setStatus(phases[1]), 500);
    const timer2 = setTimeout(() => setStatus(phases[2]), 1200);
    const timer3 = setTimeout(() => setStatus(phases[3]), 2200);
    const timer4 = setTimeout(() => setStatus(phases[4]), 3500);
    const timer5 = setTimeout(() => setStatus(phases[5]), 5000);
    const timer6 = setTimeout(() => setStatus(phases[6]), 6500);

    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearInterval(interval);
    };
  }, [attachmentsCount, hasImages, thinkingLevel]);

  return (
    <div className="flex items-center gap-3.5 py-2.5 text-indigo-400 select-none">
      {/* Premium custom loader animation */}
      <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-1 rounded-full bg-indigo-500/10 flex items-center justify-center"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        </motion.div>
      </div>
      
      {/* Glowing animated caption */}
      <div className="flex flex-col">
        <span className="text-[10px] font-mono tracking-widest text-indigo-500/80 uppercase">AI THINKING ENGINE</span>
        <span className="text-xs font-semibold text-zinc-300 tracking-wide mt-0.5">
          {status}
          <span className="font-mono">{dots}</span>
        </span>
      </div>
    </div>
  );
}
