import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const serviceSupabase = createServiceSupabaseClient()

// GET - List all persona accounts
export async function GET() {
  try {
    const { data: personas, error } = await serviceSupabase
      .from('users')
      .select('id, email, full_name, age, bio, avatar_url, is_male, city, created_at')
      .like('email', '%@persona.tempo%')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For each persona, get their event registrations
    const personaIds = personas?.map(p => p.id) || []
    let checkouts: { user_id: string; product_id: number; product_type: string }[] = []

    if (personaIds.length > 0) {
      const { data: checkoutData } = await serviceSupabase
        .from('checkout')
        .select('user_id, product_id, product_type')
        .in('user_id', personaIds)

      checkouts = checkoutData || []
    }

    const result = personas?.map(p => ({
      ...p,
      events: checkouts.filter(c => c.user_id === p.id).map(c => ({
        productId: c.product_id,
        productType: c.product_type,
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing personas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new persona account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, age, bio, isMale, avatarUrl } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate a unique persona email
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + crypto.randomBytes(3).toString('hex')
    const email = `${slug}@persona.tempo`
    const password = crypto.randomBytes(16).toString('hex')

    // Create auth user via admin API
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { is_persona: true },
    })

    if (authError) {
      console.error('Error creating persona auth user:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await serviceSupabase
      .from('users')
      .upsert({
        id: userId,
        email,
        full_name: name,
        age: age || null,
        bio: bio || null,
        is_male: isMale ?? null,
        avatar_url: avatarUrl || null,
        city: 'Persona',
      })

    if (profileError) {
      console.error('Error creating persona profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: userId,
      email,
      full_name: name,
      age,
      bio,
      is_male: isMale,
      avatar_url: avatarUrl,
      events: [],
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a persona account
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, age, bio, isMale, avatarUrl } = body

    if (!id) {
      return NextResponse.json({ error: 'Persona id is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.full_name = name
    if (age !== undefined) updates.age = age
    if (bio !== undefined) updates.bio = bio
    if (isMale !== undefined) updates.is_male = isMale
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

    const { error } = await serviceSupabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .like('email', '%@persona.tempo%')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating persona:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a persona account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Verify it's actually a persona
    const { data: user } = await serviceSupabase
      .from('users')
      .select('email')
      .eq('id', id)
      .like('email', '%@persona.tempo%')
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Delete checkouts, matches, messages, then profile and auth user
    await serviceSupabase.from('matches').delete().or(`user_id.eq.${id},liked_user_id.eq.${id}`)
    await serviceSupabase.from('messages').delete().or(`from_user_id.eq.${id},to_user_id.eq.${id}`)
    await serviceSupabase.from('checkout').delete().eq('user_id', id)
    await serviceSupabase.from('users').delete().eq('id', id)
    await serviceSupabase.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting persona:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
