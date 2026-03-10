import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

// GET — list all redemptions (admin)
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase
      .from('redemptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching redemptions:', error)
      return NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/redemptions:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create a new redemption (admin)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const {
      productId,
      productType,
      forGender,
      discountPercent,
      maxUses,
      expiresAt,
      note,
      code,
    }: {
      productId: number | null
      productType: string
      forGender: 'male' | 'female' | 'both'
      discountPercent?: number
      maxUses: number
      expiresAt: string
      note?: string
      code?: string
    } = await request.json()

    if (!productType || maxUses < 1) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const percent = discountPercent ?? 100
    if (percent < 1 || percent > 100) {
      return NextResponse.json({ error: 'Discount percent must be between 1 and 100' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // If a custom code is provided, check uniqueness
    const trimmedCode = code?.trim() || null
    if (trimmedCode) {
      const { data: existing } = await supabase
        .from('redemptions')
        .select('id')
        .eq('code', trimmedCode)
        .single()
      if (existing) {
        return NextResponse.json({ error: 'A redemption with this code already exists' }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from('redemptions')
      .insert({
        code: trimmedCode,
        product_id: productId,
        product_type: productType,
        for_gender: forGender,
        discount_percent: percent,
        max_uses: maxUses,
        used_count: 0,
        expires_at: expiresAt,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating redemption:', error)
      return NextResponse.json({ error: 'Failed to create redemption' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/redemptions:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
