import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { billingConfigured, getOrCreateCustomer, PRICE_ID, siteUrl, stripe, TRIAL_DAYS, userFromRequest } from '../../../../lib/billing-server'

// Starts a Stripe Checkout page for CotizaFlow Pro and returns its URL.
export async function POST(request: Request) {
  if (!billingConfigured()) return NextResponse.json({ error: 'Billing is not set up yet.' }, { status: 501 })

  const user = await userFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  try {
    const customer = await getOrCreateCustomer(user)

    // Trial runs 14 days from sign-up (profiles.created_at, read with the user's own token).
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()
    const created = profile?.created_at ? new Date(profile.created_at).getTime() : new Date(user.created_at).getTime()
    // Anyone still in the trial isn't charged until it ends (Stripe needs it 2+ days away).
    const trialEnd = Math.floor((created + TRIAL_DAYS * 86400000) / 1000)
    const keepTrial = trialEnd > Math.floor(Date.now() / 1000) + 2 * 86400

    const base = siteUrl(request)
    const session = await stripe('checkout/sessions', {
      mode: 'subscription',
      customer: customer.id,
      client_reference_id: user.id,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { user_id: user.id },
        billing_mode: { type: 'flexible' }, // Stripe's recommended default for new subscriptions
        ...(keepTrial ? { trial_end: trialEnd } : {}),
      },
      success_url: `${base}/dashboard?billing=success`,
      cancel_url: `${base}/dashboard?billing=canceled`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Could not start checkout.' }, { status: 500 })
  }
}
