import type { OfferId } from '../state/useAppStore';

export type PurchaseResult = { ok: true; offerId: OfferId; mode: 'demo' | 'backend' };
export type CommerceAdapter = { purchase: (offerId: OfferId) => Promise<PurchaseResult> };

/** Local-first adapter. Replace this implementation with RevenueCat/Supabase when billing is enabled. */
export const demoCommerce: CommerceAdapter = {
  purchase: async (offerId) => ({ ok: true, offerId, mode: 'demo' }),
};
