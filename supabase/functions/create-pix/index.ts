// supabase/functions/create-pix/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

serve(async (req) => {
  // Configuração de CORS para o Frontend conseguir chamar
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { email, description } = await req.json()

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: 47.90, // Valor fixo do seu App
        description: description,
        payment_method_id: 'pix',
        payer: { email: email }
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: response.status
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})