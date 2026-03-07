import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { estimate } = await request.json()

  const lines = estimate.lines.map((l: any) =>
    `${l.description}: ${l.qty} ${l.unit} x $${l.rate} = $${(l.qty * l.rate).toFixed(2)}`
  ).join('\n')

  const subtotal = estimate.lines.reduce((s: number, l: any) => s + (l.qty * l.rate), 0)
  const tax = estimate.taxEnabled ? subtotal * 0.08 : 0
  const total = subtotal + tax

  const body = `Hi ${estimate.clientName}! Your estimate ${estimate.number}:\n\n${lines}\n\nTotal: $${total.toFixed(2)}\nValid until: ${estimate.expiryDate}`

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER!,
          To: estimate.clientPhone,
          Body: body,
        }).toString(),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
