
// Cabeçalhos CORS padrão para permitir chamadas do navegador
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Fix: Use any casting for Deno global as the local TS environment (React/Vite) doesn't recognize Deno runtime properties
(Deno as any).serve(async (req: Request) => {
  // 1. Lidar com a requisição de Preflight do navegador (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // 2. Recuperar Token do Mercado Pago dos segredos do Supabase
    // Fix: Access environment variables using (Deno as any) to satisfy the TypeScript compiler in a non-Deno workspace
    const MP_ACCESS_TOKEN = (Deno as any).env.get('MP_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      console.error("FALHA CRÍTICA: MP_ACCESS_TOKEN não encontrado no ambiente.");
      return new Response(
        JSON.stringify({ error: 'Erro interno: Token de pagamento não configurado.' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // 3. Parsear o corpo da requisição
    const { email, description } = await req.json()
    console.log(`[LOG] Iniciando geração de PIX para: ${email}`);

    // 4. Chamada à API do Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID() // Evita duplicidade
      },
      body: JSON.stringify({
        transaction_amount: 47.90,
        description: description || 'AvalIA AI Automóveis - Acesso PRO',
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: 'Cliente',
          last_name: 'AvalIA'
        }
      })
    })

    const data = await mpResponse.json()

    // 5. Verificar se o Mercado Pago aceitou a requisição
    if (!mpResponse.ok) {
      console.error("[ERRO MP]:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'O provedor de pagamentos recusou a transação.', 
          details: data 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: mpResponse.status 
        }
      )
    }
    
    // 6. Retornar dados do PIX (QR Code e Copia e Cola)
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("[ERRO FATAL]:", error.message);
    return new Response(
      JSON.stringify({ error: 'Erro inesperado no servidor de pagamentos.', message: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})
