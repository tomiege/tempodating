import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { fal } from "@fal-ai/client"
import { NextRequest, NextResponse } from 'next/server'

fal.config({
  credentials: process.env.FAL_AI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrls, prompt, referenceImageUrl } = body

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length !== 6) {
      return NextResponse.json({ error: 'Exactly 6 image URLs are required' }, { status: 400 })
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!referenceImageUrl || typeof referenceImageUrl !== 'string' || !referenceImageUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'A valid reference image URL is required' }, { status: 400 })
    }

    // Validate all URLs are strings
    for (const url of imageUrls) {
      if (typeof url !== 'string' || !url.startsWith('https://')) {
        return NextResponse.json({ error: 'All image URLs must be valid HTTPS URLs' }, { status: 400 })
      }
    }

    // Combine the 6 uploaded images with the reference image
    const allImageUrls = [...imageUrls, referenceImageUrl]

    const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
      input: {
        prompt: prompt.trim(),
        image_urls: allImageUrls,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log)
        }
      },
    })

    // Store the result in Supabase
    const serviceSupabase = createServiceSupabaseClient()
    await serviceSupabase
      .from('ai_photo_generations')
      .insert({
        user_id: user.id,
        input_image_urls: imageUrls,
        result: result.data,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      result: result.data,
      requestId: result.requestId,
    })
  } catch (error) {
    console.error('AI photo generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI photo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
