import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/profile - Get user profile
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Transform database fields to match frontend User type
    const userProfile = {
      id: user.id,
      email: user.email || '',
      name: profile?.full_name || '',
      age: profile?.age || undefined,
      bio: profile?.bio || '',
      contactInfo: profile?.contact_info || '',
      isMale: profile?.is_male,
      image: profile?.avatar_url || '',
      personalityQuizResult: profile?.personality_quiz_result || null,
      createdAt: profile?.created_at,
      updatedAt: profile?.updated_at,
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    let updateData: {
      name?: string
      age?: number
      bio?: string
      contactInfo?: string
      isMale?: boolean
      imageUrl?: string
    } = {}

    // Handle FormData (with photo upload)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      const isMaleValue = formData.get('isMale') as string
      
      updateData = {
        name: formData.get('name') as string,
        age: formData.get('age') ? parseInt(formData.get('age') as string) : undefined,
        bio: formData.get('bio') as string,
        contactInfo: formData.get('contactInfo') as string,
        isMale: isMaleValue === '' ? undefined : isMaleValue === 'true',
      }

      // Handle photo upload
      const photoFile = formData.get('photo') as File
      if (photoFile && photoFile.size > 0) {
        // Use service role client for storage operations (bypasses RLS)
        const serviceSupabase = createServiceSupabaseClient()
        
        // Generate unique filename
        const fileExt = photoFile.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        // Convert File to ArrayBuffer
        const arrayBuffer = await photoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage using service role
        const { data: uploadData, error: uploadError } = await serviceSupabase.storage
          .from('profile-images')
          .upload(fileName, buffer, {
            contentType: photoFile.type || 'image/jpeg',
            upsert: true, // Allow overwriting
          })

        if (uploadError) {
          console.error('Image upload error:', uploadError)
          return NextResponse.json(
            { error: 'Failed to upload image', details: uploadError.message },
            { status: 500 }
          )
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = serviceSupabase.storage.from('profile-images').getPublicUrl(fileName)

        updateData.imageUrl = publicUrl
      }
    } else {
      // Handle JSON request
      const body = await request.json()
      updateData = body
    }

    // Update user profile in database
    // Transform frontend field names to database column names
    const dbUpdateData: {
      full_name?: string
      age?: number
      bio?: string
      contact_info?: string
      is_male?: boolean
      avatar_url?: string
    } = {}

    if (updateData.name !== undefined) dbUpdateData.full_name = updateData.name
    if (updateData.age !== undefined) dbUpdateData.age = updateData.age
    if (updateData.bio !== undefined) dbUpdateData.bio = updateData.bio
    if (updateData.contactInfo !== undefined) dbUpdateData.contact_info = updateData.contactInfo
    if (updateData.isMale !== undefined) dbUpdateData.is_male = updateData.isMale
    if (updateData.imageUrl !== undefined) dbUpdateData.avatar_url = updateData.imageUrl

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(dbUpdateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    // Transform database fields back to frontend User type
    const userProfile = {
      id: user.id,
      email: user.email || '',
      name: updatedProfile.full_name || '',
      age: updatedProfile.age || undefined,
      bio: updatedProfile.bio || '',
      contactInfo: updatedProfile.contact_info || '',
      isMale: updatedProfile.is_male,
      image: updatedProfile.avatar_url || '',
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
