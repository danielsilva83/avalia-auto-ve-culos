
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

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Webhook Error] Variáveis de ambiente faltando.");
      return new Response("Config Error", { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Tentar ler o corpo da requisição para logs e processamento
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    
    // Mercado Pago pode enviar dados via query params ou body (depende da versão do Webhook)
    const type = body.type || body.action || url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = body.data?.id || url.searchParams.get('id') || url.searchParams.get('data.id');

    console.log(`[Webhook Received] Payload:`, JSON.stringify({ type, dataId, body }));

    // 2. Filtrar apenas notificações de pagamento aprovado ou criado
    // O MP envia 'payment' ou 'payment.created' / 'payment.updated'
    if ((type === 'payment' || type?.includes('payment')) && dataId) {
      console.log(`[Webhook] Consultando pagamento ${dataId} no Mercado Pago...`);
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });
      
      if (!mpRes.ok) {
        console.error(`[Webhook Error] Falha ao consultar MP: ${mpRes.status}`);
        return new Response("MP API Error", { status: mpRes.status });
      }

      const paymentData = await mpRes.json();
      console.log(`[Webhook] Status do pagamento ${dataId}: ${paymentData.status}`);

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;
        
        if (!userId) {
          console.error(`[Webhook Error] Pagamento aprovado mas 'external_reference' (userId) está vazio! ID: ${dataId}`);
          return new Response("No user reference", { status: 200 }); // Retornamos 200 para o MP não repetir
        }

        console.log(`[Webhook] Ativando PRO para usuário: ${userId}`);

        // 3. Atualizar o banco de dados
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true, 
            credits: 9999 
          })
          .eq('id', userId)
          .select();

        if (updateError) {
          console.error("[Webhook Error] Erro ao atualizar profiles:", updateError);
          return new Response("DB Update Error", { status: 500 });
        }
        
        console.log(`[Webhook Success] Perfil atualizado para ${userId}. Resultado:`, JSON.stringify(updateData));
      } else {
        console.log(`[Webhook] Pagamento ${dataId} ignorado (status: ${paymentData.status})`);
      }
    } else {
      console.log(`[Webhook] Notificação ignorada (tipo irrelevante ou sem ID): ${type}`);
    }

    // Sempre retornar 200 ou 201 para o Mercado Pago
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    console.error("[Webhook Exception]:", error.message);
    return new Response(error.message, { status: 400 });
  }
})
