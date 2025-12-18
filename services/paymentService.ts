
import { supabase } from "./supabaseClient";
import { authService } from "./authService";
import { PixPaymentResponse } from "../types";

export const paymentService = {
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    if (!supabase) throw new Error("Banco de dados indisponível.");

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { 
          email, 
          userId: user.id,
          description: 'AvalIA AI - Acesso PRO Vitalício' 
        },
      });

      if (error) throw new Error(error.message || "Erro ao gerar PIX.");

      return {
        paymentId: data.id.toString(),
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || "",
        copyPasteCode: data.point_of_interaction?.transaction_data?.qr_code || "",
        status: data.status,
        ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url
      };
    } catch (e: any) {
      console.error("[PaymentService] Erro:", e.message);
      throw e;
    }
  },

  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    if (!supabase) return 'pending';

    try {
      // O polling agora verifica apenas se o status is_pro mudou no banco.
      // O Webhook é quem faz essa mudança.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'pending';

      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      
      if (error) return 'pending';
      
      console.log(`[Polling] User: ${user.id} | is_pro: ${data?.is_pro}`);
      return data?.is_pro ? 'approved' : 'pending';
    } catch (e) {
      return 'pending';
    }
  }
};
