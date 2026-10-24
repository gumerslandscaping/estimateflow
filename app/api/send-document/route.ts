import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Sends an invoice/estimate email with the PDF attached. Only signed-in users can use it.
export async function POST(request: NextRequest) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const { to, subject, message, filename, pdfBase64, replyTo } = await request.json()
  if (!to || !pdfBase64) return NextResponse.json({ error: 'Missing email address or PDF.' }, { status: 400 })

  const safeName = String(filename || 'document.pdf').replace(/[^\w.\- ]/g, '') || 'document.pdf'

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to,
      replyTo: replyTo || user.email || undefined,
      subject: subject || 'Your document',
      text: message || 'Please find your document attached.',
      attachments: [{ filename: safeName, content: Buffer.from(pdfBase64, 'base64') }],
    })
    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message || 'Email service rejected the message.' }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
  }
}
