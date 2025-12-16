import { supabase } from "./supabaseClient";
import { PixPaymentResponse } from "../types";

// --- MOCK SERVICE (Para testes sem Backend) ---
const mockPaymentService = {
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    console.log("Creating MOCK Pix payment for", email);
    await new Promise(r => setTimeout(r, 1500)); // Simula delay de rede
    
    // Marca o tempo de início para simular a aprovação depois
    localStorage.setItem('mock_payment_start', Date.now().toString());

    return {
      paymentId: "mock_id_" + Date.now(),
      // Deixamos vazio aqui para o Frontend usar uma imagem placeholder
      qrCodeBase64: "", 
      copyPasteCode: "00020101021226580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Avalia Auto6008Brasilia62070503***6304ABCD",
      status: "pending"
    };
  },
  
  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    const startStr = localStorage.getItem('mock_payment_start');
    if (!startStr) return 'pending';
    
    const elapsed = Date.now() - parseInt(startStr);
    // Aprova automaticamente após 8 segundos
    if (elapsed > 8000) {
        return 'approved';
    }
    return 'pending';
  }
};

export const paymentService = {
  /**
   * Chama a Edge Function 'create-pix' para gerar um pagamento real no Mercado Pago
   * Se o Supabase não estiver configurado, usa o Mock.
   */
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    if (!supabase) {
      console.warn("Supabase não detectado. Usando serviço de pagamento MOCK.");
      return mockPaymentService.createPixPayment(email);
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { email, description: 'AvalIA Auto - Acesso PRO Vitalício' },
      });

      if (error) {
        console.error("Erro na Edge Function (create-pix):", error);
        throw error;
      }

      return {
        paymentId: data.id,
        qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
        copyPasteCode: data.point_of_interaction.transaction_data.qr_code,
        status: data.status,
        ticketUrl: data.point_of_interaction.transaction_data.ticket_url
      };
    } catch (e) {
      console.error("Falha ao criar Pix real. Caindo para Mock (apenas dev) ou lançando erro.", e);
      // Descomente a linha abaixo se quiser forçar o Mock em caso de erro no backend durante dev
      // return mockPaymentService.createPixPayment(email);
      throw new Error("Não foi possível gerar o pagamento. Tente novamente mais tarde.");
    }
  },

  /**
   * Verifica o status do pagamento.
   */
  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    if (!supabase || paymentId.startsWith('mock_')) {
      return mockPaymentService.checkPaymentStatus(paymentId);
    }

    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { paymentId },
    });

    if (error) {
      return 'pending';
    }

    return data.status; // 'approved', 'pending', 'rejected'
  }
};