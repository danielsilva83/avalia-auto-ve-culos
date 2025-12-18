
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(Deno as any).serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MP_ACCESS_TOKEN = (Deno as any).env.get('MP_ACCESS_TOKEN')?.trim();
    const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Inicializa Supabase com Service Role para poder editar o perfil sem restrições de RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || (await req.json().catch(() => ({}))).type;
    const dataId = url.searchParams.get('data.id') || (await req.json().catch(() => ({}))).data?.id;

    console.log(`[Webhook] Recebido tipo: ${type}, ID: ${dataId}`);

    // Somente processamos notificações de pagamento
    if (type === 'payment' && dataId) {
      // 1. Validar o status do pagamento diretamente na API do Mercado Pago (Segurança)
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });
      
      const paymentData = await mpRes.json();

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;
        console.log(`[Webhook] Pagamento APROVADO para o usuário: ${userId}`);

        // 2. Atualizar o perfil do usuário no Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true, 
            credits: 9999 
          })
          .eq('id', userId);

        if (error) {
          console.error("[Webhook] Erro ao atualizar perfil:", error);
          return new Response("Erro ao atualizar banco", { status: 500 });
        }
        
        console.log("[Webhook] Usuário promovido a PRO com sucesso.");
      }
    }

    // O Mercado Pago exige resposta 200 ou 201 para não reenviar a notificação
    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    console.error("[Webhook Exception]:", error.message);
    return new Response(error.message, { status: 400 });
  }
})
