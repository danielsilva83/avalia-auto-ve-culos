
import { User } from "../types";
import { supabase } from "./supabaseClient";

const MOCK_STORAGE_KEY = 'avalia_auto_user_mock';

const mockAuth = {
  login: async (): Promise<User> => {
    await new Promise(r => setTimeout(r, 1000));
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    const newUser: User = {
      id: 'mock_' + Math.random().toString(36).substr(2, 9),
      name: 'Visitante (Mock)',
      email: 'mock@exemplo.com',
      isPro: false,
      credits: 2
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },
  logout: async () => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  },
  consumeCredit: async (user: User): Promise<User | null> => {
    if (user.isPro) return user;
    if (user.credits > 0) {
      const updated = { ...user, credits: user.credits - 1 };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return null;
  },
  upgradeToPro: async (user: User): Promise<User> => {
    await new Promise(r => setTimeout(r, 1500));
    const updated = { ...user, isPro: true, credits: 9999 };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
  getCurrentUser: async (): Promise<User | null> => {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};

export const authService = {
  login: async () => {
    if (!supabase) return mockAuth.login();
    
    const getRedirectUrl = () => {
       const siteUrl = process.env.VITE_SITE_URL;
       if (siteUrl) return siteUrl;
       return window.location.origin;
    };

    const redirectTo = getRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo
      }
    });
    
    if (error) throw error;
  },

  logout: async () => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    if (!supabase) return mockAuth.logout();
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return mockAuth.getCurrentUser();

    try {
      // 1. Pega usuário da sessão de forma rápida
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) return null;

      // 2. Busca perfil na tabela 'profiles'
      // Adicionado timeout ou verificação simples para evitar travamento
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle(); // maybeSingle não lança erro se não encontrar

      // Se houver erro de perfil ou o perfil não existir ainda,
      // retornamos o usuário básico da sessão Google para não travar o App
      if (profileError || !profile) {
        console.warn("Perfil não encontrado ou erro. Usando dados da sessão.");
        return {
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuário',
          email: session.user.email || '',
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
      console.error("Falha crítica no getCurrentUser:", e);
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
        .select()
        .single();

      if (error) {
        console.error("Erro ao consumir crédito:", error);
        return null;
      }

      return {
        ...user,
        credits: data.credits
      };
    }
    return null;
  },

  upgradeToPro: async (user: User): Promise<User> => {
    if (!supabase) return mockAuth.upgradeToPro(user);

    await new Promise(r => setTimeout(r, 2000));

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_pro: true, credits: 9999 })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...user,
      isPro: data.is_pro,
      credits: data.credits
    };
  }
};
