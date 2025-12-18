
import { supabase } from "./supabaseClient";
import { authService } from "./authService";
import { PixPaymentResponse } from "../types";

const mockPaymentService = {
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    console.log("[MOCK] Criando pagamento simulado para:", email);
    await new Promise(r => setTimeout(r, 1500));
    localStorage.setItem('mock_payment_start', Date.now().toString());

    return {
      paymentId: "mock_" + Date.now(),
      qrCodeBase64: "", 
      copyPasteCode: "00020101021226580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913AvalIA AI Automóveis6008Brasilia62070503***6304ABCD",
      status: "pending"
    };
  },
  
  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    const startStr = localStorage.getItem('mock_payment_start');
    if (!startStr) return 'pending';
    const elapsed = Date.now() - parseInt(startStr);
    return elapsed > 8000 ? 'approved' : 'pending';
  }
};

export const paymentService = {
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    if (!supabase) return mockPaymentService.createPixPayment(email);

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Usuário não identificado.");

      console.log("[PaymentService] Chamando Edge Function create-pix...");
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { 
          email, 
          userId: user.id,
          description: 'AvalIA AI - Acesso PRO Vitalício' 
        },
      });

      if (error) {
        console.error("[PaymentService] Erro na Edge Function:", error);
        if (window.location.hostname === 'localhost') return mockPaymentService.createPixPayment(email);
        throw error;
      }

      console.log("[PaymentService] Pix gerado com sucesso. ID:", data.id);
      return {
        paymentId: data.id.toString(),
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || "",
        copyPasteCode: data.point_of_interaction?.transaction_data?.qr_code || "",
        status: data.status,
        ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url
      };
    } catch (e: any) {
      console.error("[PaymentService] Exceção ao gerar PIX:", e.message);
      throw e;
    }
  },

  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    // 1. Se for mock, usa a lógica de tempo
    if (paymentId.startsWith('mock_')) {
      return mockPaymentService.checkPaymentStatus(paymentId);
    }

    if (!supabase) return 'pending';

    try {
      // 2. Pegar o ID do usuário atual para checar o perfil dele
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("[checkPaymentStatus] Sem sessão de usuário ativa.");
        return 'pending';
      }

      console.log(`[checkPaymentStatus] Verificando DB para user: ${user.id} (Payment: ${paymentId})`);

      // 3. Consultar o banco de dados diretamente
      // Usamos uma consulta simples para verificar se o Webhook já atualizou o is_pro
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("[checkPaymentStatus] Erro na consulta ao banco:", error.message);
        return 'pending';
      }
      
      console.log("[checkPaymentStatus] Resultado do banco - is_pro:", data?.is_pro);
      
      // Se is_pro for true, o pagamento foi aprovado e processado pelo Webhook
      return data?.is_pro ? 'approved' : 'pending';
    } catch (e: any) {
      console.error("[checkPaymentStatus] Exceção inesperada:", e.message);
      return 'pending';
    }
  }
};
