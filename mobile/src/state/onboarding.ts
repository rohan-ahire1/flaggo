import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "worldly-onboarded";

// Tracks whether the first-run Welcome screen has been dismissed.
type OnboardStore = {
  seen: boolean;
  hydrated: boolean;
  markSeen: () => void;
  hydrate: () => Promise<void>;
};

export const useOnboardStore = create<OnboardStore>((set) => ({
  seen: false,
  hydrated: false,
  markSeen: () => {
    set({ seen: true });
    void AsyncStorage.setItem(KEY, "1");
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(KEY);
      set({ seen: stored === "1", hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  }
}));
