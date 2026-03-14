import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/support - Get tickets (user gets their own, admin gets all)
export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = createServiceSupabaseClient()
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const status = searchParams.get('status')

    let query = serviceSupabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!all) {
      // If not requesting all, try to get user context to filter
      const authSupabase = await createServerSupabaseClient()
      const { data: { user } } = await authSupabase.auth.getUser()
      if (user) {
        query = query.eq('user_id', user.id)
      }
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Error fetching support tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    // For each ticket, check if the last message was from admin
    if (tickets && tickets.length > 0) {
      const ticketIds = tickets.map((t: { id: string }) => t.id)
      const { data: lastMessages } = await serviceSupabase
        .from('support_messages')
        .select('ticket_id, is_admin, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false })

      // Build a map of ticket_id -> whether last message is admin
      const lastAdminMap: Record<string, boolean> = {}
      if (lastMessages) {
        for (const msg of lastMessages) {
          if (!(msg.ticket_id in lastAdminMap)) {
            lastAdminMap[msg.ticket_id] = msg.is_admin
          }
        }
      }

      const enriched = tickets.map((t: { id: string }) => ({
        ...t,
        last_admin_reply: lastAdminMap[t.id] || false,
      }))

      return NextResponse.json(enriched)
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Support GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/support - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    if (typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Create the ticket
    const { data: ticket, error: ticketError } = await serviceSupabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        user_email: user.email,
        subject: subject.trim().slice(0, 200),
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating support ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Create the first message
    const { error: messageError } = await serviceSupabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: message.trim().slice(0, 5000),
        is_admin: false,
      })

    if (messageError) {
      console.error('Error creating support message:', messageError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Support POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
