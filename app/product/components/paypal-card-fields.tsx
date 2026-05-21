'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PayPalCardFieldsProps {
  /** Params passed straight through to POST /api/checkout to create the order */
  checkoutParams: Record<string, unknown>
  /** Shown in the cardholder name field (pre-filled from step 2) */
  cardholderName: string
  /** Called with the PayPal order ID after a successful capture */
  onSuccess: (orderId: string) => void
  /** Called with a human-readable error message */
  onError: (message: string) => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paypal?: any
  }
}

const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX !== 'false'
const CLIENT_ID = isSandbox
  ? process.env.NEXT_PUBLIC_PAYPAL_TEST_CLIENT_ID
  : process.env.NEXT_PUBLIC_PAYPAL_PROD_CLIENT_ID

export default function PayPalCardFields({
  checkoutParams,
  cardholderName,
  onSuccess,
  onError,
}: PayPalCardFieldsProps) {
  const [sdkReady, setSdkReady] = useState(false)
  const [fieldsReady, setFieldsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostedFieldsRef = useRef<any>(null)
  const currency = ((checkoutParams.currency as string) || 'USD').toUpperCase()

  // ─── 1. Load the PayPal JS SDK once ────────────────────────────────────────
  useEffect(() => {
    if (!CLIENT_ID) {
      onError('PayPal client ID is not configured.')
      return
    }

    // Avoid double-loading
    if (window.paypal) {
      setSdkReady(true)
      return
    }

    const script = document.createElement('script')
    script.src =
      `https://www.paypal.com/sdk/js` +
      `?client-id=${CLIENT_ID}` +
      `&components=card-fields` +
      `&intent=capture` +
      `&currency=${currency}`
    script.async = true
    script.onload = () => setSdkReady(true)
    script.onerror = () => onError('Failed to load PayPal SDK.')
    document.head.appendChild(script)

    return () => {
      // Don't remove — React strict-mode remounts would re-fetch
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency])

  // ─── 2. Render hosted card fields once the SDK is ready ────────────────────
  useEffect(() => {
    if (!sdkReady || !window.paypal?.CardFields) return
    if (hostedFieldsRef.current) return // already initialised

    const cardFields = window.paypal.CardFields({
      /** createOrder is called by the SDK right before rendering */
      createOrder: async () => {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutParams),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create order')
        }
        const data = await res.json()
        // Free tickets are handled server-side; redirect immediately
        if (data.isFree && data.url) {
          window.location.href = data.url
          throw new Error('free') // prevent hosted fields from proceeding
        }
        return data.paypalOrderId as string
      },

      onApprove: async (data: { orderID: string }) => {
        onSuccess(data.orderID)
      },

      onError: (err: Error) => {
        console.error('[PayPal CardFields] onError:', err)
        if (err.message !== 'free') {
          setCardError('Payment failed. Please check your card details and try again.')
        }
        setIsSubmitting(false)
      },

      style: {
        input: {
          'font-size': '16px',
          'font-family': 'inherit',
          color: '#1a1a1a',
          padding: '0 12px',
        },
        ':focus': { color: '#1a1a1a' },
        '.valid': { color: '#16a34a' },
        '.invalid': { color: '#dc2626' },
      },
    })

    if (!cardFields.isEligible()) {
      onError(
        'Advanced Card Payments are not enabled on this PayPal account yet. ' +
        'Please enable it in your PayPal dashboard or contact support.'
      )
      return
    }

    // Render each field into its placeholder div
    cardFields.NameField({ placeholder: 'Name on card' }).render('#paypal-name-field')
    cardFields.NumberField({ placeholder: '•••• •••• •••• ••••' }).render('#paypal-number-field')
    cardFields.ExpiryField({ placeholder: 'MM / YY' }).render('#paypal-expiry-field')
    cardFields.CVVField({ placeholder: '•••' }).render('#paypal-cvv-field')

    hostedFieldsRef.current = cardFields
    setFieldsReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady])

  // ─── 3. Submit ─────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!hostedFieldsRef.current) return
    setIsSubmitting(true)
    setCardError(null)
    try {
      await hostedFieldsRef.current.submit({ cardholderName })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg !== 'free') {
        setCardError('Payment failed. Please check your card details.')
      }
      setIsSubmitting(false)
    }
  }

  // Shared iframe container style
  const fieldBox =
    'border border-border rounded-xl h-12 bg-background overflow-hidden flex items-center px-1'

  return (
    <div className="space-y-4 mt-4">
      {/* Loading skeleton while SDK / fields initialise */}
      {(!sdkReady || !fieldsReady) && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading secure payment form…</span>
        </div>
      )}

      {/* Card form — hidden until fields are ready so iframes don't flicker */}
      <div className={!fieldsReady ? 'invisible h-0 overflow-hidden' : 'space-y-4'}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Name on Card</label>
          <div id="paypal-name-field" className={fieldBox} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Card Number</label>
          <div id="paypal-number-field" className={fieldBox} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Expiry</label>
            <div id="paypal-expiry-field" className={fieldBox} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CVV</label>
            <div id="paypal-cvv-field" className={fieldBox} />
          </div>
        </div>

        {cardError && (
          <p className="text-sm text-red-600 font-medium">{cardError}</p>
        )}

        <Button
          onClick={handlePay}
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Pay Now
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
