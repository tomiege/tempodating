import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Like from a persona account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personaId, likedUserId, productId, productType = 'onlineSpeedDating' } = body

    if (!personaId || !likedUserId || !productId) {
      return NextResponse.json({ error: 'personaId, likedUserId, and productId are required' }, { status: 400 })
    }

    if (personaId === likedUserId) {
      return NextResponse.json({ error: 'Cannot like self' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Upsert the like
    const { error: matchError } = await serviceSupabase
      .from('matches')
      .upsert(
        {
          user_id: personaId,
          liked_user_id: likedUserId,
          product_id: productId,
          product_type: productType,
        },
        { onConflict: 'user_id,liked_user_id,product_id' }
      )

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    // Check mutual match
    const { data: mutual } = await serviceSupabase
      .from('matches')
      .select('id')
      .eq('user_id', likedUserId)
      .eq('liked_user_id', personaId)
      .eq('product_id', productId)
      .maybeSingle()

    return NextResponse.json({ success: true, isMutualMatch: !!mutual })
  } catch (error) {
    console.error('Error in persona like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Unlike from a persona account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personaId = searchParams.get('personaId')
    const likedUserId = searchParams.get('likedUserId')
    const productId = searchParams.get('productId')

    if (!personaId || !likedUserId || !productId) {
      return NextResponse.json({ error: 'personaId, likedUserId, and productId are required' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    await serviceSupabase
      .from('matches')
      .delete()
      .eq('user_id', personaId)
      .eq('liked_user_id', likedUserId)
      .eq('product_id', parseInt(productId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in persona unlike:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
