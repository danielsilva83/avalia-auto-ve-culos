
import { User } from "../types";
import { supabase } from "./supabaseClient";

const MOCK_STORAGE_KEY = 'avalia_auto_user_mock';

const mockAuth = {
  login: async (): Promise<User> => {
    await new Promise(r => setTimeout(r, 1000));
    const newUser: User = {
      id: 'mock_user',
      name: 'Visitante (Mock)',
      email: 'mock@exemplo.com',
      isPro: false,
      credits: 2
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },
  logout: async () => localStorage.removeItem(MOCK_STORAGE_KEY),
  consumeCredit: async (user: User) => {
    if (user.isPro) return user;
    if (user.credits > 0) return { ...user, credits: user.credits - 1 };
    return null;
  },
  getCurrentUser: async () => {
    const s = localStorage.getItem(MOCK_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  }
};

export const authService = {
  login: async () => {
    if (!supabase) return mockAuth.login();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: process.env.VITE_SITE_URL || window.location.origin }
    });
    if (error) throw error;
  },

  logout: async () => {
    if (!supabase) return mockAuth.logout();
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return mockAuth.getCurrentUser();

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      // Forçar busca no banco para pegar o status PRO atualizado pelo Webhook
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        return {
          id: user.id,
          name: user.user_metadata.full_name || 'Usuário',
          email: user.email || '',
          isPro: false,
          credits: 0
        };
      }

      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        isPro: profile.is_pro,
        credits: profile.credits
      };
    } catch (e) {
      console.error("Erro no authService.getCurrentUser:", e);
      return null;
    }
  },

  consumeCredit: async (user: User): Promise<User | null> => {
    if (!supabase) return mockAuth.consumeCredit(user);
    if (user.isPro) return user;
    if (user.credits > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ credits: user.credits - 1 })
        .eq('id', user.id)
        .select().single();
      if (error) return null;
      return { ...user, credits: data.credits };
    }
    return null;
  }
};
