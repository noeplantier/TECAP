import { create } from 'zustand';

type AppState = {
  city: string;
  isAuthenticated: boolean;
  hasAccepted18Plus: boolean;
  setCity: (city: string) => void;
  setAuthenticated: (value: boolean) => void;
  setAccepted18Plus: (value: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  city: 'Saint-Brieuc',
  isAuthenticated: false,
  hasAccepted18Plus: false,
  setCity: (city) => set({ city }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAccepted18Plus: (hasAccepted18Plus) => set({ hasAccepted18Plus }),
}));
