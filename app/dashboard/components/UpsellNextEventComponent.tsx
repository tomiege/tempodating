'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react'

interface CheckoutData {
  productId: number
  productType: string
  queryCity: string | null
}

interface OnlineSpeedDatingProduct {
  productId: number
  gmtdatetime: string
  title: string
  country: string
  city: string
  timezone: string
  male_price: number
  female_price: number
  currency: string
  duration_in_minutes: number
  soldOut: boolean
  productType: string
}

interface UpsellNextEventComponentProps {
  checkouts: CheckoutData[]
  onlineSpeedDatingProducts: OnlineSpeedDatingProduct[]
}

export function UpsellNextEventComponent({
  checkouts,
  onlineSpeedDatingProducts,
}: UpsellNextEventComponentProps) {
  const now = new Date()

  // Product IDs the user already owns
  const ownedProductIds = new Set(checkouts.map((c) => c.productId))

  // Look up the product city for each owned checkout using the products list,
  // and remember the queryCity for link params
  const cityQueryCityMap = new Map<string, string | null>()
  for (const checkout of checkouts) {
    const product = onlineSpeedDatingProducts.find(
      (p) => p.productId === checkout.productId
    )
    if (product) {
      const cityLower = product.city.toLowerCase()
      if (!cityQueryCityMap.has(cityLower)) {
        cityQueryCityMap.set(cityLower, checkout.queryCity)
      }
    }
  }

  if (cityQueryCityMap.size === 0) return null

  // Find the soonest upcoming event in one of their cities that they don't already own
  const upsellEvent = onlineSpeedDatingProducts
    .filter(
      (p) =>
        !p.soldOut &&
        new Date(p.gmtdatetime) > now &&
        cityQueryCityMap.has(p.city.toLowerCase()) &&
        !ownedProductIds.has(p.productId)
    )
    .sort(
      (a, b) =>
        new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime()
    )[0]

  if (!upsellEvent) return null

  const queryCity = cityQueryCityMap.get(upsellEvent.city.toLowerCase())
  const displayCity = queryCity || upsellEvent.city

  const eventDate = new Date(upsellEvent.gmtdatetime)
  const localDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const localTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const bookUrl = `/product?productId=${upsellEvent.productId}&productType=${upsellEvent.productType}${queryCity ? `&city=${encodeURIComponent(queryCity)}` : ''}&src=book-another-round`

  return (
    <div className="overflow-hidden rounded-xl border border-primary/20">
      {/* Banner image — shown in full */}
      <div className="relative w-full">
        <Image
          src="/onlineSpeedDating/banner.jpg"
          alt="Speed Dating Event"
          width={1280}
          height={720}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* CTA + details */}
      <div className="px-5 py-4 bg-gradient-to-r from-primary/5 to-primary/10 space-y-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-foreground">
            Ready for another round? Secure your next spot in {displayCity}!
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {displayCity}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {localDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {localTime}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground italic hidden sm:inline">
              Spots are limited
            </span>
            <Button asChild size="sm">
              <Link href={bookUrl}>Book Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
