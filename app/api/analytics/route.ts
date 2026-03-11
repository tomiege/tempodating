import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_name, url, ...properties } = body

    if (!event_name || typeof event_name !== 'string') {
      return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    const { error } = await supabase
      .from('analytics_events')
      .insert({ event_name, url: url || null, properties })

    if (error) {
      console.error('Analytics insert error:', error.message)
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
