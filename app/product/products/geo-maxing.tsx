"use client"

import React, { useState, useEffect, Suspense } from "react"
import * as Sentry from '@sentry/nextjs'
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import TicketModal from "../components/ticket-modal"
import { 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft,
  Loader2,
  Plane,
  Globe,
  MapPin,
} from "lucide-react"

interface GeoMaxingEvent {
  productId: number
  gmtdatetime: string
  title: string
  country: string
  city: string
  latitude: number | null
  longitude: number | null
  timezone: string
  male_price: number
  female_price: number
  currency: string
  duration_in_minutes: number
  soldOut: boolean
  productType: string
  zoomInvite: string
  region_id: string
}

function ProductContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const productType = searchParams.get('productType')
  const redemptionId = searchParams.get('redemptionId')
  
  const [product, setProduct] = useState<GeoMaxingEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const galleryImages = [
    "/geoMaxing/gallery/1.jpg",
    "/geoMaxing/gallery/2.jpg",
    "/geoMaxing/gallery/3.jpg",
    "/geoMaxing/gallery/4.jpg"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchProduct() {
      if (!productId || !productType) {
        setError('Missing productId or productType in URL')
        setLoading(false)
        return
      }

      try {
        // geoMaxing events are in events.json
        const eventsRes = await fetch('/products/events.json')
        if (!eventsRes.ok) throw new Error('Failed to fetch events')
        const allEvents = await eventsRes.json()
        
        const foundProduct = allEvents.find(
          (p: GeoMaxingEvent) => p.productId === parseInt(productId) && p.productType === 'geoMaxing'
        )

        if (!foundProduct) {
          setError(`Product with ID ${productId} not found`)
        } else {
          setProduct(foundProduct)
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { source: 'product-page-geomaxing', productId: productId ?? undefined, productType: productType ?? undefined },
        })
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, productType])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Card className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || 'Unable to load product details'}</p>
              <Link href="/">
                <Button>Return Home</Button>
              </Link>
            </Card>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const eventDate = new Date(product.gmtdatetime)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Banner Image */}
          <div className="relative rounded-2xl overflow-hidden mb-8 aspect-video">
            <Image
              src="/geoMaxing/banner.jpg"
              alt="GeoMaxing - Travel to Find Love"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Event Title */}
          <div className="mb-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
              GeoMaxing | <span className="text-primary">Travel to Find Love</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A live workshop on how to leverage international travel to expand your dating pool and find meaningful connections abroad.
            </p>
          </div>

          {/* Event Details */}
          <Card className="mb-6 max-w-2xl mx-auto bg-white">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-foreground font-medium">{formattedDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-foreground font-medium">Start Time: {formattedTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-foreground font-medium">Open to all — join from anywhere</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Register Button */}
          {!product.soldOut ? (
            <div className="mb-8 max-w-md mx-auto">
              <Button 
                size="lg" 
                className="w-full text-lg py-6 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                Register Now
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Limited spots available. Secure your place today!
              </p>
            </div>
          ) : (
            <div className="text-center mb-8 max-w-md mx-auto">
              <div className="bg-red-50 text-red-700 rounded-lg p-4">
                <p className="font-semibold">Sold Out</p>
                <p className="text-sm mt-1">This event is fully booked</p>
              </div>
            </div>
          )}

          {/* Promotional Section */}
          <Card className="mb-8 max-w-3xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border-primary/20">
            <CardContent className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 flex items-start gap-2">
                    <span className="text-3xl">✈️</span>
                    <span>Find Love Across Borders</span>
                  </h2>
                  <p className="text-lg font-semibold text-primary mb-4">
                    Expand Your Dating Horizons
                  </p>
                  <p className="text-muted-foreground mb-3">
                    Discover the best destinations for dating — Thailand, South America, Eastern Europe, Japan — and learn 
                    how to make <span className="text-primary font-semibold">genuine connections</span> while travelling.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Join our live session with fellow travellers and dating coaches who&apos;ve been there.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {!product.soldOut && (
                      <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer px-6"
                      >
                        Register
                      </Button>
                    )}
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                      <Image src="/brands/zoom.png" alt="Zoom" width={24} height={24} className="object-contain" />
                      <span className="text-sm font-medium text-foreground">Hosted on Zoom</span>
                    </div>
                  </div>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  {galleryImages.map((image, index) => (
                    <Image
                      key={image}
                      src={image}
                      alt="Travel dating destination"
                      fill
                      className={`object-cover transition-opacity duration-1000 absolute inset-0 ${
                        index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      priority={index === 0}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <div className="space-y-8">
              {/* What You'll Learn */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-6">What You&apos;ll Learn</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Plane className="w-5 h-5 text-primary" /> Top Destinations for Dating Abroad
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Learn which countries and cities offer the best opportunities — Thailand, Colombia, Poland, Japan — and why location matters more than you think.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" /> Cultural Dating Tips & Etiquette
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Understand cultural differences, communication styles, and social norms. Stand out as a respectful, interesting person — not just another tourist.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" /> Building Real Connections Abroad
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        How to set up dates before you arrive, which apps work best by region, and how to turn a holiday fling into a meaningful relationship.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!product.soldOut && (
                <div className="text-center">
                  <Button 
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                    className="px-12 py-6 text-lg cursor-pointer"
                  >
                    Register Now
                  </Button>
                </div>
              )}

              {/* Social Proof */}
              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">🌍</span>
                        <p className="text-3xl font-bold text-foreground">20+</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Countries Covered</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">💍</span>
                        <p className="text-3xl font-bold text-foreground">500+</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Success Stories</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">⭐</span>
                        <p className="text-3xl font-bold text-foreground">4.8/5</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {product && (
        <TicketModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventTitle="GeoMaxing: Travel to Find Love"
          eventDate={formattedDate}
          eventTime={formattedTime}
          eventCity="Global"
          price={product.male_price}
          femalePrice={product.female_price}
          currency={product.currency}
          productId={product.productId}
          productType={product.productType}
          regionId={product.region_id}
          redemptionId={redemptionId}
        />
      )}
    </main>
  )
}

export default function GeoMaxingProductPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </section>
        <Footer />
      </main>
    }>
      <ProductContent />
    </Suspense>
  )
}
