import { NextRequest, NextResponse } from 'next/server'

// POST /api/support/suggest - Generate an AI-suggested reply for a support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, messages, profile, checkouts, persistentPrompt, ticketPrompt, askOnly } = body

    if (!subject || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Subject and messages are required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Build conversation context for the AI
    const conversationHistory = messages.map((msg: { is_admin: boolean; message: string }) =>
      `${msg.is_admin ? 'Support Agent' : 'Customer'}: ${msg.message}`
    ).join('\n\n')

    // Build customer context from profile and checkouts
    let customerContext = ''
    if (profile) {
      const parts = []
      if (profile.name) parts.push(`Name: ${profile.name}`)
      if (profile.email) parts.push(`Email: ${profile.email}`)
      if (profile.age) parts.push(`Age: ${profile.age}`)
      if (profile.gender) parts.push(`Gender: ${profile.gender}`)
      if (profile.city || profile.country) parts.push(`Location: ${[profile.city, profile.country].filter(Boolean).join(', ')}`)
      if (profile.memberSince) parts.push(`Member since: ${new Date(profile.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`)
      if (parts.length > 0) {
        customerContext += `\n\nCustomer Profile:\n${parts.join('\n')}`
      }
    }
    if (checkouts && checkouts.length > 0) {
      const purchaseLines = checkouts.map((c: { product: string; amount: number; date: string }) =>
        `- ${c.product} (£${Number(c.amount).toFixed(2)}, ${new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})`
      ).join('\n')
      customerContext += `\n\nPurchase History (${checkouts.length} orders):\n${purchaseLines}`
    }

    const askOnlyInstructions = askOnly ? `

IMPORTANT: Your ONLY goal right now is to ask the customer a short follow-up question to gather more information. Do NOT try to resolve or fix anything. Just ask one clear, friendly question to understand their issue better or get details you need. Keep it to 1-2 sentences max.` : ''

    const systemPrompt = `You are a friendly customer support agent for Tempo Dating — an online speed dating platform. You communicate via live chat, NOT email. Write like you're texting a customer — short, casual, warm.

Key rules:
- Write 1-3 short sentences MAX. This is chat, not email.
- No greetings like "Dear" or sign-offs like "Best regards" or "Kind regards"
- No formal email language. Be casual and human.
- NEVER use em-dashes (—) or en-dashes (–). Use commas, periods, or just start a new sentence instead.
- Use the customer's first name naturally if you want, but don't force it
- Be warm but get to the point fast
- It's fine to use casual phrases like "Hey!", "No worries", "Got it!", "Let me check on that"

Context about Tempo Dating:
- Online speed dating events via Zoom
- Users book events, redeem codes, match with attendees
- Common issues: bookings, refunds, event access, matching, accounts

FAQ / Known Issues (use these to guide your questions):
- Male/female ticket mixup: If a customer says they were placed in the wrong gender group or matched incorrectly, ALWAYS ask which gender they selected when they registered. We need to know if this was a system glitch or a user mistake.
- Event access issues: Ask if they received the Zoom link email, and whether they checked spam/junk.
- Booking not showing: Ask them to confirm the email address they used to book, and whether they got a confirmation email.
- Didn't get matched: Ask which event they attended (date and time), and confirm they stayed for the full event.
- Redemption code not working: Ask them to share the exact code and any error message they see.
- Wrong event booked: Ask which event they meant to book vs which one they ended up with.

Guidelines:
- Your PRIMARY goal is to ask questions, not provide solutions. Always respond with a clarifying question about their issue.
- Do NOT try to solve or fix things. Ask what happened, when, what they expected, etc.
- Be empathetic but focus on gathering information
- Reference purchase history only when directly relevant
- Never make up policies — keep it general if unsure
- NEVER agree to cancel, refund, or process any financial action. These must be handled manually by a human.
- If someone asks for a refund or cancellation, be understanding but DO NOT confirm or promise it. Instead, acknowledge their frustration, ask a clarifying question about the issue, and let them know someone from the team will look into it personally.
- Your job is to keep the customer feeling heard and buy time until a real person can review the situation.${askOnlyInstructions}${persistentPrompt ? `\n\nAdditional instructions from the support manager:\n${persistentPrompt}` : ''}${ticketPrompt ? `\n\nSpecific instructions for this ticket:\n${ticketPrompt}` : ''}`

    const userPrompt = `Here is a live chat support ticket. Write a short chat reply.

Subject: ${subject}
${customerContext}

Conversation so far:
${conversationHistory}

Write ONLY the chat message — no preamble, no quotes, just the message. Keep it short like a real chat message (1-3 sentences).`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-235b-a22b-2507',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, await response.text())
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await response.json()
    const suggestion = data.choices?.[0]?.message?.content?.trim()

    if (!suggestion) {
      return NextResponse.json({ error: 'No suggestion generated' }, { status: 500 })
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('Support suggest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
