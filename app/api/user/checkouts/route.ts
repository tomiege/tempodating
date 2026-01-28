import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch checkouts for this user by user_id OR by email
    // This covers both logged-in purchases and purchases made with the same email before login
    const { data: checkouts, error: checkoutError } = await supabase
      .from('checkout')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order('checkout_time', { ascending: false })

    if (checkoutError) {
      console.error('Error fetching checkouts:', checkoutError)
      return NextResponse.json({ error: checkoutError.message }, { status: 500 })
    }

    // Transform the data to a more frontend-friendly format
    const transformedCheckouts = checkouts.map((checkout) => ({
      checkoutId: checkout.checkout_id,
      checkoutSessionId: checkout.checkout_session_id,
      userId: checkout.user_id,
      email: checkout.email,
      siteName: checkout.site_name,
      totalOrder: checkout.total_order,
      customerId: checkout.customer_id,
      productType: checkout.product_type,
      productId: checkout.product_id,
      confirmationEmailSent: checkout.confirmation_email_sent,
      productDescription: checkout.product_description,
      experiment: checkout.experiment,
      checkoutTime: checkout.checkout_time,
      name: checkout.name,
      phoneNumber: checkout.phone_number,
      isMale: checkout.is_male,
      queryCity: checkout.query_city,
      createdAt: checkout.created_at,
      updatedAt: checkout.updated_at,
    }))

    return NextResponse.json(transformedCheckouts)
  } catch (error) {
    console.error('Error in user checkouts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
