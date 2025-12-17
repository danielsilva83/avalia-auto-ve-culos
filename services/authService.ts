
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
    
    const redirectTo = process.env.VITE_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
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
      // 1. Pega sessão local de forma síncrona/rápida
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) return null;

      // 2. Busca perfil com um timeout agressivo (4s) para evitar "Infinite Loading"
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout fetching profile")), 4000)
      );

      try {
        const result: any = await Promise.race([profilePromise, timeoutPromise]);
        const profile = result.data;

        if (!profile) {
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
      } catch (raceError) {
        console.warn("Usando dados da sessão devido a timeout ou erro no perfil:", raceError);
        return {
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuário',
          email: session.user.email || '',
          isPro: false,
          credits: 0
        };
      }
    } catch (e) {
      console.error("Erro ao obter usuário atual:", e);
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

      if (error) return null;
      return { ...user, credits: data.credits };
    }
    return null;
  },

  upgradeToPro: async (user: User): Promise<User> => {
    if (!supabase) return mockAuth.upgradeToPro(user);
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_pro: true, credits: 9999 })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { ...user, isPro: data.is_pro, credits: data.credits };
  }
};
