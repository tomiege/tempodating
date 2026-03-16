"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import TicketModal from "../../components/ticket-modal"
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  Camera,
  Sun,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Upload,
  Zap,
  Download,
  Shield,
  Heart,
  TrendingUp,
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
}

const BEFORE_AFTER_EXAMPLES = [
  {
    before: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/before1.jpg",
    after: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/after1.jpg",
  },
  {
    before: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/before2.jpg",
    after: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/after2.jpg",
  },
  {
    before: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/before3.jpg",
    after: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/after3.jpg",
  },
]

const STYLE_SHOWCASE = [
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st1.jpg", label: "Professional Headshot" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st5.jpg", label: "Luxury Lifestyle" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st2.jpg", label: "Travel Shot" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st8.jpg", label: "Artistic Depth" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st6.jpg", label: "Date Night" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st3.jpg", label: "Fitness Active" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st7.jpg", label: "Coffee Date Ready" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st4.jpg", label: "Outdoor Adventure" },
]

const QUALITY_DETAILS = [
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/s4.jpg", title: "Natural Skin Texture", desc: "Realistic pores, not airbrushed" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/c6.jpg", title: "Authentic Lighting", desc: "Real shadows, natural highlights" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/b4.jpg", title: "True-to-Life Colors", desc: "No oversaturation or filters" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/s2.jpg", title: "Natural Expressions", desc: "Genuine smiles, real emotion" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/c4.jpg", title: "Realistic Depth", desc: "Natural background blur" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/m4.jpg", title: "Camera Behavior", desc: "Real lens physics" },
]

const SCENARIO_PACKS = [
  {
    title: "Coffee Date Ready",
    images: [
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/cf1.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/cf2.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/cf3.jpg",
    ],
  },
  {
    title: "Date Night",
    images: [
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/dn1.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/dn2.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/dn3.jpg",
    ],
  },
  {
    title: "Gym & Fitness",
    images: [
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/fg1.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/fg2.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/fg3.jpg",
    ],
  },
  {
    title: "Travel & Adventure",
    images: [
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ta1.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ta2.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ta3.jpg",
    ],
  },
  {
    title: "Furry Wingman",
    images: [
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ff1.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ff2.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ff3.jpg",
    ],
  },
  {
    title: "Luxury Lifestyle",
    images: [
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/lx1.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/lx2.jpg",
      "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/lx3.jpg",
    ],
  },
]

const FAQ_ITEMS = [
  {
    q: "Will the photos actually look like me?",
    a: "Absolutely. This isn't a face swap or avatar generator. It's YOUR face in different lighting, settings, and poses. The AI is trained specifically on your photos to maintain your unique features, expressions, and identity.",
  },
  {
    q: "Is this allowed on dating apps?",
    a: "Generally for large apps like Tinder, Bumble, and Hinge, there have been no problems with using photos that reflect your actual appearance. The key is that the photos look like you — which they will.",
  },
  {
    q: "How quickly will I get my photos?",
    a: "Your photos are delivered within 3 days after you complete your order. We'll email you when they're ready to download.",
  },
  {
    q: "Can I get more than 10 photos?",
    a: "Yes! After your initial purchase you can unlock bigger packages. More presets mean more variety for your dating profile.",
  },
]

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price / 100)
}

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  function updatePosition(clientX: number) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  useEffect(() => {
    if (!isDragging) return
    function onMove(e: MouseEvent | TouchEvent) {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      updatePosition(clientX)
    }
    function onUp() { setIsDragging(false) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("touchmove", onMove)
    window.addEventListener("touchend", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onUp)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-col-resize select-none shadow-lg"
      onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX) }}
      onTouchStart={(e) => { setIsDragging(true); updatePosition(e.touches[0].clientX) }}
    >
      {/* After (full background) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: `${(100 / sliderPos) * 100}%`, maxWidth: `${(100 / sliderPos) * 100}%` }} />
      </div>
      {/* Slider line */}
      <div className="absolute top-0 bottom-0" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white -translate-x-1/2" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">↔</span>
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-3 left-3 text-xs font-semibold bg-black/60 text-white px-2 py-1 rounded">ORIGINAL</span>
      <span className="absolute top-3 right-3 text-xs font-semibold bg-primary/90 text-white px-2 py-1 rounded">AI ENHANCED</span>
    </div>
  )
}

