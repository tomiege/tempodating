import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { fal } from "@fal-ai/client"
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

fal.config({
  credentials: process.env.FAL_AI_API_KEY,
})

const PAID_GENERATION_LIMIT = 30

const PAID_PROMPT = "There are 6 images of the target and a reference image. put the target into the reference image to create a realistic profile photo to be used for social media / dating profile. Keep the target's body type, hair length and facial details. Sharpen their jawline, whiten their teeth, keep their hairstyle but slightly styled and perfect their posture. The target should be looking directly at the camera, accurate depiction of the target's face and body, confident, relaxed, smiling. No rings on finger."

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceSupabaseClient()

    // Verify user has a confirmed aiPhotos checkout
    const { data: checkout } = await serviceSupabase
      .from('checkout')
      .select('checkout_id')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .eq('product_type', 'aiPhotos')
      .eq('confirmation_email_sent', true)
      .limit(1)
      .single()

    if (!checkout) {
      return NextResponse.json(
        { error: 'No confirmed AI Photos purchase found' },
        { status: 403 }
      )
    }

    // Count existing paid generations
    const { count, error: countError } = await serviceSupabase
      .from('ai_photo_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_free', false)

    if (countError) {
      return NextResponse.json({ error: 'Failed to check generation count' }, { status: 500 })
    }

    const usedCount = count ?? 0
    if (usedCount >= PAID_GENERATION_LIMIT) {
      return NextResponse.json(
        { error: `You have used all ${PAID_GENERATION_LIMIT} generations` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { referenceImageUrl } = body

    if (!referenceImageUrl || typeof referenceImageUrl !== 'string' || !referenceImageUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'A valid reference image URL is required' }, { status: 400 })
    }

    // Get user's selfie URLs from their free generation
    const { data: freeGen } = await serviceSupabase
      .from('ai_photo_generations')
      .select('input_image_urls')
      .eq('user_id', user.id)
      .eq('is_free', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!freeGen?.input_image_urls || !Array.isArray(freeGen.input_image_urls) || freeGen.input_image_urls.length !== 6) {
      return NextResponse.json(
        { error: 'No selfie photos found. Please generate your free photo first.' },
        { status: 400 }
      )
    }

    const imageUrls = freeGen.input_image_urls as string[]

    // Combine the 6 uploaded images with the reference template image
    const allImageUrls = [...imageUrls, referenceImageUrl]

    const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
      input: {
        prompt: PAID_PROMPT,
        image_urls: allImageUrls,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log)
        }
      },
    })

    const outputUrl = result.data?.images?.[0]?.url || null

    // Save the paid generation
    const { error: insertError } = await serviceSupabase
      .from('ai_photo_generations')
      .insert({
        user_id: user.id,
        input_image_urls: imageUrls,
        prompt: PAID_PROMPT,
        reference_image_url: referenceImageUrl,
        output_url: outputUrl,
        result: result.data,
        is_free: false,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to save paid generation record:', insertError)
    }

    return NextResponse.json({
      success: true,
      outputUrl,
      referenceImageUrl,
      remaining: PAID_GENERATION_LIMIT - usedCount - 1,
    })
  } catch (error) {
    console.error('Paid AI photo generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI photo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
