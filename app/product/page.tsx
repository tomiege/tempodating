"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import TicketModal from "./components/ticket-modal"
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Heart, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Download,
  BookOpen,
  ShoppingBag
} from "lucide-react"

interface OnlineSpeedDatingEvent {
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
  downloadUrl: string
}

function ProductContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const productType = searchParams.get('productType')
  const cityOverride = searchParams.get('city')
  
  const [product, setProduct] = useState<OnlineSpeedDatingEvent | null>(null)
  const [onDemandProduct, setOnDemandProduct] = useState<OnDemandProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!productId || !productType) {
        setError('Missing productId or productType in URL')
        setLoading(false)
        return
      }

      try {
        let apiUrl = ''
        
        // Map productType to API endpoint
        if (productType === 'onlineSpeedDating') {
          apiUrl = '/api/products/onlineSpeedDating'
        } else if (productType === 'workshop') {
          apiUrl = '/api/products/workshop'
        } else if (productType === 'onDemand' || productType === 'datingEbook') {
          apiUrl = '/api/products/onDemand'
        } else {
          setError(`Unknown product type: ${productType}`)
          setLoading(false)
          return
        }

        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`)
        }

        const products = await response.json()
        
        // Filter for the specific product by productId
        const foundProduct = products.find(
          (p: OnlineSpeedDatingEvent | OnDemandProduct) => p.productId === parseInt(productId)
        )

        if (!foundProduct) {
          setError(`Product with ID ${productId} not found`)
        } else {
          if (productType === 'onDemand' || productType === 'datingEbook') {
            setOnDemandProduct(foundProduct as OnDemandProduct)
          } else {
            setProduct(foundProduct as OnlineSpeedDatingEvent)
          }
        }
      } catch (err) {
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

  if (error || (!product && !onDemandProduct)) {
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

  // Format price helper
  const formatPrice = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    })
    return formatter.format(price / 100)
  }

  // OnDemand Product Display
  if (onDemandProduct) {
    return (
      <main className="min-h-screen">
        <Header />
        
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Product Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
                  <BookOpen className="w-32 h-32 text-primary/30" />
                </div>
              </div>

              {/* Product Details */}
              <div>
                <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{onDemandProduct.category}</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
                  {onDemandProduct.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-8">
                  {onDemandProduct.description}
                </p>

                {/* Price Card */}
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Price</p>
                        <p className="text-3xl font-bold text-foreground">
                          {formatPrice(onDemandProduct.price, onDemandProduct.currency)}
                        </p>
                      </div>
                      {onDemandProduct.featured && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                          Featured
                        </span>
                      )}
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full text-lg py-6 cursor-pointer"
                      disabled={!onDemandProduct.available}
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Buy Now · {formatPrice(onDemandProduct.price, onDemandProduct.currency)}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Instant digital delivery. Secure payment.
                    </p>
                  </CardContent>
                </Card>

                {/* What's Included */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">What&apos;s Included</h2>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">Instant digital download</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">Lifetime access to content</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">Works on all devices</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">30-day money-back guarantee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    )
  }

  // Original OnlineSpeedDating/Workshop Display
  if (!product) {
    return null
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
          {/* Back link */}
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
              src={`/${productType}/banner.jpg`}
              alt={product.title}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Event Title */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
              {product.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {cityOverride || product.city}, {product.country}
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Details */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Event Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium text-foreground">{cityOverride || product.city}, {product.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium text-foreground">{formattedTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium text-foreground">{product.duration_in_minutes} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Platform</p>
                        <p className="font-medium text-foreground">Zoom</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-6">How The Event Works</h2>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Register & Complete Your Profile</h3>
                        <p className="text-sm text-muted-foreground">
                          Sign up for the event and complete our quick personality quiz. This helps us match you with compatible singles.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Receive Your Zoom Link</h3>
                        <p className="text-sm text-muted-foreground">
                          On the day of the event, you will receive a unique Zoom link via email. Join the call 5 minutes early.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Meet Your Matches</h3>
                        <p className="text-sm text-muted-foreground">
                          You will have 8-12 five-minute video dates with personality-matched singles. Our host guides each rotation.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Submit Your Matches</h3>
                        <p className="text-sm text-muted-foreground">
                          After the event, select who you would like to see again. If mutual, we share contact details!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What to Expect */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-4">What to Expect</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">Age-matched participants only</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">Professional host guiding the event</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">8-12 five-minute video dates</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">Mutual matches revealed after</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">Safe & friendly environment</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">Fun ice-breaker questions provided</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  {product.soldOut ? (
                    <div className="text-center mb-6">
                      <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4">
                        <p className="font-semibold">Sold Out</p>
                        <p className="text-sm mt-1">This event is fully booked</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-serif text-xl font-semibold text-foreground mb-4 text-center">Spots Are Limited!</h3>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Personality matched</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Video className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Via Zoom</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">{product.duration_in_minutes} minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">{cityOverride || product.city}, {product.country}</span>
                        </div>
                      </div>

                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Register Now
                      </Button>

                      <p className="text-xs text-center text-muted-foreground mt-4">
                        Secure payment. Cancel up to 24hrs before for full refund.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Ticket Modal */}
      {product && (
        <TicketModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventTitle={product.title}
          eventDate={new Date(product.gmtdatetime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          eventTime={new Date(product.gmtdatetime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}
          eventCity={cityOverride || product.city}
          price={product.male_price}
          femalePrice={product.female_price}
          currency={product.currency}
          productId={product.productId}
          productType={product.productType}
        />
      )}
    </main>
  )
}

export default function ProductPage() {
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
