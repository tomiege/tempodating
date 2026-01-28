import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user profile from public.users table
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    // User might not have a profile yet, return basic auth data
    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      gender: user.user_metadata?.gender || '',
      age: user.user_metadata?.age || null,
      city: user.user_metadata?.city || '',
      country: user.user_metadata?.country || ''
    })
  }

  return NextResponse.json(profile)
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, email, full_name, gender, age, city, country } = body

    // Validate required fields
    if (!user_id || !email) {
      return NextResponse.json({ error: 'user_id and email are required' }, { status: 400 })
    }

    console.log('📝 Updating profile for user:', user_id, 'with data:', { full_name, gender, age, city, country })

    // Use service client to bypass RLS and update the users table
    const serviceSupabase = createServiceSupabaseClient()
    
    // First check if user exists
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .maybeSingle()
    
    let data, error
    
    if (existingUser) {
      // User exists - UPDATE only
      console.log('✏️ Updating existing user record')
      const result = await serviceSupabase
        .from('users')
        .update({
          full_name,
          gender,
          age: parseInt(age),
          city,
          country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // User doesn't exist - INSERT
      console.log('➕ Creating new user record')
      const result = await serviceSupabase
        .from('users')
        .insert({
          id: user_id,
          email: email,
          full_name,
          gender,
          age: parseInt(age),
          city,
          country,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('❌ Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 })
    }

    console.log('✅ Profile updated successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error in PUT /api/user/profile:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
