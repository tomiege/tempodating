import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/messages/recommended - Get verified members nearby to message
// "Verified" = users who have at least one checkout (attended an event)
// "Nearby" = same city as the current user, falling back to any verified members
export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Get current user's profile for city
    const { data: currentUser } = await serviceSupabase
      .from('users')
      .select('city')
      .eq('id', user.id)
      .single()

    // Get user IDs who have at least one checkout (verified attendees)
    const { data: verifiedCheckouts } = await serviceSupabase
      .from('checkout')
      .select('user_id')
      .not('user_id', 'is', null)

    const verifiedUserIds = [...new Set(
      (verifiedCheckouts || [])
        .map(c => c.user_id)
        .filter((id): id is string => id !== null && id !== user.id)
    )]

    if (verifiedUserIds.length === 0) {
      return NextResponse.json([])
    }

    // Get users who already have a conversation with the current user
    const { data: existingMessages } = await serviceSupabase
      .from('messages')
      .select('from_user_id, to_user_id')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

    const existingPartnerIds = new Set(
      (existingMessages || []).map(m =>
        m.from_user_id === user.id ? m.to_user_id : m.from_user_id
      )
    )

    // Filter out users we already have conversations with
    const candidateIds = verifiedUserIds.filter(id => !existingPartnerIds.has(id))

    if (candidateIds.length === 0) {
      return NextResponse.json([])
    }

    // Fetch profiles, preferring same city
    const { data: profiles } = await serviceSupabase
      .from('users')
      .select('id, full_name, avatar_url, bio, age, city, is_male')
      .in('id', candidateIds)
      .not('full_name', 'is', null)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json([])
    }

    // Sort: same city first, then others
    const userCity = currentUser?.city?.toLowerCase()
    const sorted = profiles.sort((a, b) => {
      const aLocal = a.city?.toLowerCase() === userCity ? 0 : 1
      const bLocal = b.city?.toLowerCase() === userCity ? 0 : 1
      return aLocal - bLocal
    })

    // Return top 10
    const recommended = sorted.slice(0, 10).map(p => ({
      id: p.id,
      name: p.full_name || 'Unknown',
      avatarUrl: p.avatar_url,
      bio: p.bio,
      age: p.age,
      city: p.city,
      isMale: p.is_male,
    }))

    return NextResponse.json(recommended)
  } catch (error) {
    console.error('Recommended members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
