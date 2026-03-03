import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const supabase = createServiceSupabaseClient()

  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('checkout_session_id, email, is_male')
    .eq('product_id', Number(productId))
    .eq('confirmation_email_sent', true)
    .order('checkout_time', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate by email
  const seen = new Set<string>()
  const sessions = (checkouts || []).filter((c) => {
    if (!c.email || seen.has(c.email)) return false
    seen.add(c.email)
    return true
  })

  return NextResponse.json({ sessions })
}
