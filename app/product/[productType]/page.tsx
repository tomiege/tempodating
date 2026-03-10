"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import TicketModal from "../components/ticket-modal"
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  BookOpen,
  Palette,
  Camera,
  Shirt,
  Heart,
} from "lucide-react"

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
  downloadUrl?: string
}

const iconMap: Record<string, React.ReactNode> = {
  datingEbook: <BookOpen className="w-32 h-32 text-primary/30" />,
  styleConsultant: <Shirt className="w-32 h-32 text-primary/30" />,
  aiPhotos: <Camera className="w-32 h-32 text-primary/30" />,
  colorPalette: <Palette className="w-32 h-32 text-primary/30" />,
  soulmateSketching: <Heart className="w-32 h-32 text-primary/30" />,
}

const highlightsMap: Record<string, string[]> = {
  datingEbook: [
    "Instant digital download",
    "Lifetime access to content",
    "Works on all devices",
    "30-day money-back guarantee",
  ],
  styleConsultant: [
    "One-on-one session with a fashion graduate",
    "Personalised outfit recommendations",
    "Colour palette & styling tips",
    "Suitable for all body types",
  ],
  aiPhotos: [
    "10 professionally crafted AI photos",
    "Photo realistic & facially consistent",
    "Optimised for dating profiles & social media",
    "Delivery in 5 working days",
    "Build social proof instantly",
  ],
  colorPalette: [
    "Professional skin tone analysis via photo",
    "Custom digital colour swatch",
    "Best colours for camera & video dates",
    "Works for social media & profile photos",
  ],
  soulmateSketching: [
    "Hand-drawn digital sketch of your soulmate",
    "Detailed personality & trait description",
    "Based on your energy & personality profile",
    "Fun, mystical romantic experience",
  ],
}

const headlineMap: Record<string, { title: string; tagline: string }> = {
  aiPhotos: {
    title: "Show Your Best Self",
    tagline: "Your first impression is your only one.",
  },
  colorPalette: {
    title: "Color Palette Analysis",
    tagline: "Discover the colours that make you shine on camera.",
  },
  soulmateSketching: {
    title: "Soulmate Sketching",
    tagline: "See the face of your future love, drawn from your energy.",
  },
  styleConsultant: {
    title: "Personal Style Consultation",
    tagline: "Dress to impress — every date, every time.",
  },
}

const bannerMap: Record<string, { src: string; alt: string }> = {
  aiPhotos: { src: "/aiPhotos/banner.png", alt: "AI Social Media Photos" },
  colorPalette: { src: "/colorPalette/banner.png", alt: "Color Palette Analysis" },
  soulmateSketching: { src: "/soulmateSketching/banner.png", alt: "Soulmate Sketching" },
  styleConsultant: { src: "/styleConsultant/download%20(1).jpg", alt: "Personal Style Consultation" },
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price / 100)
}

export default function ProductTypePage() {
  const params = useParams<{ productType: string }>()
  const productType = params.productType

  const [products, setProducts] = useState<OnDemandProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<OnDemandProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products/onDemand")
        if (!res.ok) throw new Error("Failed to load products")
        const data: OnDemandProduct[] = await res.json()
        const filtered = data.filter((p) => p.productType === productType)
        if (filtered.length === 0) {
          setError(`No products found for type "${productType}"`)
        } else {
          setProducts(filtered)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [productType])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (error || products.length === 0) {
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
              <p className="text-muted-foreground mb-4">{error}</p>
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

  const highlights = highlightsMap[productType] ?? []
  const customHeadline = headlineMap[productType]
  const banner = bannerMap[productType]

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

          {/* Custom hero banner for product types that have one */}
          {banner && (
            <div className="relative rounded-2xl overflow-hidden mb-12 shadow-xl">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-8 text-center">
                <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3">
                  {customHeadline?.title}
                </h1>
                <p className="text-lg sm:text-xl text-white/90 max-w-xl">
                  {customHeadline?.tagline}
                </p>
              </div>
            </div>
          )}

          {products.map((product) => (
            <div key={product.productId} className="grid lg:grid-cols-2 gap-12 items-start mb-16 last:mb-0">
              {/* Product Image — use banner for types with banners, icon for others */}
              {!banner && (
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
                    {iconMap[productType] ?? <ShoppingBag className="w-32 h-32 text-primary/30" />}
                  </div>
                </div>
              )}

              {/* Product Details */}
              <div className={banner ? "lg:col-span-2 max-w-2xl mx-auto w-full" : ""}>
                <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.category}</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
                  {product.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-8">
                  {product.description}
                </p>

                {/* Price Card */}
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Price</p>
                        <p className="text-3xl font-bold text-foreground">
                          {formatPrice(product.price, product.currency)}
                        </p>
                      </div>
                      {product.featured && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                          Featured
                        </span>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className="w-full text-lg py-6 cursor-pointer"
                      disabled={!product.available}
                      onClick={() => {
                        setSelectedProduct(product)
                        setIsModalOpen(true)
                      }}
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Buy Now · {formatPrice(product.price, product.currency)}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Secure payment via Stripe.
                    </p>
                  </CardContent>
                </Card>

                {/* Highlights */}
                {highlights.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                        What&apos;s Included
                      </h2>
                      <div className="space-y-3">
                        {highlights.map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout Modal */}
      {selectedProduct && (
        <TicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventTitle={selectedProduct.title}
          price={selectedProduct.price}
          currency={selectedProduct.currency}
          productId={selectedProduct.productId}
          productType={selectedProduct.productType}
        />
      )}

      <Footer />
    </main>
  )
}
