'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Video,
  ShoppingBag,
} from "lucide-react"

interface EventProduct {
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
  region_id: string
}

interface OnDemandProduct {
  productId: number
  title: string
  description: string
  productType: string
  category: string
  price: number
  currency: string
  imageUrl: string
  available: boolean
  featured: boolean
  gender: string
}

const productTypeLabels: Record<string, string> = {
  onlineSpeedDating: 'Speed Dating',
  onlineSpeedDatingGay: 'Gay Speed Dating',
  onlineSpeedDatingIndian: 'Indian Speed Dating',
  onlineSpeedDatingJewish: 'Jewish Speed Dating',
  onlineSpeedDatingMuslim: 'Muslim Speed Dating',
  geoMaxing: 'GeoMaxing',
  socialMediaMaxing: 'Social Media Maxing',
  workshop: 'Workshop',
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export default function CatalogPage() {
  const [events, setEvents] = useState<EventProduct[]>([])
  const [onDemand, setOnDemand] = useState<OnDemandProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, onDemandRes] = await Promise.all([
          fetch('/products/events.json'),
          fetch('/products/onDemand.json'),
        ])
        const eventsData: EventProduct[] = await eventsRes.json()
        const onDemandData: OnDemandProduct[] = await onDemandRes.json()

        // Only show future, non-sold-out events, sorted by date
        const now = new Date()
        const upcoming = eventsData
          .filter(e => new Date(e.gmtdatetime) > now && !e.soldOut)
          .sort((a, b) => new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime())

        setEvents(upcoming)
        setOnDemand(onDemandData.filter(p => p.available))
      } catch {
        // silently fail — page will show empty states
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  // Group events by productType
  const eventsByType: Record<string, EventProduct[]> = {}
  for (const event of events) {
    if (!eventsByType[event.productType]) {
      eventsByType[event.productType] = []
    }
    eventsByType[event.productType].push(event)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Catalog</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Browse all upcoming events and on-demand products.
              </p>
            </div>

            {/* Upcoming Events */}
            <div className="max-w-6xl mx-auto mb-16">
              <div className="flex items-center gap-3 mb-6">
                <Video className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                <Badge variant="secondary">{events.length}</Badge>
              </div>

              {Object.entries(eventsByType).map(([type, typeEvents]) => (
                <div key={type} className="mb-10">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-4">
                    {productTypeLabels[type] || type}
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeEvents.map((event) => {
                      const date = new Date(event.gmtdatetime)
                      const formattedDate = date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                      const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      })

                      return (
                        <Link
                          key={event.productId}
                          href={`/product?productId=${event.productId}&productType=${event.productType}`}
                        >
                          <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base">{event.title}</CardTitle>
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  {productTypeLabels[event.productType] || event.productType}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>{event.city}, {event.country}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 shrink-0" />
                                <span>{formattedDate}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>{formattedTime} · {event.duration_in_minutes} min</span>
                              </div>
                              <p className="text-sm font-medium text-foreground pt-1">
                                From {formatPrice(Math.min(event.male_price, event.female_price), event.currency)}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No upcoming events right now. Check back soon!</p>
              )}
            </div>

            {/* On-Demand Products */}
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">On-Demand Products</h2>
                <Badge variant="secondary">{onDemand.length}</Badge>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {onDemand.map((product) => (
                  <Link
                    key={product.productId}
                    href={`/product/${product.productType}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                        {product.featured && (
                          <Badge className="absolute top-2 right-2">Featured</Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{product.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {formatPrice(product.price, product.currency)}
                          </span>
                          <Badge variant="outline">{product.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {onDemand.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No on-demand products available right now.</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
