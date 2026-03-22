import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Send message from a persona account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personaId, toUserId, message } = body

    if (!personaId || !toUserId) {
      return NextResponse.json({ error: 'personaId and toUserId are required' }, { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message must be under 2000 characters' }, { status: 400 })
    }

    if (personaId === toUserId) {
      return NextResponse.json({ error: 'Cannot message self' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    const { data: newMessage, error } = await serviceSupabase
      .from('messages')
      .insert({
        from_user_id: personaId,
        to_user_id: toUserId,
        message: message.trim(),
        is_read: false,
      })
      .select('id, from_user_id, to_user_id, message, is_read, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error('Error in persona message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
