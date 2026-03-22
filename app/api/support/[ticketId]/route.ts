import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/support/[ticketId] - Get a ticket with all its messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const serviceSupabase = createServiceSupabaseClient()
    const adminParam = new URL(request.url).searchParams.get('admin') === 'true'

    // Try to get the authenticated user (optional for admin requests)
    const authSupabase = await createServerSupabaseClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    // Get the ticket
    const { data: ticket, error: ticketError } = await serviceSupabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Non-admin users must be authenticated and can only see their own tickets
    if (!adminParam) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const isOwner = ticket.user_id === user.id
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get messages for this ticket
    const { data: messages, error: messagesError } = await serviceSupabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching support messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // If admin request, also fetch user profile and checkouts
    if (adminParam) {
      const [profileResult, checkoutsResult] = await Promise.all([
        serviceSupabase
          .from('users')
          .select('id, email, full_name, age, city, country, bio, contact_info, is_male, avatar_url, personality_quiz_result, created_at')
          .eq('id', ticket.user_id)
          .single(),
        serviceSupabase
          .from('checkout')
          .select('checkout_id, product_type, product_id, product_description, total_order, checkout_time, email, name, is_male, query_city')
          .eq('user_id', ticket.user_id)
          .order('checkout_time', { ascending: false })
          .limit(20),
      ])

      return NextResponse.json({
        ticket,
        messages,
        profile: profileResult.data || null,
        checkouts: checkoutsResult.data || [],
      })
    }

    return NextResponse.json({ ticket, messages })
  } catch (error) {
    console.error('Support ticket GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/support/[ticketId] - Add a message to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const body = await request.json()
    const { message, isAdmin } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Admin replies use service client directly; user replies require auth
    let userId: string | null
    if (isAdmin) {
      userId = null
    } else {
      const authSupabase = await createServerSupabaseClient()
      const { data: { user }, error: authError } = await authSupabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await serviceSupabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Non-admin users can only message their own tickets
    if (!isAdmin && ticket.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert the message
    const { data: newMessage, error: messageError } = await serviceSupabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        message: message.trim().slice(0, 5000),
        is_admin: !!isAdmin,
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating support message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // If admin replies, set ticket to in_progress; if user replies to resolved, reopen
    if (isAdmin && ticket.status === 'open') {
      await serviceSupabase
        .from('support_tickets')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', ticketId)
    } else if (!isAdmin && (ticket.status === 'resolved' || ticket.status === 'closed')) {
      await serviceSupabase
        .from('support_tickets')
        .update({ status: 'open', updated_at: new Date().toISOString() })
        .eq('id', ticketId)
    } else {
      await serviceSupabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId)
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error('Support message POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/support/[ticketId] - Update ticket status/priority (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const body = await request.json()
    const { status, priority } = body

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    const validPriorities = ['low', 'normal', 'high', 'urgent']

    const updates: Record<string, string> = { updated_at: new Date().toISOString() }

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = status
    }

    if (priority) {
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
      }
      updates.priority = priority
    }

    const serviceSupabase = createServiceSupabaseClient()

    const { data: ticket, error } = await serviceSupabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single()

    if (error) {
      console.error('Error updating support ticket:', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Support ticket PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
