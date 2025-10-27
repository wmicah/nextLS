import { create } from "zustand";

export interface ClipboardItem {
  id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  tempo: string | null;
  routineId: string | null;
  supersetWithId: string | null;
}

export interface ClipboardDay {
  isRest: boolean;
  warmup: any | null;
  items: ClipboardItem[];
}

export interface ClipboardData {
  days: ClipboardDay[];
}

interface ClipboardStore {
  clipboard: ClipboardData | null;
  setClipboard: (data: ClipboardData) => void;
  clearClipboard: () => void;
}

export const useClipboardStore = create<ClipboardStore>(set => ({
  clipboard: null,
  setClipboard: data => set({ clipboard: data }),
  clearClipboard: () => set({ clipboard: null }),
}));
