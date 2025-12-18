
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Logs iniciais para depuração
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    
    const type = body.type || body.action || url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = body.data?.id || url.searchParams.get('id') || url.searchParams.get('data.id');

    console.log(`[MP-WEBHOOK] Notificação recebida: type=${type}, dataId=${dataId}`);

    if ((type === 'payment' || type?.includes('payment')) && dataId) {
      console.log(`[MP-WEBHOOK] Validando pagamento ${dataId} via API Mercado Pago...`);
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });
      
      if (!mpRes.ok) {
        console.error(`[MP-WEBHOOK] Erro ao consultar MP: ${mpRes.status}`);
        return new Response("Error MP API", { status: 200 }); // Retornar 200 para o MP parar de tentar
      }

      const paymentData = await mpRes.json();
      const status = paymentData.status;
      const userId = paymentData.external_reference;

      console.log(`[MP-WEBHOOK] Pagamento ${dataId} está com status: ${status} para o User: ${userId}`);

      if (status === 'approved' && userId) {
        console.log(`[MP-WEBHOOK] APROVADO! Atualizando banco para o usuário ${userId}...`);

        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            is_pro: true, 
            credits: 9999 
          })
          .eq('id', userId)
          .select();

        if (error) {
          console.error("[MP-WEBHOOK] Erro ao atualizar perfil no Supabase:", error.message);
          return new Response("DB Error", { status: 200 });
        }
        
        console.log("[MP-WEBHOOK] SUCESSO! Perfil atualizado para PRO.", JSON.stringify(data));
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error: any) {
    console.error("[MP-WEBHOOK] Exceção crítica:", error.message);
    return new Response(error.message, { status: 200 });
  }
})