export default function AiPhotosProductPage() {
  const [product, setProduct] = useState<OnDemandProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch("/api/products/onDemand")
        if (!res.ok) throw new Error("Failed to load products")
        const data: OnDemandProduct[] = await res.json()
        const found = data.find((p) => p.productType === "aiPhotos")
        if (found) setProduct(found)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [])

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

  if (!product) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Card className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-4">AI Photos product is currently unavailable.</p>
              <Link href="/"><Button>Return Home</Button></Link>
            </Card>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const priceLabel = formatPrice(product.price, product.currency)

  function scrollToBuy() {
    setIsModalOpen(true)
  }

  return (
    <main className="min-h-screen">
      <Header />

      {/* ───────── HERO ───────── */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100/60 via-background to-background" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Dating Photos</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-4">
            Look Better. Get Seen.{" "}
            <span className="text-primary">Get Swiped.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Turn your everyday photos into high-performing, hyper-realistic dating profile shots — optimised for maximum matches.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button size="lg" className="text-base px-8 py-6 cursor-pointer" onClick={scrollToBuy}>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Get Your Photos · {priceLabel}
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 py-6 bg-transparent" asChild>
              <a href="#see-the-difference">See Examples</a>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Camera className="w-4 h-4" /> 10 AI photos</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Photo-realistic</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> 3-day delivery</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-primary text-primary" /> 4.9/5 rating</span>
          </div>

          {/* Hero showcase images */}
          <div className="grid grid-cols-4 gap-3 mt-12 max-w-3xl mx-auto">
            {[
              "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/rr2.jpg",
              "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/m2.jpg",
              "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/r6.jpg",
              "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/r1.jpg",
            ].map((src, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                <img src={src} alt={`Example photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── STATS BAR ───────── */}
      <section className="border-y border-border bg-muted/30 py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">2 sec</p>
            <p className="text-sm text-muted-foreground">Average swipe decision</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">80%</p>
            <p className="text-sm text-muted-foreground">First impressions from photos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">3.2×</p>
            <p className="text-sm text-muted-foreground">Match rate improvement</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">3,500+</p>
            <p className="text-sm text-muted-foreground">Happy users</p>
          </div>
        </div>
      </section>

      {/* ───────── BEFORE / AFTER ───────── */}
      <section id="see-the-difference" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              See The Difference
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Same person. Dramatically different first impression. Drag the slider to compare original vs AI-enhanced.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {BEFORE_AFTER_EXAMPLES.map((ex, i) => (
              <BeforeAfterSlider key={i} before={ex.before} after={ex.after} />
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Your face doesn&apos;t change. The context does. Professional lighting + optimised settings = photos that perform.
          </p>
        </div>
      </section>

      {/* ───────── WHY PHOTOS UNDERPERFORM ───────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              Why Most Dating Photos Underperform
            </h2>
            <p className="text-muted-foreground">Three technical issues that reduce your match rate</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Sun className="w-6 h-6" />, title: "Poor Lighting Kills Attraction", desc: "Harsh shadows or washed-out colors make you look less approachable. Natural lighting is the difference between \"maybe\" and \"yes.\"" },
              { icon: <MapPin className="w-6 h-6" />, title: "Wrong Context Sends Wrong Signal", desc: "Messy backgrounds or unclear settings don't communicate your lifestyle. She can't picture dating you if your photos lack context." },
              { icon: <Camera className="w-6 h-6" />, title: "Low Effort = Low Interest", desc: "Random camera roll photo dumps suggest you're not serious about dating. Quality photos show intentionality and self-awareness." },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW WE FIX IT ───────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              How We Fix These Issues
            </h2>
            <p className="text-muted-foreground">Consistent quality across all your photos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sun className="w-6 h-6" />,
                title: "Professional Lighting Every Time",
                desc: "Natural, flattering light that makes you look your best. Our AI understands golden hour, soft light, and how to avoid harsh shadows.",
                img: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/good1.jpg",
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                title: "Multiple Lifestyle Contexts",
                desc: "Settings proven to generate interest: cafés, rooftops, outdoor adventures. Every backdrop tells the right story about your lifestyle.",
                img: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/good2.jpg",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Shows You're Intentional",
                desc: "High-quality photos signal you value the connection. You're not just swiping — you're serious about finding someone special.",
                img: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/ex3.jpg",
              },
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HYPER REALISTIC DETAILS ───────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              Hyper-Realistic. Humanistic Details.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every detail matters — from skin texture to natural lighting
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {QUALITY_DETAILS.map((item, i) => (
              <div key={i} className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-md">
                <img src={item.src} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-semibold">{item.title}</p>
                  <p className="text-white/75 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── EVERY STYLE YOU NEED ───────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              Every Style You Need
            </h2>
            <p className="text-muted-foreground">From first date to adventure shots</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STYLE_SHOWCASE.map((item, i) => (
              <div key={i} className="group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md mb-2">
                  <img src={item.src} alt={item.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <p className="text-sm font-medium text-foreground text-center">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── SCENARIO PACKS ───────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              Every Dating Scenario, Covered
            </h2>
            <p className="text-muted-foreground">From first dates to gym flex shots — we&apos;ve got your entire profile sorted</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCENARIO_PACKS.map((pack, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="grid grid-cols-3 gap-0.5">
                  {pack.images.map((src, j) => (
                    <div key={j} className="aspect-square overflow-hidden">
                      <img src={src} alt={`${pack.title} ${j + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{pack.title}</h3>
                  <p className="text-xs text-muted-foreground">10 photos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground">Get profile-ready photos in 4 simple steps</p>
          </div>

          <div className="space-y-8">
            {[
              { icon: <Upload className="w-6 h-6" />, step: 1, title: "Purchase Your Photo Pack", desc: "Choose your package and complete checkout securely via Stripe." },
              { icon: <Camera className="w-6 h-6" />, step: 2, title: "Send Us 8–10 Photos", desc: "Regular selfies, group shots, vacation pics — anything with your face clearly visible. No professional photos needed." },
              { icon: <Sparkles className="w-6 h-6" />, step: 3, title: "AI Enhancement", desc: "Our AI crafts 10 hyper-realistic, profile-optimised photos across multiple styles — all true to your real appearance." },
              { icon: <Download className="w-6 h-6" />, step: 4, title: "Download & Dominate", desc: "Receive your photos within 3 days. Update your dating profile and start getting the matches you deserve." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── BENEFITS / REALIZATION ───────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              You Were Never Bad at Dating
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You just needed better photos. Here&apos;s what actually happens when you upgrade your profile:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <TrendingUp className="w-5 h-5" />, title: "Your profile becomes a conversation starter", desc: "No more wondering if your photos are good enough." },
              { icon: <CheckCircle2 className="w-5 h-5" />, title: "You actually look like yourself", desc: "The AI enhances context and lighting while preserving your actual features." },
              { icon: <Camera className="w-5 h-5" />, title: "Never run out of profile photos", desc: "Get variety across different contexts without awkward photoshoots." },
              { icon: <Shield className="w-5 h-5" />, title: "Your privacy stays protected", desc: "Your data is encrypted and never sold to third parties." },
              { icon: <Heart className="w-5 h-5" />, title: "Photos that match your confidence", desc: "Finally capture that energy you feel in real life." },
              { icon: <Star className="w-5 h-5" />, title: "See real results", desc: "Users report 3.5× more matches on average." },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── WHAT'S INCLUDED / PRICE CTA ───────── */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
            What&apos;s Included
          </h2>
          <p className="text-muted-foreground mb-10">
            Everything you need to transform your dating profile
          </p>

          <Card className="mb-8">
            <CardContent className="p-8">
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-4xl font-bold text-foreground mb-6">{priceLabel}</p>

              <div className="space-y-3 text-left mb-8">
                {[
                  "10 professionally crafted AI photos",
                  "Photo-realistic & facially consistent",
                  "Optimised for dating profiles & social media",
                  "Multiple styles: coffee date, date night, travel, fitness & more",
                  "3 day delivery time",
                  "Build social proof instantly",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full text-lg py-6 cursor-pointer"
                disabled={!product.available}
                onClick={scrollToBuy}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Buy Now · {priceLabel}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Secure payment via Stripe. One-time payment — no subscription.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ───────── ALTERNATIVES COMPARISON ───────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              Common Alternatives
            </h2>
            <p className="text-muted-foreground">And their limitations</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: "📱", title: "Filter Apps", cost: "Free", issue: "Generic results — standard filters don't understand dating-specific contexts" },
              { emoji: "📸", title: "Pro Photographers", cost: "$500+", issue: "High cost and time investment, limited to single-day availability" },
              { emoji: "✂️", title: "Manual Editing", cost: "Hours", issue: "Requires software expertise and can't improve underlying photo quality" },
              { emoji: "🤖", title: "Basic AI Tools", cost: "Varies", issue: "Generic models don't understand dating photo requirements" },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5 text-center">
                  <span className="text-3xl mb-3 block">{item.emoji}</span>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-primary font-medium text-sm mb-2">{item.cost}</p>
                  <p className="text-xs text-muted-foreground">{item.issue}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3">
              Questions? We Got You.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <Card key={i} className="cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{item.q}</h3>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                  </div>
                  {openFaq === i && (
                    <p className="text-sm text-muted-foreground mt-3">{item.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FINAL CTA ───────── */}
      <section className="py-20 bg-gradient-to-b from-pink-100/60 to-background">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Ready to Get More Matches?
          </h2>
          <p className="text-muted-foreground mb-8">
            Your dating photos do the talking before you do. Make sure they&apos;re saying the right thing.
          </p>
          <Button size="lg" className="text-lg px-10 py-6 cursor-pointer" onClick={scrollToBuy}>
            <ShoppingBag className="w-5 h-5 mr-2" />
            Get Your Photos · {priceLabel}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Secure payment via Stripe</p>
        </div>
      </section>

      {/* Checkout Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventTitle={product.title}
        price={product.price}
        currency={product.currency}
        productId={product.productId}
        productType={product.productType}
      />

      <Footer />
    </main>
  )
}
