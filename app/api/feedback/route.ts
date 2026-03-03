import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/feedback - Get recent feedback (public, for sales page)
// Optional: ?mine=true returns only the authenticated user's feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine') === 'true'

    if (mine) {
      // Return only the authenticated user's feedback
      const authSupabase = await createServerSupabaseClient()
      const { data: { user }, error: authError } = await authSupabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const serviceSupabase = createServiceSupabaseClient()
      const { data: feedback, error } = await serviceSupabase
        .from('feedback')
        .select('id, user_name, rating, message, product_id, product_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user feedback:', error)
        return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
      }

      return NextResponse.json(feedback)
    }

    // Public: return recent feedback
    const supabase = createServiceSupabaseClient()
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('id, user_name, rating, message, product_id, product_type, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/feedback - Submit feedback (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, message, productId, productType } = body

    // Validate
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.trim().length > 1000) {
      return NextResponse.json({ error: 'Message must be under 1000 characters' }, { status: 400 })
    }

    // Get user's name from profile
    const serviceSupabase = createServiceSupabaseClient()
    const { data: profile } = await serviceSupabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: feedback, error } = await serviceSupabase
      .from('feedback')
      .insert({
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
        rating,
        message: message.trim(),
        product_id: productId || null,
        product_type: productType || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting feedback:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('Feedback POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
