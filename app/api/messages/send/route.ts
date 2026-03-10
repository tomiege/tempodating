import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/messages/send - Send a message to another user
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { toUserId, message } = body

    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json({ error: 'toUserId is required' }, { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message must be under 2000 characters' }, { status: 400 })
    }

    if (toUserId === user.id) {
      return NextResponse.json({ error: 'Cannot send a message to yourself' }, { status: 400 })
    }

    // Verify recipient exists
    const serviceSupabase = createServiceSupabaseClient()
    const { data: recipient } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', toUserId)
      .single()

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const { data: newMessage, error } = await serviceSupabase
      .from('messages')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        message: message.trim(),
        is_read: false,
      })
      .select('id, from_user_id, to_user_id, message, is_read, created_at')
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error('Message send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
