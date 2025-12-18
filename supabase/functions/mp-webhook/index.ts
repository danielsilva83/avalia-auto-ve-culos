
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(Deno as any).serve(async (req: Request) => {
  // 1. Responder ao preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const executionId = crypto.randomUUID().split('-')[0];
  console.log(`[${executionId}] --- NOVA NOTIFICAÇÃO RECEBIDA ---`);

  try {
    const MP_ACCESS_TOKEN = (Deno as any).env.get('MP_ACCESS_TOKEN')?.trim();
    const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[${executionId}] Erro: Variáveis de ambiente faltando no Supabase.`);
      return new Response("Internal Config Error", { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Extrair dados da URL (Mercado Pago IPN usa muito query params)
    const url = new URL(req.url);
    const urlId = url.searchParams.get('id') || url.searchParams.get('data.id');
    const urlTopic = url.searchParams.get('topic') || url.searchParams.get('type');

    // 3. Extrair dados do Corpo (Webhooks usam JSON)
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
        console.log(`[${executionId}] Body JSON:`, JSON.stringify(body));
      }
    } catch (e) {
      console.log(`[${executionId}] Sem corpo JSON ou erro no parse.`);
    }

    // Prioridade para ID do corpo, depois URL
    const dataId = body.data?.id || body.id || urlId;
    const type = body.type || body.action || urlTopic;

    console.log(`[${executionId}] Evento detectado: ${type} | ID do Recurso: ${dataId}`);

    // Se for pagamento (payment), buscamos o status real na API do Mercado Pago
    if (dataId && (type === 'payment' || type?.includes('payment'))) {
      console.log(`[${executionId}] Buscando detalhes do pagamento ${dataId} no Mercado Pago...`);
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!mpRes.ok) {
        const errText = await mpRes.text();
        console.error(`[${executionId}] Erro API Mercado Pago: ${mpRes.status} - ${errText}`);
        // Retornamos 200 para o MP parar de tentar se o erro for 404 (pagamento antigo/inexistente)
        return new Response("OK", { status: 200 });
      }

      const paymentData = await mpRes.json();
      const status = paymentData.status;
      const statusDetail = paymentData.status_detail;
      const userId = paymentData.external_reference;

      console.log(`[${executionId}] Resultado MP: Status=${status} | Detalhe=${statusDetail} | User=${userId}`);

      if (status === 'approved' && userId) {
        console.log(`[${executionId}] PAGAMENTO CONFIRMADO! Atualizando banco para PRO...`);

        const { data: updated, error: dbError } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true, 
            credits: 9999 
          })
          .eq('id', userId)
          .select();

        if (dbError) {
          console.error(`[${executionId}] Erro ao atualizar profile:`, dbError.message);
        } else {
          console.log(`[${executionId}] SUCESSO! Usuário ${userId} agora é PRO.`, JSON.stringify(updated));
        }
      } else {
        console.log(`[${executionId}] Pagamento ainda não aprovado (Status: ${status}). Aguardando próxima notificação.`);
      }
    }

    // SEMPRE retorne 200/201 para o Mercado Pago não reenviar a mesma notificação infinitamente
    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    console.error(`[${executionId}] Exceção crítica:`, error.message);
    return new Response("Internal Error", { status: 200 });
  }
})
