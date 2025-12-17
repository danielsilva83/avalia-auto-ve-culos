
// Cabeçalhos CORS para permitir chamadas do seu domínio na Vercel
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// O Supabase utiliza o Deno como runtime.
(Deno as any).serve(async (req: Request) => {
  // 1. Resposta obrigatória para o Preflight (requisição OPTIONS do navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const rawToken = (Deno as any).env.get('MP_ACCESS_TOKEN');
    const MP_ACCESS_TOKEN = rawToken?.trim();
    
    if (!MP_ACCESS_TOKEN) {
      console.error("ERRO: MP_ACCESS_TOKEN não configurado nos Secrets do Supabase.");
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta (Token ausente).' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Verifica se é um token de teste para alertar o desenvolvedor nos logs
    if (MP_ACCESS_TOKEN.startsWith('TEST-')) {
      console.warn("[AVISO] Você está usando um TOKEN DE TESTE. O PIX pode falhar com 'Unauthorized use of live credentials'.");
    }

    const body = await req.json()
    const { email, description } = body
    
    console.log(`[PIX] Iniciando requisição para MP: ${email}`);

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: 0.01, // Para teste real, você pode mudar para 0.01
        description: description || 'AvalIA AI Automóveis - PRO',
        payment_method_id: 'pix',
        installments: 1,
        payer: {
          email: email,
          first_name: 'Cliente',
          last_name: 'AvalIA'
        }
      })
    })

    const data = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("[ERRO MP DETALHADO]:", JSON.stringify(data, null, 2));
      
      let friendlyMessage = 'O provedor de pagamentos recusou a transação.';
      if (data.message === 'Unauthorized use of live credentials') {
        friendlyMessage = 'Erro de Credenciais: O PIX exige um Access Token de Produção (APP_USR-...) e conta homologada.';
      }

      return new Response(
        JSON.stringify({ 
          error: friendlyMessage, 
          raw_error: data.message,
          status: mpResponse.status 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: mpResponse.status }
      )
    }
    
    console.log(`[PIX] Sucesso ao gerar pagamento: ${data.id}`);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("[ERRO EXCEPTION]:", error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar pagamento.', detail: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
