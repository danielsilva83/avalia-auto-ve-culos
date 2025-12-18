
import { supabase } from "./supabaseClient";
import { authService } from "./authService";
import { PixPaymentResponse } from "../types";

const mockPaymentService = {
  createPixPayment: async (email: string): Promise<PixPaymentResponse> => {
    console.log("Modo Mock ativado para:", email);
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
    if (!supabase) {
      return mockPaymentService.createPixPayment(email);
    }

    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Usuário não identificado.");

      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { 
          email, 
          userId: user.id, // Enviando o ID do usuário logado
          description: 'AvalIA AI - Acesso PRO Vitalício' 
        },
      });

      if (error) {
        if (window.location.hostname === 'localhost') {
           return mockPaymentService.createPixPayment(email);
        }
        throw error;
      }

      return {
        paymentId: data.id.toString(),
        qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
        copyPasteCode: data.point_of_interaction.transaction_data.qr_code,
        status: data.status,
        ticketUrl: data.point_of_interaction.transaction_data.ticket_url
      };
    } catch (e: any) {
      console.error("Erro ao gerar PIX:", e.message);
      throw e;
    }
  },

  checkPaymentStatus: async (paymentId: string): Promise<string> => {
    if (!supabase || paymentId.startsWith('mock_')) {
      return mockPaymentService.checkPaymentStatus(paymentId);
    }

    try {
      // O polling agora apenas checa se o campo is_pro no banco mudou
      // O webhook será responsável por mudar esse campo.
      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .single();
      
      if (data?.is_pro) return 'approved';
      return 'pending';
    } catch (e) {
      return 'pending';
    }
  }
};
