import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/checkout
 *
 * Routes to the Stripe or PayPal checkout handler depending on the
 * PAYMENT_PROCESSOR environment variable (STRIPE | PAYPAL).
 * Defaults to STRIPE if the variable is not set.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const processor = (process.env.PAYMENT_PROCESSOR || 'STRIPE').toUpperCase();

  if (processor === 'PAYPAL') {
    // Dynamically import to keep bundles clean
    const { POST: paypalHandler } = await import('./paypal/route');
    return paypalHandler(request);
  }

  // Default: Stripe
  const { POST: stripeHandler } = await import('./stripe/route');
  return stripeHandler(request);
}
