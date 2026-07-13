import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useMouseParallax(maxTranslation = 6, maxRotation = 2.5) {
  const { settings } = useAppStore();
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Disable in performance mode or light mode if desired, or if low-performance is preferred
    if (settings.performanceMode) {
      setCoords({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalized coordinates from -1 to 1
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      setCoords({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.performanceMode]);

  // Compute CSS styles with perspective to achieve premium 3D depth reaction
  const transform = settings.performanceMode
    ? undefined
    : `translate3d(${coords.x * maxTranslation}px, ${coords.y * maxTranslation}px, 0) rotateY(${coords.x * maxRotation}deg) rotateX(${-coords.y * maxRotation}deg)`;

  return {
    style: {
      transform,
      transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      transformStyle: "preserve-3d" as const,
    },
    coords, // Expose raw coords for secondary effects like dynamic light reflections
  };
}
