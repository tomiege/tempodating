'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Gift,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react'

interface RedemptionData {
  id: string
  code: string | null
  product_id: number | null
  product_type: string
  for_gender: 'male' | 'female' | 'both'
  discount_percent: number
  max_uses: number
  used_count: number
  expires_at: string
  note: string | null
  expired: boolean
  fullyUsed: boolean
  valid: boolean
}

interface ProductData {
  productId: number
  gmtdatetime: string
  title: string
  city: string
  country: string
  timezone: string
  duration_in_minutes: number
  productType: string
}

function RedeemContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redemptionId = searchParams.get('redemptionId')

  const [redemption, setRedemption] = useState<RedemptionData | null>(null)
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [redeemed, setRedeemed] = useState(false)

  useEffect(() => {
    if (!redemptionId) {
      setError('No redemption code provided')
      setLoading(false)
      return
    }

    const fetchRedemption = async () => {
      try {
        const res = await fetch(`/api/redemptions/redeem?id=${encodeURIComponent(redemptionId)}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Invalid redemption code')
          setLoading(false)
          return
        }

        const data: RedemptionData = await res.json()
        setRedemption(data)

        // Fetch product details (skip for wildcard codes)
        if (data.product_id !== null) {
          const productRes = await fetch(`/api/products/${data.product_type}`)
          if (productRes.ok) {
            const products: ProductData[] = await productRes.json()
            const matched = products.find((p) => p.productId === data.product_id)
            if (matched) setProduct(matched)
          }
        }
      } catch {
        setError('Failed to load redemption details')
      } finally {
        setLoading(false)
      }
    }

    fetchRedemption()
  }, [redemptionId])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!redemptionId || !name.trim() || !email.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/redemptions/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redemptionId: redemption?.id || redemptionId,
          email: email.trim(),
          name: name.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to redeem')
        setSubmitting(false)
        return
      }

      setRedeemed(true)
      // Redirect to success after a moment
      setTimeout(() => {
        router.push(data.redirectUrl)
      }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-muted-foreground">Loading redemption details...</span>
      </div>
    )
  }

  if (!redemptionId || error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">Invalid Redemption</h2>
          <p className="text-sm text-muted-foreground">{error || 'No redemption code was provided.'}</p>
        </CardContent>
      </Card>
    )
  }

  if (redemption && !redemption.valid) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">
            {redemption.fullyUsed ? 'Code Fully Used' : 'Code Expired'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {redemption.fullyUsed
              ? 'This redemption code has reached its maximum number of uses.'
              : 'This redemption code has expired and is no longer valid.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (redeemed) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">Ticket Redeemed!</h2>
          <p className="text-sm text-muted-foreground">Redirecting you to your confirmation...</p>
        </CardContent>
      </Card>
    )
  }

  const eventDate = product
    ? new Date(product.gmtdatetime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null

  const eventTime = product
    ? new Date(product.gmtdatetime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="w-6 h-6 text-primary" />
          </div>
        </div>
        <CardTitle className="font-serif text-xl">Redeem Your Free Ticket</CardTitle>
        {redemption?.note && (
          <p className="text-sm text-muted-foreground mt-1">{redemption.note}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event details */}
        {product && (
          <div className="rounded-lg border bg-secondary/30 p-4 space-y-2">
            <h3 className="font-medium text-sm">{product.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{product.city}, {product.country}</span>
              </div>
              {eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{eventDate}</span>
                </div>
              )}
              {eventTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{eventTime} &bull; {product.duration_in_minutes} min</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Redemption form */}
        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : (
              'Redeem Ticket'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          {redemption && redemption.max_uses - redemption.used_count} redemption{redemption && redemption.max_uses - redemption.used_count !== 1 ? 's' : ''} remaining
        </p>
      </CardContent>
    </Card>
  )
}

export default function RedeemPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            }
          >
            <RedeemContent />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  )
}
