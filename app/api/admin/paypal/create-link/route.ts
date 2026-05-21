import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const PAYPAL_URLS = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  prod: 'https://api-m.paypal.com',
};

async function getAccessToken(sandbox: boolean): Promise<string> {
  const clientId = sandbox
    ? process.env.PAYPAL_TEST_CLIENT_ID
    : process.env.PAYPAL_PROD_CLIENT_ID;
  const clientSecret = sandbox
    ? process.env.PAYPAL_TEST_CLIENT_SECRET
    : process.env.PAYPAL_PROD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const base = sandbox ? PAYPAL_URLS.sandbox : PAYPAL_URLS.prod;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { title, description, price, currency, sandbox, noShipping, returnUrl } = await request.json();

    if (!title || !price || !currency) {
      return NextResponse.json(
        { error: 'title, price and currency are required' },
        { status: 400 }
      );
    }

    const isSandbox = sandbox === true;
    const base = isSandbox ? PAYPAL_URLS.sandbox : PAYPAL_URLS.prod;
    const accessToken = await getAccessToken(isSandbox);

    const amountValue = parseFloat(price).toFixed(2);
    const currencyCode = (currency as string).toUpperCase();

    // POST /v1/checkout/payment-resources creates a persistent payment link
    // that returns a https://www.paypal.com/ncp/payment/TOKEN URL
    const origin = request.nextUrl.origin;
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    // Prefer the explicit returnUrl from the form; fall back to /admin/paypal on prod
    const resolvedReturnUrl: string | undefined =
      returnUrl ||
      (isLocalhost ? undefined : `${origin}/admin/paypal?status=success`);

    const lineItem: Record<string, unknown> = {
      name: title,
      ...(description ? { description } : {}),
      unit_amount: {
        currency_code: currencyCode,
        value: amountValue,
      },
      // collect_shipping_address lives inside the line item (not top-level)
      collect_shipping_address: !noShipping,
    };

    const body: Record<string, unknown> = {
      integration_mode: 'LINK',
      type: 'BUY_NOW',
      reusable: 'MULTIPLE',
      ...(resolvedReturnUrl ? { return_url: resolvedReturnUrl } : {}),
      line_items: [lineItem],
    };

    console.log('[PayPal Admin] Creating payment link:', JSON.stringify(body, null, 2));

    const res = await fetch(`${base}/v1/checkout/payment-resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'PayPal-Request-Id': randomUUID(), // idempotency key
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log('[PayPal Admin] Response:', JSON.stringify(data, null, 2));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || JSON.stringify(data) },
        { status: res.status }
      );
    }

    // Response contains payment_link (the ncp/payment/TOKEN URL) and id
    const paymentUrl = data.payment_link || data.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve' || l.rel === 'payment_link'
    )?.href;

    if (!paymentUrl) {
      console.error('[PayPal Admin] No payment_link in response:', data);
      return NextResponse.json(
        { error: 'PayPal did not return a payment link', raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      url: paymentUrl,
      sandbox: isSandbox,
    });
  } catch (err: any) {
    console.error('[PayPal Admin]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
