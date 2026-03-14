import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/support/suggest - Generate an AI-suggested reply for a support ticket
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, messages, profile, checkouts, persistentPrompt, ticketPrompt } = body

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

    const systemPrompt = `You are a friendly, professional customer support agent for Tempo Dating — an online speed dating platform. Be concise, very polite, and understanding. Keep replies short and to the point — under 100 words unless more detail is genuinely needed.

Key context about Tempo Dating:
- We run online speed dating events via Zoom
- Users can book events, redeem codes, and match with other attendees
- Common issues: booking problems, refunds, event access, matching questions, account issues

Guidelines:
- Be empathetic, warm, and solution-oriented
- Keep it brief — customers appreciate a quick, clear response
- Use the customer's name if available
- Reference their purchase history when relevant to the issue
- If you don't have enough info to resolve the issue, ask a clear follow-up question
- Never make up policies or promises — keep it general if unsure
- Sign off naturally (no need for "Best regards" every time)${persistentPrompt ? `\n\nAdditional instructions from the support manager:\n${persistentPrompt}` : ''}${ticketPrompt ? `\n\nSpecific instructions for this ticket:\n${ticketPrompt}` : ''}`

    const userPrompt = `Here is a support ticket. Write a suggested reply for the support agent to send.

Subject: ${subject}
${customerContext}

Conversation so far:
${conversationHistory}

Write ONLY the reply message — no preamble, no "Here's a suggested reply:", just the actual message text the agent would send to the customer.`

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
