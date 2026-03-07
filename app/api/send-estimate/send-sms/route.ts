import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: NextRequest) {
  const { estimate } = await request.json()

  const lines = estimate.lines.map((l: any) =>
    `${l.description}: ${l.qty} ${l.unit} x $${l.rate} = $${(l.qty * l.rate).toFixed(2)}`
  ).join('\n')

  const subtotal = estimate.lines.reduce((s: number, l: any) => s + (l.qty * l.rate), 0)
  const tax = estimate.taxEnabled ? subtotal * 0.08 : 0
  const total = subtotal + tax

  try {
    await client.messages.create({
      body: `Hi ${estimate.clientName}! Your estimate ${estimate.number} from Gumer's Landscaping:\n\n${lines}\n\nTotal: $${total.toFixed(2)}\nValid until: ${estimate.expiryDate}\n\nReply to this message with any questions!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: estimate.clientPhone
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}