
import { supabase } from "./supabaseClient";
import { PixPaymentResponse } from "../types";

export const paymentService = {
  /**
   * Chama a Edge Function 'create-pix' para gerar um pagamento real no Mercado Pago
   */
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    if (!supabase) {
      throw new Error("Supabase não configurado.");
    }

    const { data, error } = await supabase.functions.invoke('create-pix', {
      body: { email, description: 'AvalIA Auto - Acesso PRO Vitalício' },
    });

    if (error) {
      console.error("Erro ao criar Pix:", error);
      throw new Error("Falha ao gerar QR Code. Tente novamente.");
    }

    return {
      paymentId: data.id,
      qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
      copyPasteCode: data.point_of_interaction.transaction_data.qr_code,
      status: data.status,
      ticketUrl: data.point_of_interaction.transaction_data.ticket_url
    };
  },

  /**
   * Verifica o status do pagamento.
   * Em produção, o ideal é ouvir Webhooks, mas polling funciona para MVP.
   */
  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    if (!supabase) return 'pending';

    // Opção 1: Consultar a Edge Function novamente (mais seguro se a chave MP estiver lá)
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { paymentId },
    });

    if (error) {
      return 'pending';
    }

    return data.status; // 'approved', 'pending', 'rejected'
  }
};
