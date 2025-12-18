
import { supabase } from "./supabaseClient";
import { authService } from "./authService";
import { PixPaymentResponse } from "../types";

export const paymentService = {
  /**
   * Solicita a geração de um PIX real via Edge Function do Supabase.
   */
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    if (!supabase) {
      throw new Error("Conexão com banco de dados não disponível.");
    }

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Usuário não identificado.");

      console.log("[PaymentService] Solicitando PIX real para:", user.id);
      
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { 
          email, 
          userId: user.id,
          description: 'AvalIA AI - Acesso PRO Vitalício' 
        },
      });

      if (error) {
        console.error("[PaymentService] Erro retornado pela Edge Function:", error);
        throw new Error(error.message || "Falha ao processar pagamento com Mercado Pago.");
      }

      console.log("[PaymentService] PIX gerado com sucesso pelo MP.");
      
      return {
        paymentId: data.id.toString(),
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || "",
        copyPasteCode: data.point_of_interaction?.transaction_data?.qr_code || "",
        status: data.status,
        ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url
      };
    } catch (e: any) {
      console.error("[PaymentService] Exceção crítica ao gerar PIX:", e.message);
      throw e;
    }
  },

  /**
   * Verifica se o usuário tornou-se PRO no banco de dados.
   * O Webhook 'mp-webhook' é responsável por mudar este status no banco
   * assim que o Mercado Pago confirma o recebimento.
   */
  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    if (!supabase) {
      console.warn("[checkPaymentStatus] Supabase não configurado.");
      return 'pending';
    }

    try {
      // Obtemos o usuário logado para verificar o status dele no perfil
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn("[checkPaymentStatus] Usuário perdeu a sessão durante o polling.");
        return 'pending';
      }

      // Consulta direta à tabela de profiles para verificar se o campo is_pro mudou para true
      // Usamos .select('is_pro') e desativamos cache implícito
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("[checkPaymentStatus] Erro ao consultar status no banco:", error.message);
        return 'pending';
      }
      
      const isPro = data?.is_pro === true;
      console.log(`[Polling DB] User: ${user.id} | Status PRO: ${isPro}`);
      
      // Se is_pro for true, significa que o Webhook já recebeu a confirmação do MP
      return isPro ? 'approved' : 'pending';
    } catch (e: any) {
      console.error("[checkPaymentStatus] Erro inesperado no polling:", e.message);
      return 'pending';
    }
  }
};
