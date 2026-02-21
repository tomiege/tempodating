import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    const serviceSupabase = createServiceSupabaseClient()

    let query = serviceSupabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching attendance:', error)
      return NextResponse.json(
        { error: 'Failed to fetch attendance', details: error.message },
        { status: 500 }
      )
    }

    // Map snake_case DB columns to camelCase for frontend
    const attendances = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      attendeeName: row.attendee_name,
      preferredName: row.preferred_name,
      gender: row.gender,
      age: row.age,
      productId: row.product_id,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ attendances })
  } catch (error) {
    console.error('❌ Error in GET /api/attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attendeeName, preferredName, gender, age, productId, siteName } = body

    if (!preferredName || !gender || !age || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: preferredName, gender, age, and productId are required' },
        { status: 400 }
      )
    }

    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender must be either "male" or "female"' },
        { status: 400 }
      )
    }

    if (typeof age !== 'number' || age < 16 || age > 100) {
      return NextResponse.json(
        { error: 'Age must be a number between 16 and 100' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceSupabaseClient()

    const { data, error } = await serviceSupabase
      .from('attendance')
      .insert({
        attendee_name: attendeeName || `anonymous_${Date.now()}@event.local`,
        preferred_name: preferredName,
        gender,
        age,
        product_id: productId,
        site_name: siteName || 'default',
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error recording attendance:', error)
      return NextResponse.json(
        { error: 'Failed to record attendance', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Attendance recorded:', data.id)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('❌ Error in POST /api/attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}
