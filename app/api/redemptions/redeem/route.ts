import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'

// GET — look up a redemption by id or code (public)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const redemptionId = request.nextUrl.searchParams.get('id')
    const code = request.nextUrl.searchParams.get('code')
    const forProductId = request.nextUrl.searchParams.get('productId')

    if (!redemptionId && !code) {
      return NextResponse.json({ error: 'Missing redemption ID or code' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    let data = null
    let error = null

    if (code) {
      // Explicit code lookup
      const result = await supabase
        .from('redemptions')
        .select('id, code, product_id, product_type, for_gender, discount_percent, max_uses, used_count, expires_at, note')
        .eq('code', code)
        .single()
      data = result.data
      error = result.error
    } else if (redemptionId && isUuid.test(redemptionId)) {
      // UUID id lookup
      const result = await supabase
        .from('redemptions')
        .select('id, code, product_id, product_type, for_gender, discount_percent, max_uses, used_count, expires_at, note')
        .eq('id', redemptionId)
        .single()
      data = result.data
      error = result.error
    } else if (redemptionId) {
      // Non-UUID id param — treat as custom code
      const result = await supabase
        .from('redemptions')
        .select('id, code, product_id, product_type, for_gender, discount_percent, max_uses, used_count, expires_at, note')
        .eq('code', redemptionId)
        .single()
      data = result.data
      error = result.error
    }

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid redemption code' }, { status: 404 })
    }

    const now = new Date()
    const expired = new Date(data.expires_at) < now
    const fullyUsed = data.used_count >= data.max_uses
    // product_id NULL means wildcard (works for any product)
    const productMatch = data.product_id === null || !forProductId || data.product_id === parseInt(forProductId)

    return NextResponse.json({
      ...data,
      expired,
      fullyUsed,
      productMatch,
      valid: !expired && !fullyUsed && productMatch,
    }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/redemptions/redeem:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — redeem a code (creates a checkout with discount applied)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const {
      redemptionId,
      email,
      name,
      queryCity,
      productId: requestProductId,
      productType: requestProductType,
      isMale,
      originalPrice,
    }: {
      redemptionId: string
      email: string
      name: string
      queryCity?: string
      productId?: number
      productType?: string
      isMale?: boolean
      originalPrice?: number
    } = await request.json()

    if (!redemptionId || !email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()
    const supabase = createServiceSupabaseClient()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    // Fetch redemption by UUID or custom code
    let redemption = null
    let fetchError = null

    if (isUuid.test(redemptionId)) {
      const result = await supabase.from('redemptions').select('*').eq('id', redemptionId).single()
      redemption = result.data
      fetchError = result.error
    } else {
      const result = await supabase.from('redemptions').select('*').eq('code', redemptionId).single()
      redemption = result.data
      fetchError = result.error
    }

    if (fetchError || !redemption) {
      return NextResponse.json({ error: 'Invalid redemption code' }, { status: 404 })
    }

    // Validate
    if (new Date(redemption.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This redemption code has expired' }, { status: 410 })
    }
    if (redemption.used_count >= redemption.max_uses) {
      return NextResponse.json({ error: 'This redemption code has been fully used' }, { status: 410 })
    }

    // Check product match (null product_id = wildcard)
    const effectiveProductId = requestProductId ?? redemption.product_id
    const effectiveProductType = requestProductType ?? redemption.product_type
    if (redemption.product_id !== null && requestProductId && redemption.product_id !== requestProductId) {
      return NextResponse.json({ error: 'This code is not valid for this event' }, { status: 400 })
    }

    // Check if this email already redeemed this code
    const { data: existingUse } = await supabase
      .from('redemption_uses')
      .select('id')
      .eq('redemption_id', redemption.id)
      .eq('email', normalizedEmail)
      .single()

    if (existingUse) {
      return NextResponse.json({ error: 'You have already redeemed this code' }, { status: 409 })
    }

    // Get authenticated user if available
    const sessionSupabase = await createServerSupabaseClient()
    const { data: { user } } = await sessionSupabase.auth.getUser()
    const userId = user?.id || null

    const domain = request.headers.get('host') || ''
    const siteName = domain.split('.')[0] || 'tempodating'

    const discountPercent = redemption.discount_percent ?? 100
    const isFree = discountPercent === 100

    // Calculate discounted price (originalPrice is in cents)
    const totalOrder = isFree ? 0 : originalPrice
      ? Math.round(originalPrice * (1 - discountPercent / 100)) / 100
      : 0

    // Create checkout record
    const checkoutSessionId = `redemption_${redemption.id}_${Date.now()}`

    const { data: checkout, error: checkoutError } = await supabase
      .from('checkout')
      .insert({
        checkout_session_id: checkoutSessionId,
        user_id: userId,
        email: normalizedEmail,
        site_name: siteName,
        total_order: totalOrder,
        customer_id: '',
        product_type: effectiveProductType,
        product_id: effectiveProductId,
        confirmation_email_sent: false,
        product_description: `Redeemed${redemption.code ? ` (${redemption.code})` : ''}: ${discountPercent}% off — ${redemption.note || 'Discount'}`,
        experiment: null,
        checkout_time: new Date().toISOString(),
        name: name,
        phone_number: null,
        is_male: isMale ?? (redemption.for_gender === 'male'),
        query_city: queryCity || null,
      })
      .select()
      .single()

    if (checkoutError) {
      console.error('Error creating redeemed checkout:', checkoutError)
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    // Record the use
    await supabase.from('redemption_uses').insert({
      redemption_id: redemption.id,
      email: normalizedEmail,
      name: name,
      checkout_id: checkout.checkout_id,
    })

    // Increment used_count
    await supabase
      .from('redemptions')
      .update({ used_count: redemption.used_count + 1, updated_at: new Date().toISOString() })
      .eq('id', redemption.id)

    const successUrl = `/checkout-success/${effectiveProductType}?checkoutSessionId=${checkoutSessionId}&email=${normalizedEmail}`

    return NextResponse.json({
      success: true,
      checkoutId: checkout.checkout_id,
      redirectUrl: successUrl,
      discountPercent,
      isFree,
    }, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/redemptions/redeem:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
