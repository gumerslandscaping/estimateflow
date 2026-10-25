import { NextResponse } from 'next/server'
import { adminSupabase, billingConfigured, siteUrl, stripe, TRIAL_DAYS, userFromRequest } from '../../../../lib/billing-server'

// Starts a Stripe Checkout page for CotizaFlow Pro and returns its URL.
export async function POST(request: Request) {
  if (!billingConfigured()) return NextResponse.json({ error: 'Billing is not set up yet.' }, { status: 501 })

  const user = await userFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const db = adminSupabase()
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()

  try {
    // Reuse the Stripe customer if this user already has one.
    let customerId: string | null = profile?.stripe_customer_id || null
    if (!customerId) {
      const customer = await stripe('customers', { email: user.email, metadata: { user_id: user.id } })
      customerId = customer.id
      await db.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // Anyone still inside the free trial isn't charged until it ends.
    // (Stripe needs the trial end to be at least 2 days away.)
    const created = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now()
    const trialEnd = Math.floor((created + TRIAL_DAYS * 86400000) / 1000)
    const keepTrial = trialEnd > Math.floor(Date.now() / 1000) + 2 * 86400

    const base = siteUrl(request)
    const session = await stripe('checkout/sessions', {
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { user_id: user.id }, ...(keepTrial ? { trial_end: trialEnd } : {}) },
      success_url: `${base}/dashboard?billing=success`,
      cancel_url: `${base}/dashboard?billing=canceled`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Could not start checkout.' }, { status: 500 })
  }
}
