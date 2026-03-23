import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const PAID_GENERATION_LIMIT = 30

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Get all paid generations for this user
    const { data: generations, error } = await serviceSupabase
      .from('ai_photo_generations')
      .select('id, reference_image_url, output_url, created_at')
      .eq('user_id', user.id)
      .eq('is_free', false)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = generations ?? []

    return NextResponse.json({
      generations: items,
      usedCount: items.length,
      limit: PAID_GENERATION_LIMIT,
      remaining: PAID_GENERATION_LIMIT - items.length,
    })
  } catch (error) {
    console.error('Error fetching paid generations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
