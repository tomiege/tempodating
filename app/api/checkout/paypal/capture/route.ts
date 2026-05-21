import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/checkout/paypal/capture
 *
 * PayPal redirects here after the buyer approves payment.
 * Query params from PayPal: token (= PayPal order ID), PayerID
 * Query params we added to the return_url: productType, email
 *
 * Steps:
 *  1. Capture the PayPal order
 *  2. Redirect the buyer to /checkout-success/[productType]?checkoutSessionId=...
 */

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
    const errorBody = await response.text();
    console.error('[PayPal Capture] Failed to get access token:', errorBody);
    throw new Error('Failed to obtain PayPal access token');
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;

  // PayPal supplies: token (order ID), PayerID
  const token = searchParams.get('token'); // PayPal order ID
  const productType = searchParams.get('productType') || '';
  const email = searchParams.get('email') || '';

  if (!token) {
    console.error('[PayPal Capture] Missing token in callback');
    return NextResponse.redirect(`${origin}/?error=paypal_missing_token`);
  }

  try {
    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${token}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!captureResponse.ok) {
      const errorBody = await captureResponse.text();
      console.error('[PayPal Capture] Capture failed:', errorBody);
      return NextResponse.redirect(
        `${origin}/?error=paypal_capture_failed`
      );
    }

    const captureData = await captureResponse.json();
    console.log('[PayPal Capture] Capture status:', captureData.status, 'Order:', token);

    if (captureData.status !== 'COMPLETED') {
      console.error('[PayPal Capture] Order not completed. Status:', captureData.status);
      return NextResponse.redirect(
        `${origin}/?error=paypal_payment_not_completed`
      );
    }

    // Redirect to checkout success — same pattern as Stripe
    const successUrl =
      `${origin}/checkout-success/${productType}` +
      `?checkoutSessionId=${encodeURIComponent(token)}` +
      `&email=${encodeURIComponent(email)}`;

    console.log('[PayPal Capture] Payment complete. Redirecting to:', successUrl);
    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error('[PayPal Capture] Unexpected error:', error.message);
    return NextResponse.redirect(`${origin}/?error=paypal_error`);
  }
}
