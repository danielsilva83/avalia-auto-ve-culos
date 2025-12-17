// @ts-ignore: Deno types are not available in Node environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore: Deno.env is not defined in the local TypeScript context but is available in the Deno runtime.
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})