import { NextResponse } from 'next/server'
import { adminSupabase, stripe, verifyStripeSignature } from '../../../../lib/billing-server'

// Stripe calls this when a subscription starts, renews, changes, fails to pay, or is canceled.
// We copy the status onto the user's profile so the app knows whether they have access.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 })

  const payload = await request.text()
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  const event = JSON.parse(payload)
  const db = adminSupabase()

  const saveSubscription = async (sub: any) => {
    const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null
    const update = {
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      subscription_status: sub.status, // trialing, active, past_due, canceled, unpaid, incomplete…
      subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }
    const userId = sub.metadata?.user_id
    const q = db.from('profiles').update(update)
    const { error } = userId ? await q.eq('id', userId) : await q.eq('stripe_customer_id', update.stripe_customer_id)
    if (error) throw error
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const sub = await stripe(`subscriptions/${subId}`, undefined, 'GET')
          if (!sub.metadata?.user_id && session.client_reference_id) sub.metadata = { ...sub.metadata, user_id: session.client_reference_id }
          await saveSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await saveSubscription(event.data.object)
        break
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(err)
    // A 500 makes Stripe retry later.
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }
}
