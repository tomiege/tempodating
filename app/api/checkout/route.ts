import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

interface StripeConfig {
  deploy: string;
  test: string;
}

const stripeKeys: StripeConfig = {
  deploy: process.env.STRIPE_SECRET_KEY_DEPLOY || '',
  test: process.env.STRIPE_SECRET_KEY_TEST || ''
};

const getStripeKey = (): string => {
  const isDeployMode = process.env.STRIPE_DEPLOY_MODE === 'true';
  return stripeKeys[isDeployMode ? 'deploy' : 'test'];
};

interface CheckoutItem {
  price: number;
  quantity: number;
  name: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { 
      productId, 
      productType,
      items, 
      currency, 
      email, 
      name, 
      phoneNumber,
      isMale,
      queryCity
    }: {
      productId: number;
      productType: string;
      items: CheckoutItem[];
      currency: string;
      email: string;
      name: string;
      phoneNumber?: string;
      isMale: boolean;
      queryCity?: string;
    } = await request.json();

    // Normalize email to lowercase
    const normalizedEmail = email ? email.toLowerCase() : '';

    console.log('Request data:', {
      productId,
      productType,
      items,
      currency,
      email: normalizedEmail,
      name,
      phoneNumber,
      isMale,
      queryCity
    });

    const domain = request.headers.get('host') || '';
    const siteName = domain.split('.')[0] || 'tempodating';

    const stripe = new Stripe(getStripeKey(), {
      apiVersion: '2024-11-20.acacia',
    });
    
    // Validate items (allow zero price for free tickets)
    const validatedItems = items.filter(item => {
      const quantity = Math.floor(Number(item.quantity));
      return quantity >= 1 && Number.isFinite(item.price) && item.price >= 0;
    });

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'No valid items provided' }, { status: 400 });
    }

    // Calculate total order amount
    const totalOrderAmount = validatedItems.reduce((total, item) => {
      return total + (Number(item.price) * Math.floor(Number(item.quantity)));
    }, 0);

    const supabase = createServiceSupabaseClient();

    // Handle free tickets - skip Stripe and go directly to success
    if (totalOrderAmount === 0) {
      // Create a checkout record for free ticket
      const checkoutSessionId = `free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: checkout, error } = await supabase
        .from('checkout')
        .insert({
          checkout_session_id: checkoutSessionId,
          email: normalizedEmail,
          site_name: siteName,
          total_order: 0,
          customer_id: '',
          product_type: productType,
          product_id: productId,
          confirmation_email_sent: false,
          product_description: items[0]?.name || '',
          experiment: null,
          checkout_time: new Date().toISOString(),
          name: name || null,
          phone_number: phoneNumber || null,
          is_male: isMale,
          query_city: queryCity || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating free checkout:', error);
        return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
      }

      // Return success URL directly for free tickets
      const successUrl = `${request.nextUrl.origin}/checkout-success/${productType}?checkoutSessionId=${checkoutSessionId}&email=${normalizedEmail}`;
      return NextResponse.json({ 
        url: successUrl, 
        checkoutId: checkout.checkout_id, 
        isFree: true 
      }, { status: 200 });
    }

    // Create a Stripe Checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: validatedItems.map(item => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: Math.floor(Number(item.quantity)),
      })),
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/checkout-success/${productType}?checkoutSessionId={CHECKOUT_SESSION_ID}&email=${normalizedEmail}`,
      cancel_url: `${request.nextUrl.origin}/product?productId=${productId}&eventType=${productType}`,
    };

    if (normalizedEmail) {
      sessionConfig.customer_email = normalizedEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Create a Checkout record
    const { data: checkout, error } = await supabase
      .from('checkout')
      .insert({
        checkout_session_id: session.id,
        email: normalizedEmail,
        site_name: siteName,
        total_order: totalOrderAmount,
        customer_id: session.customer?.toString() || '',
        product_type: productType,
        product_id: productId,
        confirmation_email_sent: false,
        product_description: items[0]?.name || '',
        experiment: null,
        checkout_time: new Date().toISOString(),
        name: name || null,
        phone_number: phoneNumber || null,
        is_male: isMale,
        query_city: queryCity || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating checkout:', error);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    return NextResponse.json({ 
      url: session.url, 
      checkoutId: checkout.checkout_id 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: 'Server error occurred', 
      details: error.message 
    }, { status: 500 });
  }
}
