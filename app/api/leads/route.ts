import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, city, country, product_id, product_type } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('📝 Creating lead for:', email)

    const serviceSupabase = createServiceSupabaseClient()
    
    const { data, error } = await serviceSupabase
      .from('leads')
      .insert({
        email: email.toLowerCase().trim(),
        city,
        country,
        product_id,
        product_type
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating lead:', error)
      return NextResponse.json({ error: 'Failed to create lead', details: error.message }, { status: 500 })
    }

    console.log('✅ Lead created:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error in POST /api/leads:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Update an existing lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, age, isMale, city, country } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    console.log('📝 Updating lead:', id, 'with data:', { name, age, isMale, city, country })

    const serviceSupabase = createServiceSupabaseClient()
    
    const { data, error } = await serviceSupabase
      .from('leads')
      .update({
        name,
        age: age ? parseInt(age) : null,
        is_male: isMale,
        city,
        country,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating lead:', error)
      return NextResponse.json({ error: 'Failed to update lead', details: error.message }, { status: 500 })
    }

    console.log('✅ Lead updated:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Error in PUT /api/leads:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
