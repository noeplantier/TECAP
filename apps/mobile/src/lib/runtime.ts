import { isSupabaseConfigured } from './supabase';

export const isBackendEnabled =
  process.env.EXPO_PUBLIC_USE_SUPABASE === 'true' && isSupabaseConfigured;
export const isDemoMode = !isBackendEnabled;
