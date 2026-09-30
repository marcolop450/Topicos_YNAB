import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co'
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase no está configurado. Por favor, añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local'
  );
}

// Cliente global de Supabase
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
