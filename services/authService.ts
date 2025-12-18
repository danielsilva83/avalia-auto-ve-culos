
import { User } from "../types";
import { supabase } from "./supabaseClient";

export const authService = {
  login: async () => {
    if (!supabase) throw new Error("Supabase não disponível.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) throw error;
  },

  logout: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  getProfile: async (authUser: any): Promise<User> => {
    const fallbackUser: User = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Usuário',
      email: authUser.email || '',
      isPro: false,
      credits: 2
    };

    if (!supabase) return fallbackUser;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error || !profile) {
        // Tenta criar o perfil se ele não existir
        try {
          await supabase.from('profiles').upsert({
            id: authUser.id,
            full_name: fallbackUser.name,
            email: fallbackUser.email,
            credits: 2,
            is_pro: false
          });
        } catch (upsertErr) {
          console.warn("Não foi possível criar perfil no DB, usando memória.");
        }
        return fallbackUser;
      }

      return {
        id: profile.id,
        name: profile.full_name || fallbackUser.name,
        email: profile.email || fallbackUser.email,
        isPro: !!profile.is_pro,
        credits: typeof profile.credits === 'number' ? profile.credits : 0
      };
    } catch (e) {
      console.error("Erro ao buscar perfil:", e);
      return fallbackUser;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return authService.getProfile(user);
  },

  consumeCredit: async (user: User): Promise<User | null> => {
    if (!supabase) return null;
    if (user.isPro) return user;
    
    if (user.credits > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ credits: user.credits - 1 })
          .eq('id', user.id)
          .select().single();
          
        if (error) return null;
        return { ...user, credits: data.credits };
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};
