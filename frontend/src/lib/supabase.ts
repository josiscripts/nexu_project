import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isConfigured) {
  console.warn('⚠️ Supabase no configurado - Realtime deshabilitado');
}

export const supabase = isConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseAvailable = isConfigured;
