// Server-only helpers for Stripe billing. Talks to Stripe's REST API directly (no SDK needed).
// Stripe is the source of truth: we ask it whether a user has paid, so no database columns,
// webhooks, or extra keys are needed. Only STRIPE_SECRET_KEY has to be set in Vercel.
import { createClient } from '@supabase/supabase-js'

export const TRIAL_DAYS = 14

// CotizaFlow Pro, $19/month. STRIPE_PRICE_ID in Vercel overrides it (e.g. for live mode).
export const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1UUF8MJ9eAMjXDXTAIGetfty'

// Pinned so a Stripe-side upgrade can't change response shapes under us.
export const STRIPE_API_VERSION = '2025-06-30.basil'

export function billingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

// Who is calling? Uses the Supabase access token the browser sends as "Authorization: Bearer …".
export async function userFromRequest(request: Request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await sb.auth.getUser(token)
  return user || null
}

// Turns { a: { b: [ { c: 1 } ] } } into a[b][0][c]=1, the form encoding Stripe expects.
function encode(params: Record<string, any>, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (typeof v === 'object') out.push(...encode(v, key))
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
  }
  return out
}

export async function stripe(path: string, params?: Record<string, any>, method: 'GET' | 'POST' = 'POST', idempotencyKey?: string) {
  const body = params ? encode(params).join('&') : undefined
  const url = `https://api.stripe.com/v1/${path}${method === 'GET' && body ? `?${body}` : ''}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Version': STRIPE_API_VERSION,
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
  const res = await fetch(url, { method, headers, body: method === 'POST' ? body : undefined })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Stripe error ${res.status}`)
  return json
}

// The Stripe customer for this CotizaFlow user (matched by the user id we store on the customer).
export async function findCustomer(user: { id: string; email?: string | null }): Promise<any | null> {
  if (!user.email) return null
  const list = await stripe('customers', { email: user.email, limit: 10 }, 'GET')
  const all: any[] = list.data || []
  return all.find(c => c.metadata?.user_id === user.id) || null
}

export async function getOrCreateCustomer(user: { id: string; email?: string | null }) {
  const existing = await findCustomer(user)
  if (existing) return existing
  // Idempotency key: a double-tap on Subscribe can't create two Stripe customers.
  return stripe('customers', { email: user.email, metadata: { user_id: user.id } }, 'POST', `customer-${user.id}`)
}

// The customer's most relevant subscription: a live one if any, otherwise the most recent.
export async function currentSubscription(customerId: string): Promise<any | null> {
  const list = await stripe('subscriptions', { customer: customerId, status: 'all', limit: 10 }, 'GET')
  const subs: any[] = list.data || []
  const rank = (s: any) => (['active', 'trialing'].includes(s.status) ? 0 : s.status === 'past_due' ? 1 : 2)
  subs.sort((a, b) => rank(a) - rank(b) || b.created - a.created)
  return subs[0] || null
}

export function periodEnd(sub: any): string | null {
  const ts = sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end ?? null
  return ts ? new Date(ts * 1000).toISOString() : null
}

export function siteUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
}
