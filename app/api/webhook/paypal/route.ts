import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

// ---------------------------------------------------------------------------
// PayPal Webhook Verification
// ---------------------------------------------------------------------------

const PAYPAL_BASE_URL =
  process.env.PAYPAL_SANDBOX === 'false'
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
    console.error('[PayPal Webhook] Failed to get access token:', err);
    throw new Error('Failed to obtain PayPal access token');
  }

  const data = await response.json();
  return data.access_token as string;
}

/**
 * Verifies a PayPal webhook signature using PayPal's verification API.
 * Returns true if the signature is valid, false otherwise.
 */
async function verifyPayPalWebhookSignature(
  accessToken: string,
  headers: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // If no webhook ID is configured, skip verification (dev/test mode)
    console.warn('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set — skipping signature verification');
    return true;
  }

  const verifyBody = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyBody),
    }
  );

  if (!response.ok) {
    console.error('[PayPal Webhook] Verification API error:', await response.text());
    return false;
  }

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * POST /api/webhook/paypal
 *
 * Receives and persists all PayPal webhook events. Verifies the signature
 * using PayPal's verification API when PAYPAL_WEBHOOK_ID is configured.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let rawBody: string;
  let event: Record<string, unknown>;

  // Read raw body (needed for signature verification)
  try {
    rawBody = await request.text();
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('[PayPal Webhook] Failed to parse body:', err);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Extract PayPal signature headers
  const webhookHeaders: Record<string, string> = {
    'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
    'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
    'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
    'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
  };

  const eventId = (event.id as string) || null;
  const eventType = (event.event_type as string) || 'UNKNOWN';

  console.log(`[PayPal Webhook] Received event: ${eventType} (id=${eventId})`);

  const supabase = createServiceSupabaseClient();

  // Verify signature
  let verified = false;
  let verificationError: string | null = null;

  try {
    const accessToken = await getPayPalAccessToken();
    verified = await verifyPayPalWebhookSignature(accessToken, webhookHeaders, rawBody);
  } catch (err: any) {
    verificationError = err?.message || 'Unknown verification error';
    console.error('[PayPal Webhook] Signature verification failed:', verificationError);
    // We still save the event, but mark it as unverified
  }

  if (!verified && !verificationError && process.env.PAYPAL_WEBHOOK_ID) {
    // Signature check ran successfully but returned FAILURE
    console.warn(`[PayPal Webhook] Invalid signature for event ${eventId}`);
  }

  // Persist the webhook event to the database
  const { error: dbError } = await supabase.from('paypal_webhooks').insert({
    paypal_event_id: eventId,
    event_type: eventType,
    resource_type: (event.resource_type as string) || null,
    resource_id: (event as any)?.resource?.id || null,
    summary: (event.summary as string) || null,
    payload: event,
    raw_headers: webhookHeaders,
    verified,
    verification_error: verificationError,
  });

  if (dbError) {
    console.error('[PayPal Webhook] Failed to save event to DB:', dbError);
    // Still return 200 so PayPal doesn't retry indefinitely while we debug
    return NextResponse.json(
      { error: 'Failed to persist event', details: dbError.message },
      { status: 200 }
    );
  }

  console.log(`[PayPal Webhook] Saved event ${eventId} (${eventType}), verified=${verified}`);

  return NextResponse.json({ received: true }, { status: 200 });
}
