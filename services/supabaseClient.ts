
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let client = null;

// Verifica se a URL é válida e não é uma string de placeholder
const isUrlValid = (url: string | undefined): boolean => {
  return typeof url === 'string' && url.length > 10 && url.startsWith('http');
};

if (isUrlValid(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 10) {
  try {
    client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.error("Erro ao inicializar Supabase:", err);
  }
} else {
  console.warn("Credenciais Supabase ausentes ou inválidas. Rodando em modo MOCK.");
}

export const supabase = client;
