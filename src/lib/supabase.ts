import { createClient } from '@supabase/supabase-js';

export function validateSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Missing Supabase environment variables');
    return {
      url: 'https://placeholder-project.supabase.co',
      key: 'placeholder-key'
    };
  }

  try {
    // Validate URL format
    new URL(url);
    return { url, key };
  } catch (error) {
    console.error('Invalid Supabase URL format:', error);
    return {
      url: 'https://placeholder-project.supabase.co',
      key: 'placeholder-key'
    };
  }
}

const config = validateSupabaseConfig();

export const supabase = createClient(config.url, config.key);
