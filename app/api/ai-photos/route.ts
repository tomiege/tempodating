import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch user's AI photo submission
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceSupabaseClient()
    const { data, error } = await serviceSupabase
      .from('ai_photo_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || null)
  } catch (error) {
    console.error('Error fetching AI photo submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Upload training photos for AI photo generation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Verify user has purchased aiPhotos
    const { data: checkout } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .eq('product_type', 'aiPhotos')
      .limit(1)
      .single()

    if (!checkout) {
      return NextResponse.json({ error: 'No AI Photos purchase found' }, { status: 403 })
    }

    // Parse form data - expect multiple files
    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 })
    }

    if (files.length < 8) {
      return NextResponse.json({ error: 'Minimum 8 photos required' }, { status: 400 })
    }

    if (files.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 photos allowed' }, { status: 400 })
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: `File "${file.name}" is not an image` }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 10MB limit` }, { status: 400 })
      }
    }

    // Upload all photos to storage
    const uploadedPhotos: { url: string; path: string; name: string }[] = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `ai-training/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data, error } = await serviceSupabase.storage
        .from('profile-images')
        .upload(fileName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (error) {
        console.error('Upload error for file:', file.name, error)
        return NextResponse.json(
          { error: `Failed to upload "${file.name}"`, details: error.message },
          { status: 500 }
        )
      }

      const { data: { publicUrl } } = serviceSupabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      uploadedPhotos.push({ url: publicUrl, path: data.path, name: file.name })
    }

    // Check if user already has a submission
    const { data: existing } = await serviceSupabase
      .from('ai_photo_submissions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (existing) {
      // Update existing submission
      const { data: updated, error: updateError } = await serviceSupabase
        .from('ai_photo_submissions')
        .update({
          photos: uploadedPhotos,
          checkout_id: checkout.checkout_id,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json(updated)
    } else {
      // Create new submission
      const { data: created, error: createError } = await serviceSupabase
        .from('ai_photo_submissions')
        .insert({
          user_id: user.id,
          checkout_id: checkout.checkout_id,
          photos: uploadedPhotos,
          status: 'pending',
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json(created)
    }
  } catch (error) {
    console.error('Error in AI photos upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
