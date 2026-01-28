import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Like another user from the same event
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { likedUserId, productId, productType = 'onlineSpeedDating' } = body

    if (!likedUserId || !productId) {
      return NextResponse.json(
        { error: 'likedUserId and productId are required' },
        { status: 400 }
      )
    }

    // Prevent users from liking themselves
    if (likedUserId === user.id) {
      return NextResponse.json(
        { error: 'You cannot like yourself' },
        { status: 400 }
      )
    }

    // Use service client for database operations
    const serviceSupabase = createServiceSupabaseClient()

    // Check if both users attended the same event (have checkout records for this product)
    const { data: userCheckout, error: userCheckoutError } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('product_type', productType)
      .single()

    if (userCheckoutError || !userCheckout) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 403 }
      )
    }

    const { data: likedUserCheckout, error: likedUserCheckoutError } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .eq('user_id', likedUserId)
      .eq('product_id', productId)
      .eq('product_type', productType)
      .single()

    if (likedUserCheckoutError || !likedUserCheckout) {
      return NextResponse.json(
        { error: 'The user you are trying to like did not attend this event' },
        { status: 403 }
      )
    }

    // Insert the like (upsert to handle duplicates)
    const { data: match, error: matchError } = await serviceSupabase
      .from('matches')
      .upsert(
        {
          user_id: user.id,
          liked_user_id: likedUserId,
          product_id: productId,
          product_type: productType,
        },
        {
          onConflict: 'user_id,liked_user_id,product_id',
        }
      )
      .select()
      .single()

    if (matchError) {
      console.error('Error creating match:', matchError)
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    // Check if it's a mutual match
    const { data: mutualMatch } = await serviceSupabase
      .from('matches')
      .select('id')
      .eq('user_id', likedUserId)
      .eq('liked_user_id', user.id)
      .eq('product_id', productId)
      .single()

    return NextResponse.json({
      success: true,
      match,
      isMutualMatch: !!mutualMatch,
    })
  } catch (error) {
    console.error('Error in match like API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Unlike a user
export async function DELETE(request: NextRequest) {
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
    const likedUserId = searchParams.get('likedUserId')
    const productId = searchParams.get('productId')

    if (!likedUserId || !productId) {
      return NextResponse.json(
        { error: 'likedUserId and productId are required' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceSupabaseClient()

    const { error: deleteError } = await serviceSupabase
      .from('matches')
      .delete()
      .eq('user_id', user.id)
      .eq('liked_user_id', likedUserId)
      .eq('product_id', parseInt(productId))

    if (deleteError) {
      console.error('Error deleting match:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in match unlike API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
