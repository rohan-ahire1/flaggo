import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { DEFAULT_THEME, type ThemeKey, THEMES } from "./palettes";

const STORAGE_KEY = "worldly-theme";

// Client/UI state lives in Zustand (server-state lives in React Query). The
// active theme is a good example of durable UI state, persisted to AsyncStorage.
type ThemeStore = {
  theme: ThemeKey;
  hydrated: boolean;
  setTheme: (key: ThemeKey) => void;
  hydrate: () => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: DEFAULT_THEME,
  hydrated: false,
  setTheme: (key) => {
    set({ theme: key });
    void AsyncStorage.setItem(STORAGE_KEY, key);
  },
  hydrate: async () => {
    try {
      const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeKey | null;
      if (stored && stored in THEMES) set({ theme: stored, hydrated: true });
      else set({ hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  }
}));
