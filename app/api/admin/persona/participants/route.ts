import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get event participants from perspective of a persona
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personaId = searchParams.get('personaId')
    const productId = searchParams.get('productId')
    const productType = searchParams.get('productType') || 'onlineSpeedDating'

    if (!personaId || !productId) {
      return NextResponse.json({ error: 'personaId and productId are required' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Get persona's gender
    const { data: persona } = await serviceSupabase
      .from('users')
      .select('is_male')
      .eq('id', personaId)
      .single()

    // Get all participants for this event (excluding the persona)
    const { data: checkouts, error: checkoutsError } = await serviceSupabase
      .from('checkout')
      .select('user_id')
      .eq('product_id', parseInt(productId))
      .eq('product_type', productType)
      .not('user_id', 'is', null)
      .neq('user_id', personaId)

    if (checkoutsError) {
      return NextResponse.json({ error: checkoutsError.message }, { status: 500 })
    }

    const participantIds = [...new Set(checkouts?.map(c => c.user_id).filter(Boolean) || [])]

    if (participantIds.length === 0) {
      return NextResponse.json([])
    }

    // Get profiles - apply gender filtering based on event type
    let profilesQuery = serviceSupabase
      .from('users')
      .select('id, full_name, bio, age, city, avatar_url, is_male, email')
      .in('id', participantIds)

    if (productType === 'onlineSpeedDatingGay') {
      if (persona?.is_male === true) {
        profilesQuery = profilesQuery.eq('is_male', true)
      } else if (persona?.is_male === false) {
        profilesQuery = profilesQuery.eq('is_male', false)
      }
    } else {
      if (persona?.is_male === true) {
        profilesQuery = profilesQuery.eq('is_male', false)
      } else if (persona?.is_male === false) {
        profilesQuery = profilesQuery.eq('is_male', true)
      }
    }

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Get persona's existing likes for this event
    const { data: likes } = await serviceSupabase
      .from('matches')
      .select('liked_user_id')
      .eq('user_id', personaId)
      .eq('product_id', parseInt(productId))

    const likedSet = new Set(likes?.map(l => l.liked_user_id) || [])

    // Check for existing messages from this persona
    const { data: sentMessages } = await serviceSupabase
      .from('messages')
      .select('to_user_id')
      .eq('from_user_id', personaId)

    const messagedSet = new Set(sentMessages?.map(m => m.to_user_id) || [])

    const participants = profiles?.map(p => ({
      id: p.id,
      name: p.full_name || 'Anonymous',
      bio: p.bio || '',
      age: p.age,
      city: p.city,
      avatarUrl: p.avatar_url,
      isMale: p.is_male,
      email: p.email,
      isLiked: likedSet.has(p.id),
      hasMessaged: messagedSet.has(p.id),
    }))

    return NextResponse.json(participants)
  } catch (error) {
    console.error('Error in persona participants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
