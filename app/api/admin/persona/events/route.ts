import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Add a persona to an event (create checkout record)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { personaId, productId, productType = 'onlineSpeedDating' } = body

    if (!personaId || !productId) {
      return NextResponse.json({ error: 'personaId and productId are required' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Verify it's a persona
    const { data: user } = await serviceSupabase
      .from('users')
      .select('email, is_male')
      .eq('id', personaId)
      .like('email', '%@persona.tempo%')
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Check if already registered
    const { data: existing } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .eq('user_id', personaId)
      .eq('product_id', productId)
      .eq('product_type', productType)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 409 })
    }

    // Create checkout record
    const { error } = await serviceSupabase
      .from('checkout')
      .insert({
        checkout_session_id: `persona_${personaId}_${productId}_${Date.now()}`,
        user_id: personaId,
        email: user.email,
        site_name: 'tempodating',
        total_order: 0,
        product_type: productType,
        product_id: productId,
        confirmation_email_sent: true,
        currency: 'USD',
        is_male: user.is_male,
      })

    if (error) {
      console.error('Error creating checkout:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error adding persona to event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a persona from an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personaId = searchParams.get('personaId')
    const productId = searchParams.get('productId')
    const productType = searchParams.get('productType') || 'onlineSpeedDating'

    if (!personaId || !productId) {
      return NextResponse.json({ error: 'personaId and productId are required' }, { status: 400 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Delete checkout and related matches
    await serviceSupabase.from('matches').delete()
      .eq('product_id', parseInt(productId))
      .or(`user_id.eq.${personaId},liked_user_id.eq.${personaId}`)

    await serviceSupabase.from('checkout').delete()
      .eq('user_id', personaId)
      .eq('product_id', parseInt(productId))
      .eq('product_type', productType)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing persona from event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
