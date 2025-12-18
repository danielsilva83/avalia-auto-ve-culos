
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

(Deno as any).serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const MP_ACCESS_TOKEN = (Deno as any).env.get('MP_ACCESS_TOKEN')?.trim();
    const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL'); // URL base do seu projeto Supabase
    
    if (!MP_ACCESS_TOKEN || !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'Configuração pendente no servidor.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      })
    }

    const body = await req.json()
    const { email, userId, description } = body // Recebemos o userId agora

    if (!userId) {
      return new Response(JSON.stringify({ error: 'UserId é obrigatório.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      })
    }

    const notification_url = `${SUPABASE_URL}/functions/v1/mp-webhook`;

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: 0.01,
        description: description || 'AvalIA AI Automóveis - PRO',
        payment_method_id: 'pix',
        external_reference: userId, // Vínculo crucial para o Webhook
        notification_url: notification_url, // Onde o MP vai "bater" avisando que pagou
        payer: {
          email: email,
          first_name: 'Cliente',
          last_name: 'AvalIA'
        }
      })
    })

    const data = await mpResponse.json()
    if (!mpResponse.ok) {
      return new Response(JSON.stringify({ error: 'Erro no Mercado Pago', details: data }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: mpResponse.status 
      })
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})
