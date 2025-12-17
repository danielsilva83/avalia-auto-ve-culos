
// @ts-ignore: Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Tratamento de Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // Fix: Accessing Deno.env through a type assertion to satisfy the compiler when Deno types are not fully loaded in the environment.
    const MP_ACCESS_TOKEN = (Deno as any).env.get('MP_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      console.error("ERRO: MP_ACCESS_TOKEN não configurado nos Secrets do Supabase.");
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta (Token MP ausente).' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { email, description } = await req.json()
    console.log(`Gerando PIX para: ${email}`);

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: 47.90,
        description: description || 'AvalIA AI Automóveis - PRO',
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: 'Cliente',
          last_name: 'AvalIA'
        }
      })
    })

    const data = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Erro no Mercado Pago:", data);
      return new Response(
        JSON.stringify({ error: 'Mercado Pago recusou a requisição.', details: data }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: mpResponse.status }
      )
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("Erro fatal na Edge Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
