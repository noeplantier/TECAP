import { create } from 'zustand';

export type SubscriptionTier = 'free' | 'premium';
export type OfferId =
  'invite-1' | 'invite-5' | 'premium-1' | 'premium-3' | 'premium-12' | 'boost-1' | 'boost-5';

type AppState = {
  city: string;
  isAuthenticated: boolean;
  hasAccepted18Plus: boolean;
  subscription: SubscriptionTier;
  boosts: number;
  invitationCredits: number;
  lastPurchase?: OfferId;
  setCity: (city: string) => void;
  setAuthenticated: (value: boolean) => void;
  setAccepted18Plus: (value: boolean) => void;
  activatePremium: (offer: OfferId) => void;
  addBoosts: (amount: number, offer: OfferId) => void;
  addInvitationCredits: (amount: number, offer: OfferId) => void;
};

export const useAppStore = create<AppState>((set) => ({
  city: 'Rennes',
  isAuthenticated: false,
  hasAccepted18Plus: false,
  subscription: 'free',
  boosts: 0,
  invitationCredits: 0,
  setCity: (city) => set({ city }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAccepted18Plus: (hasAccepted18Plus) => set({ hasAccepted18Plus }),
  activatePremium: (lastPurchase) => set({ subscription: 'premium', lastPurchase }),
  addBoosts: (amount, lastPurchase) =>
    set((state) => ({ boosts: state.boosts + amount, lastPurchase })),
  addInvitationCredits: (amount, lastPurchase) =>
    set((state) => ({ invitationCredits: state.invitationCredits + amount, lastPurchase })),
}));
