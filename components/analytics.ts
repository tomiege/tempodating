/**
 * Lightweight analytics client — fire-and-forget event capture to our own Supabase backend.
 * Mirrors the events we send to PostHog so we have a redundant copy we fully own.
 *
 * Usage:
 *   import { capture } from '@/components/analytics'
 *   capture('viewed_product', { product_id: 123, product_type: 'onlineSpeedDating' })
 */

type EventProperties = Record<string, unknown>

export function capture(eventName: string, properties?: EventProperties) {
  // Fire-and-forget — never block the caller or surface errors to the user
  const payload = {
    event_name: eventName,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    ...properties,
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // Use keepalive so the request survives page navigations (e.g. redirect to Stripe)
    keepalive: true,
  }).catch(() => {
    // Silently swallow — analytics should never break the product
  })
}
