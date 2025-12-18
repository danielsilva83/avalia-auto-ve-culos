
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para logs internos
const log = (msg: string, data?: any) => {
  console.log(`[MP-WEBHOOK] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
};

(Deno as any).serve(async (req: Request) => {
  // 1. Lidar com preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = (Deno as any).env.get('MP_ACCESS_TOKEN')?.trim();
    const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      log("Erro: Variáveis de ambiente não configuradas.");
      return new Response("Config Error", { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Tentar ler o corpo da requisição de forma segura
    const rawBody = await req.text();
    log("Payload bruto recebido:", rawBody);
    
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      log("Aviso: Falha ao parsear JSON do body, tentando query params.");
    }

    const url = new URL(req.url);
    
    // Mercado Pago envia o ID do recurso de várias formas dependendo da versão/evento
    const dataId = body.data?.id || body.id || url.searchParams.get('data.id') || url.searchParams.get('id');
    const type = body.type || body.action || url.searchParams.get('type') || url.searchParams.get('topic');

    log(`Processando: Evento=${type}, RecursoID=${dataId}`);

    // Só processamos se o tipo for pagamento
    if ((type === 'payment' || type?.includes('payment')) && dataId) {
      log(`Consultando status real do pagamento ${dataId} na API do Mercado Pago...`);
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!mpRes.ok) {
        log(`Erro ao consultar API do MP (Status: ${mpRes.status})`);
        // Retornamos 200 para o MP não ficar reenviando se for um erro de ID inválido (ex: teste antigo)
        return new Response("MP API Error", { status: 200 });
      }

      const paymentData = await mpRes.json();
      const status = paymentData.status;
      const userId = paymentData.external_reference;

      log(`Dados do Pagamento no MP: ID=${dataId}, Status=${status}, UserID=${userId}`);

      if (status === 'approved' && userId) {
        log(`PAGAMENTO APROVADO! Atualizando perfil do usuário ${userId}...`);

        const { data: updatedProfile, error: dbError } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true, 
            credits: 9999 
          })
          .eq('id', userId)
          .select();

        if (dbError) {
          log("Erro ao atualizar banco de dados:", dbError.message);
          return new Response("DB Error", { status: 200 });
        }
        
        log("SUCESSO: Perfil atualizado com sucesso!", updatedProfile);
      } else {
        log(`Pagamento ignorado: Status é ${status} (UserID: ${userId})`);
      }
    } else {
      log("Evento ignorado (não é um pagamento ou ID ausente).");
    }

    // Sempre retornar 200 ou 201 para o Mercado Pago dar baixa no Webhook
    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    log("Exceção Crítica no Webhook:", error.message);
    // Retornamos 200 para evitar loop de retentativas do MP se for um erro lógico interno
    return new Response(error.message, { status: 200 });
  }
})
