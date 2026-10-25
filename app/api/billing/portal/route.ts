import { NextResponse } from 'next/server'
import { billingConfigured, findCustomer, siteUrl, stripe, userFromRequest } from '../../../../lib/billing-server'

// Opens Stripe's billing page, where subscribers update their card, see receipts, or cancel.
export async function POST(request: Request) {
  if (!billingConfigured()) return NextResponse.json({ error: 'Billing is not set up yet.' }, { status: 501 })

  const user = await userFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  try {
    const customer = await findCustomer(user)
    if (!customer) return NextResponse.json({ error: 'No subscription found yet.' }, { status: 400 })
    const session = await stripe('billing_portal/sessions', { customer: customer.id, return_url: `${siteUrl(request)}/dashboard` })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err?.message || 'Could not open billing.' }, { status: 500 })
  }
}
