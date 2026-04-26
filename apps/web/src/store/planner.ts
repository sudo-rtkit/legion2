import { create } from 'zustand';

interface PlannerState {
  wave: number;
  availableGold: number;
  availableMythium: number;
  workerCount: number;
  rolledFighters: string[];
  opponentLikelySend: string | undefined;
  expertMode: boolean;
  setWave: (wave: number) => void;
  setAvailableGold: (gold: number) => void;
  setAvailableMythium: (mythium: number) => void;
  setWorkerCount: (count: number) => void;
  setRolledFighters: (fighters: string[]) => void;
  addFighter: (id: string) => void;
  removeFighter: (id: string) => void;
  setOpponentLikelySend: (send: string | undefined) => void;
  toggleExpertMode: () => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  wave: 1,
  availableGold: 200,
  availableMythium: 0,
  workerCount: 5,
  rolledFighters: [],
  opponentLikelySend: undefined,
  expertMode: false,
  setWave: (wave) => set({ wave }),
  setAvailableGold: (availableGold) => set({ availableGold }),
  setAvailableMythium: (availableMythium) => set({ availableMythium }),
  setWorkerCount: (workerCount) => set({ workerCount }),
  setRolledFighters: (rolledFighters) => set({ rolledFighters }),
  addFighter: (id) =>
    set((s) => (s.rolledFighters.length < 10 ? { rolledFighters: [...s.rolledFighters, id] } : s)),
  removeFighter: (id) =>
    set((s) => {
      const idx = s.rolledFighters.indexOf(id);
      if (idx === -1) return s;
      const next = [...s.rolledFighters];
      next.splice(idx, 1);
      return { rolledFighters: next };
    }),
  setOpponentLikelySend: (opponentLikelySend) => set({ opponentLikelySend }),
  toggleExpertMode: () => set((s) => ({ expertMode: !s.expertMode })),
}));
