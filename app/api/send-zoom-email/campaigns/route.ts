import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId')

  const supabase = createServiceSupabaseClient()

  let query = supabase
    .from('email_campaigns')
    .select('id, product_id, product_type, template, subject, recipient_count, audience, sent_at')
    .order('sent_at', { ascending: false })

  if (productId) {
    query = query.eq('product_id', Number(productId))
  }

  // Only fetch the most recent per template/product combo
  const { data, error } = await query.limit(50)

  if (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campaigns: data || [] })
}
