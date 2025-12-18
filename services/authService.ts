
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

  getProfile: async (authUser: any): Promise<User> => {
    if (!supabase) throw new Error("Supabase offline");
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error || !profile) {
      return {
        id: authUser.id,
        name: authUser.user_metadata.full_name || 'Usuário',
        email: authUser.email || '',
        isPro: false,
        credits: 2 // Créditos de experiência para novos usuários
      };
    }

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      isPro: profile.is_pro,
      credits: profile.credits
    };
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
