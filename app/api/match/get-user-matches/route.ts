import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get all matches for the current user
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

    const serviceSupabase = createServiceSupabaseClient()

    // Build query for matches where user has liked someone
    let matchesQuery = serviceSupabase
      .from('matches')
      .select(`
        id,
        liked_user_id,
        product_id,
        product_type,
        created_at
      `)
      .eq('user_id', user.id)

    // Filter by productId if provided
    if (productId) {
      matchesQuery = matchesQuery.eq('product_id', parseInt(productId))
    }

    const { data: userLikes, error: likesError } = await matchesQuery

    if (likesError) {
      console.error('Error fetching user likes:', likesError)
      return NextResponse.json({ error: likesError.message }, { status: 500 })
    }

    // Get all users that liked back (mutual matches)
    let mutualQuery = serviceSupabase
      .from('matches')
      .select('user_id, product_id')
      .eq('liked_user_id', user.id)

    if (productId) {
      mutualQuery = mutualQuery.eq('product_id', parseInt(productId))
    }

    const { data: likedBack } = await mutualQuery

    const mutualMatchSet = new Set(
      likedBack?.map((m) => `${m.user_id}-${m.product_id}`) || []
    )

    // Get profile information for all liked users
    const likedUserIds = userLikes?.map((m) => m.liked_user_id) || []

    if (likedUserIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('users')
      .select('id, full_name, contact_info')
      .in('id', likedUserIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    // Build the matches response
    const matches = userLikes?.map((like) => {
      const profile = profileMap.get(like.liked_user_id)
      const isMutual = mutualMatchSet.has(
        `${like.liked_user_id}-${like.product_id}`
      )

      return {
        id: like.id,
        productId: like.product_id,
        productType: like.product_type,
        mutualMatch: isMutual,
        otherProfile: {
          id: like.liked_user_id,
          name: profile?.full_name || 'Unknown',
          contactInfo: isMutual ? (profile?.contact_info || '') : '', // Only show contact info for mutual matches
        },
        matchedAt: like.created_at,
      }
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error in get user matches API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
