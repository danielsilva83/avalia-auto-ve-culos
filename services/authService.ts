import { User } from "../types";
import { supabase } from "./supabaseClient";

const MOCK_STORAGE_KEY = 'avalia_auto_user_mock';

// --- MOCK LOGIC (Fallback se não houver Supabase configurado) ---
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

// --- REAL BACKEND LOGIC (Supabase) ---
export const authService = {
  login: async () => {
    if (!supabase) return mockAuth.login();
    
    // Inicia fluxo OAuth - O redirecionamento acontece aqui
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      // Tratamento específico para provedor desativado
      if (error.message.includes("provider is not enabled")) {
         throw new Error("O login com Google não está ativado no painel do Supabase. Ative em Auth > Providers.");
      }
      throw error;
    }
    // Retorna undefined pois a página vai recarregar
  },

  logout: async () => {
    // Limpa chave de mock por segurança
    localStorage.removeItem(MOCK_STORAGE_KEY);
    
    if (!supabase) return mockAuth.logout();
    
    // Limpa sessão do Supabase
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao fazer logout:", error);
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return mockAuth.getCurrentUser();

    // 1. Pega usuário da sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // 2. Busca dados atualizados da tabela 'profiles' (créditos, plano)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      // Se não achou perfil mas tem sessão, pode ser delay do trigger ou erro.
      // Retorna dados básicos da sessão
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
  },

  consumeCredit: async (user: User): Promise<User | null> => {
    if (!supabase) return mockAuth.consumeCredit(user);
    if (user.isPro) return user;

    if (user.credits > 0) {
      // Decrementa no Backend (Segurança)
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

    // SIMULAÇÃO DE PAGAMENTO
    // Em produção, isso seria um Webhook do Stripe ouvindo 'checkout.session.completed'
    await new Promise(r => setTimeout(r, 2000));

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_pro: true, credits: 9999 }) // Marca como PRO
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