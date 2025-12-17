// supabase/functions/mp-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { action, data } = await req.json()

  if (action === "payment.updated") {
    const paymentId = data.id
    // 1. Consulta o Mercado Pago para ver se foi aprovado
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` }
    })
    const paymentData = await mpRes.json()

    if (paymentData.status === 'approved') {
      // 2. Conecta no seu banco e libera o PRO para o usuário
      const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
      const email = paymentData.payer.email

      await supabase
        .from('profiles')
        .update({ is_pro: true, credits: 9999 })
        .eq('email', email)
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})