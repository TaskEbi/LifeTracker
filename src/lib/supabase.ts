import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
/**
 * Sync must be switched on explicitly. Vercel sets the Supabase variables for Production only and
 * this flag with them, so a preview build (or a laptop with a stray .env) can't write to the shared database.
 */
const allowed = import.meta.env.VITE_LT_ALLOW_SYNC === 'true';

/** Where the sign-in is kept, so the installed phone app stays signed in between launches. */
export const AUTH_STORAGE_KEY = 'lifetracker-auth';

/** Null when no project is configured (or sync isn't allowed): the app then runs in local-only mode. */
export const supabase: SupabaseClient | null =
  url && key && allowed ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: AUTH_STORAGE_KEY } }) : null;

/** Why sync is off, for the settings screen. */
export const syncOffReason: string | null = !url || !key ? 'No Supabase project is configured on this build.' : !allowed ? 'Sync is switched off for this build (VITE_LT_ALLOW_SYNC).' : null;
