import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server';

interface CheckoutItem {
  price: number;
  quantity: number;
  name: string;
}

// ---------------------------------------------------------------------------
// PayPal helpers
// ---------------------------------------------------------------------------

const PAYPAL_BASE_URL = process.env.PAYPAL_SANDBOX === 'false'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const isSandbox = process.env.PAYPAL_SANDBOX !== 'false';
  const clientId = isSandbox
    ? process.env.PAYPAL_TEST_CLIENT_ID
    : process.env.PAYPAL_PROD_CLIENT_ID;
  const clientSecret = isSandbox
    ? process.env.PAYPAL_TEST_CLIENT_SECRET
    : process.env.PAYPAL_PROD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[PayPal] Failed to get access token:', err);
    throw new Error('Failed to obtain PayPal access token');
  }

  const data = await response.json();
  return data.access_token as string;
}

/**
 * Creates a PayPal payment link (ncp/payment/TOKEN format) via the
 * payment-resources API. PayPal auto-captures on payment — no separate
 * capture step required. returnUrl is embedded upfront so PayPal sends
 * the buyer directly to our checkout-success page.
 */
async function createPayPalPaymentLink(
  accessToken: string,
  {
    items,
    currency,
    returnUrl,
  }: {
    items: CheckoutItem[];
    currency: string;
    returnUrl?: string;
  }
): Promise<{ id: string; paymentLink: string }> {
  const currencyCode = currency.toUpperCase();
  const formatAmount = (cents: number) => (cents / 100).toFixed(2);

  const totalCents = items.reduce(
    (sum, item) => sum + Math.round(item.price) * Math.floor(Number(item.quantity)),
    0
  );

  const body: Record<string, unknown> = {
    integration_mode: 'LINK',
    type: 'BUY_NOW',
    reusable: 'MULTIPLE', // SINGLE not yet supported by PayPal; each session has a unique return_url so it's effectively one-time
    ...(returnUrl ? { return_url: returnUrl } : {}),
    line_items: [
      {
        name: items[0].name.slice(0, 127),
        collect_shipping_address: false,
        unit_amount: {
          currency_code: currencyCode,
          value: formatAmount(totalCents),
        },
      },
    ],
  };

  console.log('[PayPal] Creating payment link:', JSON.stringify(body, null, 2));

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/checkout/payment-resources`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'PayPal-Request-Id': randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[PayPal] Failed to create payment link:', err);
    throw new Error('Failed to create PayPal payment link');
  }

  const data = await response.json();
  console.log('[PayPal] Payment link response:', JSON.stringify(data, null, 2));

  const paymentLink =
    data.payment_link ||
    data.links?.find(
      (l: { rel: string; href: string }) =>
        l.rel === 'payment_link' || l.rel === 'approve'
    )?.href;

  if (!paymentLink) {
    console.error('[PayPal] No payment link in response:', data);
    throw new Error('No PayPal payment link returned');
  }

  return { id: data.id as string, paymentLink };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

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
      queryCity,
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

    const normalizedEmail = email ? email.toLowerCase() : '';

    console.log('[PayPal] Request data:', {
      productId,
      productType,
      currency,
      email: normalizedEmail,
      name,
      isMale,
      queryCity,
    });

    const origin = request.nextUrl.origin;
    const isLocalhost =
      origin.includes('localhost') || origin.includes('127.0.0.1');

    const domain = request.headers.get('host') || '';
    const siteName = domain.split('.')[0] || 'tempodating';

    // Validate items
    const validatedItems = items.filter(item => {
      const quantity = Math.floor(Number(item.quantity));
      return quantity >= 1 && Number.isFinite(item.price) && item.price >= 0;
    });

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'No valid items provided' }, { status: 400 });
    }

    const totalOrderAmount = validatedItems.reduce(
      (total, item) => total + Math.round(item.price) * Math.floor(Number(item.quantity)),
      0
    );

    // Get authenticated user from session (if any)
    const sessionSupabase = await createServerSupabaseClient();
    const { data: { user } } = await sessionSupabase.auth.getUser();
    const userId = user?.id || null;

    const supabase = createServiceSupabaseClient();

    // ------------------------------------------------------------------
    // Free tickets — skip PayPal entirely
    // ------------------------------------------------------------------
    if (totalOrderAmount === 0) {
      const checkoutSessionId = `free_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const { data: checkout, error } = await supabase
        .from('checkout')
        .insert({
          checkout_session_id: checkoutSessionId,
          user_id: userId,
          email: normalizedEmail,
          site_name: siteName,
          total_order: 0,
          customer_id: '',
          product_type: productType,
          product_id: productId,
          confirmation_email_sent: false,
          currency: currency?.toLowerCase() || 'usd',
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
        console.error('[PayPal] Error creating free checkout:', error);
        return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
      }

      const successUrl = `${origin}/checkout-success/${productType}?checkoutSessionId=${checkoutSessionId}&email=${encodeURIComponent(normalizedEmail)}`;
      return NextResponse.json({
        url: successUrl,
        checkoutId: checkout.checkout_id,
        isFree: true,
      }, { status: 200 });
    }

    // ------------------------------------------------------------------
    // Paid tickets — create a PayPal payment link
    // ------------------------------------------------------------------

    // Generate our own session ID before calling PayPal so we can embed it
    // in the return_url. PayPal sends the buyer straight back here after payment.
    const checkoutSessionId = randomUUID();

    // PayPal rejects localhost return URLs — omit on local dev
    const returnUrl = isLocalhost
      ? undefined
      : `${origin}/checkout-success/${productType}` +
        `?checkoutSessionId=${checkoutSessionId}` +
        `&email=${encodeURIComponent(normalizedEmail)}`;

    const accessToken = await getPayPalAccessToken();

    const { id: paypalResourceId, paymentLink } = await createPayPalPaymentLink(
      accessToken,
      { items: validatedItems, currency, returnUrl }
    );

    // Save checkout record using our session ID (not PayPal's resource ID)
    // so the return_url resolves correctly on success page load
    const { data: checkout, error } = await supabase
      .from('checkout')
      .insert({
        checkout_session_id: checkoutSessionId,
        user_id: userId,
        email: normalizedEmail,
        site_name: siteName,
        total_order: totalOrderAmount,
        customer_id: paypalResourceId, // store PayPal's ID for reference
        product_type: productType,
        product_id: productId,
        confirmation_email_sent: false,
        currency: currency?.toLowerCase() || 'usd',
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
      console.error('[PayPal] Error saving checkout record:', error);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    console.log('[PayPal] Payment link created:', paypalResourceId, '→', paymentLink);

    return NextResponse.json({
      url: paymentLink,       // ncp/payment/TOKEN — frontend redirects here
      checkoutId: checkout.checkout_id,
      paypalResourceId,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[PayPal] Error creating checkout:', error);
    return NextResponse.json({
      error: 'Server error occurred',
      details: error.message,
    }, { status: 500 });
  }
}
