import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  user: {
    username: string;
    isPuterAuth: boolean;
  } | null;
  settings: {
    thinkingLevel: "low" | "medium" | "high" | "ultra";
    performanceMode: boolean;
    theme: "dark" | "light";
    soundEnabled: boolean;
    masterVolume: number;
    completionSound: boolean;
    errorSound: boolean;
    uiSound: boolean;
    preferredModel: string;
    // Session & Account states
    creationDate: string;
    lastLoginDate: string;
    rememberDevice: boolean;
    autoLogin: boolean;
    expirationMinutes: number;
    securityNotifications: boolean;
    suspiciousActivityDetected: boolean;
    loginActivity: string[];
    // Privacy
    rememberPreferences: boolean;
    saveChatHistory: boolean;
    saveAiSettings: boolean;
    // MCP Integration
    mcpEnabled: boolean;
    mcpServerUrl: string;
  };
  login: (username: string, isPuterAuth?: boolean) => void;
  logout: () => void;
  updateSettings: (settings: Partial<AppState["settings"]>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      settings: {
        thinkingLevel: "medium",
        performanceMode: false,
        theme: "dark",
        soundEnabled: true,
        masterVolume: 0.5,
        completionSound: true,
        errorSound: true,
        uiSound: true,
        preferredModel: "gpt-4o",
        // Default initialized session values
        creationDate: "13/06/2026, 09:14:22",
        lastLoginDate: new Date().toLocaleString(),
        rememberDevice: true,
        autoLogin: true,
        expirationMinutes: 120,
        securityNotifications: true,
        suspiciousActivityDetected: false,
        loginActivity: [
          `Chrome 126.0 (Linux x86_64) • IP 186.28.14.90 • Activo (Sesión actual)`,
          `Chrome 126.0 (Linux x86_64) • IP 186.28.14.90 • 13/07/2026, 11:42:01`,
          `Safari Mobile 17.5 (iOS) • IP 190.111.23.45 • 10/07/2026, 18:22:15`
        ],
        rememberPreferences: true,
        saveChatHistory: true,
        saveAiSettings: true,
        mcpEnabled: false,
        mcpServerUrl: "http://localhost:3000/sse",
      },
      login: (username, isPuterAuth = false) => set((state) => ({ 
        user: { username, isPuterAuth },
        settings: {
          ...state.settings,
          lastLoginDate: new Date().toLocaleString(),
        }
      })),
      logout: () => set({ user: null }),
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
    }),
    {
      name: "nexy-ai-app",
      merge: (persistedState: any, currentState: AppState) => {
        return {
          ...currentState,
          ...persistedState,
          settings: {
            ...currentState.settings,
            ...(persistedState?.settings || {}),
          },
        };
      },
    }
  )
);
