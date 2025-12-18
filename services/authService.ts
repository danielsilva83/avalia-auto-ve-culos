
import { User } from "../types";
import { supabase } from "./supabaseClient";

export const authService = {
  login: async () => {
    if (!supabase) throw new Error("Supabase não disponível.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: process.env.VITE_SITE_URL || window.location.origin }
    });
    if (error) throw error;
  },

  logout: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return null;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      // Busca dados frescos do banco (importante para detectar virada de chave PRO)
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
    if (!supabase) return null;
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
