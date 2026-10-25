// Server-only helpers for Stripe billing. Talks to Stripe's REST API directly (no SDK needed).
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const TRIAL_DAYS = 14

export function billingConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Supabase client with the service role key: can update billing columns, bypassing row security.
export function adminSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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

export async function stripe(path: string, params?: Record<string, any>, method: 'GET' | 'POST' = 'POST') {
  const body = params ? encode(params).join('&') : undefined
  const url = `https://api.stripe.com/v1/${path}${method === 'GET' && body ? `?${body}` : ''}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' ? body : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message || `Stripe error ${res.status}`)
  return json
}

// Checks the Stripe-Signature header so only real Stripe events are accepted.
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=') as [string, string]).filter(p => p.length === 2))
  const signatures = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3))
  const t = Number(parts.t)
  if (!t || !signatures.length) return false
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')
  return signatures.some(sig => {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  })
}

export function siteUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
}
