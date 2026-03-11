import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { service } = await request.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are a pricing assistant for a landscaping company in the Chicago area. 
          Suggest a fair price for this landscaping service: "${service}"
          
          Respond with ONLY a JSON object like this, nothing else:
          {"price": 150, "unit": "flat", "reason": "typical price for this service"}
          
          Units can be: hr, flat, sqft, day`
        }
      ]
    })
  })

  const data = await response.json()
  
  try {
    const text = data.content[0].text
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ price: 0, unit: "flat", reason: "Could not suggest price" })
  }
}