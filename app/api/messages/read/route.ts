import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/messages/read - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromUserId } = body

    if (!fromUserId || typeof fromUserId !== 'string') {
      return NextResponse.json({ error: 'fromUserId is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Mark all messages from this sender to the current user as read
    const { error } = await serviceSupabase
      .from('messages')
      .update({ is_read: true })
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
