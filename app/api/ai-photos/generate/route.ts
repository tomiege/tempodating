import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { fal } from "@fal-ai/client"
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

fal.config({
  credentials: process.env.FAL_AI_API_KEY,
})

function stringifyErrorDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') {
          return item.msg
        }
        return null
      })
      .filter((value): value is string => Boolean(value))

    if (messages.length > 0) {
      return messages.join('; ')
    }
  }

  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail)
    } catch {
      return null
    }
  }

  return null
}

function extractErrorInfo(error: unknown) {
  const defaultMessage = 'Failed to generate AI photo'

  if (!error || typeof error !== 'object') {
    return { message: defaultMessage, status: 500, requestId: null as string | null }
  }

  const maybeError = error as Error & {
    body?: { detail?: unknown; message?: unknown }
    requestId?: unknown
    status?: unknown
  }

  const detailMessage =
    stringifyErrorDetail(maybeError.body?.detail) ||
    (typeof maybeError.body?.message === 'string' ? maybeError.body.message : null) ||
    (typeof maybeError.message === 'string' && maybeError.message.trim() ? maybeError.message : null)

  return {
    message: detailMessage || defaultMessage,
    status: typeof maybeError.status === 'number' ? maybeError.status : 500,
    requestId: typeof maybeError.requestId === 'string' && maybeError.requestId.trim() ? maybeError.requestId : null,
  }
}

// GET: Check if user already has a free generation
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceSupabaseClient()
    const { data: existing } = await serviceSupabase
      .from('ai_photo_generations')
      .select('output_url, created_at')
      .eq('user_id', user.id)
      .eq('is_free', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      hasGenerated: !!existing,
      outputUrl: existing?.output_url || null,
    })
  } catch (error) {
    console.error('AI photo status check error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrls, prompt, referenceImageUrl, adminBypass } = body
    const shouldBypassFreeLimit = adminBypass === true

    // Server-side check: only 1 free generation per user (check ai_photo_generations table)
    const serviceSupabase = createServiceSupabaseClient()
    if (!shouldBypassFreeLimit) {
      const { data: existingGeneration } = await serviceSupabase
        .from('ai_photo_generations')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_free', true)
        .limit(1)
        .single()

      if (existingGeneration) {
        return NextResponse.json(
          { error: 'You have already used your free AI photo generation. Purchase the 30-pack for more.' },
          { status: 403 }
        )
      }
    }

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

    // Extract the output image URL
    const outputUrl = result.data?.images?.[0]?.url || null

    // Store the generation record (marks free generation as used)
    const { error: insertError } = await serviceSupabase
      .from('ai_photo_generations')
      .insert({
        user_id: user.id,
        input_image_urls: imageUrls,
        prompt: prompt.trim(),
        reference_image_url: referenceImageUrl,
        output_url: outputUrl,
        result: result.data,
        is_free: !shouldBypassFreeLimit,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to save generation record:', insertError)
    }

    return NextResponse.json({
      success: true,
      result: result.data,
      outputUrl,
      requestId: result.requestId,
    })
  } catch (error) {
    const { message, status, requestId } = extractErrorInfo(error)
    console.error('AI photo generation error:', { error, message, status, requestId })
    return NextResponse.json(
      { error: message, details: message, requestId },
      { status }
    )
  }
}
