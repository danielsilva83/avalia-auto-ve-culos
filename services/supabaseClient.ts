
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let client = null;

// Robust check: ensure the URL is present and looks like a valid URL
const isUrlValid = (url: string | undefined): boolean => {
  return typeof url === 'string' && url.length > 0 && url.startsWith('http');
};

if (isUrlValid(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 0) {
  try {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    client = null;
  }
} else {
  console.warn("Supabase credentials not found or invalid. The app will run in MOCK mode.");
}

export const supabase = client;
