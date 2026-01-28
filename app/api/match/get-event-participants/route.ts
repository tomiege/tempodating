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

    // Verify the user attended this event
    const { data: userCheckout, error: userCheckoutError } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .eq('user_id', user.id)
      .eq('product_id', parseInt(productId))
      .eq('product_type', productType)
      .single()

    if (userCheckoutError || !userCheckout) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 403 }
      )
    }

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
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('users')
      .select('id, full_name, bio, age, city, avatar_url, is_male')
      .in('id', participantIds)

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
