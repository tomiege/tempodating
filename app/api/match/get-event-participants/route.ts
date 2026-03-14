import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get all participants for an event (for matching)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const productType = searchParams.get('productType') || 'onlineSpeedDating'

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Verify the user attended this event (match by user_id OR email, same as checkouts endpoint)
    const { data: userCheckouts, error: userCheckoutError } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .eq('product_id', parseInt(productId))
      .eq('product_type', productType)

    if (userCheckoutError || !userCheckouts || userCheckouts.length === 0) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 403 }
      )
    }

    // Get current user's profile to determine gender
    const { data: currentUserProfile } = await serviceSupabase
      .from('users')
      .select('is_male')
      .eq('id', user.id)
      .single()

    // Get all participants for this event (excluding current user)
    const { data: checkouts, error: checkoutsError } = await serviceSupabase
      .from('checkout')
      .select('user_id')
      .eq('product_id', parseInt(productId))
      .eq('product_type', productType)
      .not('user_id', 'is', null)
      .neq('user_id', user.id)

    if (checkoutsError) {
      console.error('Error fetching checkouts:', checkoutsError)
      return NextResponse.json({ error: checkoutsError.message }, { status: 500 })
    }

    const participantIds = [...new Set(checkouts?.map((c) => c.user_id).filter(Boolean) || [])]

    if (participantIds.length === 0) {
      return NextResponse.json([])
    }

    // Get profile information for participants
    // For gay speed dating, show same-gender participants; otherwise show opposite gender
    let profilesQuery = serviceSupabase
      .from('users')
      .select('id, full_name, bio, age, city, avatar_url, is_male')
      .in('id', participantIds)

    if (productType === 'onlineSpeedDatingGay') {
      // Same-gender matching for gay speed dating
      if (currentUserProfile?.is_male === true) {
        profilesQuery = profilesQuery.eq('is_male', true)
      } else if (currentUserProfile?.is_male === false) {
        profilesQuery = profilesQuery.eq('is_male', false)
      }
    } else {
      // Opposite-gender matching for all other event types
      if (currentUserProfile?.is_male === true) {
        profilesQuery = profilesQuery.eq('is_male', false)
      } else if (currentUserProfile?.is_male === false) {
        profilesQuery = profilesQuery.eq('is_male', true)
      }
    }
    // If is_male is null (not set), show all participants as fallback

    const { data: profiles, error: profilesError } = await profilesQuery

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Get current user's likes for this event
    const { data: userLikes } = await serviceSupabase
      .from('matches')
      .select('liked_user_id')
      .eq('user_id', user.id)
      .eq('product_id', parseInt(productId))

    const likedSet = new Set(userLikes?.map((l) => l.liked_user_id) || [])

    // Build participant response
    const participants = profiles?.map((profile) => ({
      id: profile.id,
      name: profile.full_name || 'Anonymous',
      bio: profile.bio || '',
      age: profile.age,
      city: profile.city,
      avatarUrl: profile.avatar_url,
      isMale: profile.is_male,
      isLiked: likedSet.has(profile.id),
    }))

    return NextResponse.json(participants)
  } catch (error) {
    console.error('Error in get event participants API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
