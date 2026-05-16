import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function normalizeSupabaseUrl(url: string | undefined) {
  return (url || 'http://127.0.0.1:54321')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/(rest|auth|storage|realtime)\/v1\/?$/, '')
    .replace(/\/$/, '');
}

export const supabase = createClient(
  normalizeSupabaseUrl(supabaseUrl),
  supabaseAnonKey || 'missing-anon-key'
);
