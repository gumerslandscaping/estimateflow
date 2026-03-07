import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { estimate } = await request.json()

  const lines = estimate.lines.map((l: any) => 
    `• ${l.description} — ${l.qty} ${l.unit} x $${l.rate} = $${(l.qty * l.rate).toFixed(2)}`
  ).join('\n')

  const subtotal = estimate.lines.reduce((s: number, l: any) => s + (l.qty * l.rate), 0)
  const tax = estimate.taxEnabled ? subtotal * 0.08 : 0
  const total = subtotal + tax

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: estimate.clientEmail,
      subject: `Estimate ${estimate.number} from Gumer's Landscaping`,
      text: `
Hi ${estimate.clientName},

Please find your estimate below:

Estimate #: ${estimate.number}
Date: ${estimate.issueDate}
Valid Until: ${estimate.expiryDate}

SERVICES:
${lines}

Subtotal: $${subtotal.toFixed(2)}
${estimate.taxEnabled ? `Tax (8%): $${tax.toFixed(2)}` : ''}
Total: $${total.toFixed(2)}

${estimate.notes ? `Notes: ${estimate.notes}` : ''}

Thank you for your business!
Gumer's Landscaping
      `.trim()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}