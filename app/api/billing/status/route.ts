import { NextResponse } from 'next/server'
import { billingConfigured, currentSubscription, findCustomer, periodEnd, userFromRequest } from '../../../../lib/billing-server'

// Asks Stripe whether the signed-in user has a subscription.
export async function GET(request: Request) {
  if (!billingConfigured()) return NextResponse.json({ configured: false })

  const user = await userFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  try {
    const customer = await findCustomer(user)
    if (!customer) return NextResponse.json({ configured: true, status: '', periodEnd: null, hasCustomer: false })
    const sub = await currentSubscription(customer.id)
    return NextResponse.json({
      configured: true,
      status: sub?.status || '',
      periodEnd: periodEnd(sub),
      cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
      hasCustomer: true,
    })
  } catch (err: any) {
    console.error(err)
    // If Stripe can't be reached, don't lock anyone out.
    return NextResponse.json({ configured: true, error: 'unavailable' }, { status: 503 })
  }
}
