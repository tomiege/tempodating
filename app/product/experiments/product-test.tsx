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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const galleryImages = [
    "/onlineSpeedDating/gallery/1.jpg",
    "/onlineSpeedDating/gallery/2.jpg",
    "/onlineSpeedDating/gallery/3.jpg",
    "/onlineSpeedDating/gallery/4.jpg"
  ]

  // Cycle through images every 4 seconds
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
        Sentry.captureException(err, {
          tags: { source: 'product-page-test', productId: productId ?? undefined, productType: productType ?? undefined },
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
          <div className="mb-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Online Speed Dating | <span className="text-primary">{cityOverride || product.city}</span>
            </h1>
          </div>

          {/* Event Details - Simple List */}
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
                  <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-foreground font-medium">Matched to your age</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Register Button - Centered and Prominent */}
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
                Spots are limited. Secure your place today!
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
          <Card className="mb-8 max-w-3xl mx-auto bg-gradient-to-br from-pink-50 to-purple-50 border-primary/20">
            <CardContent className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 flex items-start gap-2">
                    <span className="text-3xl">🏠</span>
                    <span>Virtual Speed Dating in {cityOverride || product.city}</span>
                  </h2>
                  <p className="text-lg font-semibold text-primary mb-4">
                    Unforgettable Encounters await! ✨
                  </p>
                  <p className="text-muted-foreground mb-3">
                    Connect with real {cityOverride || product.city} locals. 60 minutes, 8 first dates. <span className="text-primary font-semibold">Join from anywhere in {cityOverride || product.city}!</span>
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Register, take a quick quiz, and meet your best matches!
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
                      alt="Happy participant"
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
            {/* Main Content */}
            <div className="space-y-8">
              {/* How It Works */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-semibold text-foreground mb-6">Virtual Speed Dating Process</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <span className="text-xl">🎯</span> Join & Set Up (5 mins)
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Get your exclusive Zoom link → Join the private {cityOverride || product.city} event → Quick personality survey & interests. Done!
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <span className="text-xl">💬</span> Speed Date {cityOverride || product.city} Locals (50 mins)
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Meet 8 hand-picked {cityOverride || product.city} locals in fun 4-minute chats. Our AI matching + icebreaker questions = no awkward silences!
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <span className="text-xl">❤️</span> Match & Meet IRL in {cityOverride || product.city} (After event)
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Pick your favorites, see who picked you, and when it's mutual - meet up for coffee somewhere in {cityOverride || product.city}!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Register CTA before social proof */}
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
                        <span className="text-3xl">⭐</span>
                        <p className="text-3xl font-bold text-foreground">4.9/5</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Rating</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">👥</span>
                        <p className="text-3xl font-bold text-foreground">1,000+</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Matches</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">💕</span>
                        <p className="text-3xl font-bold text-foreground">85%</p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Match Rate</p>
                    </div>
                  </div>
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

export default function ProductTestPage() {
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
