"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import posthog from 'posthog-js'
import { capture } from '@/components/analytics'
import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import OnlineSpeedDatingProductPage from "./products/online-speed-dating"
import OnlineSpeedDatingGayProductPage from "./products/online-speed-dating-gay"
import OnlineSpeedDatingJewishProductPage from "./products/online-speed-dating-jewish"
import OnlineSpeedDatingIndianProductPage from "./products/online-speed-dating-indian"
import OnlineSpeedDatingMuslimProductPage from "./products/online-speed-dating-muslim"
import GeoMaxingProductPage from "./products/geo-maxing"
import SocialMediaMaxingProductPage from "./products/social-media-maxing"

function ProductContent() {
  const searchParams = useSearchParams()
  const productType = searchParams.get('productType')
  
  // Capture PostHog event for product view with affiliate and age range data
  useEffect(() => {
    const productId = searchParams.get('productId')
    const productType = searchParams.get('productType')
    const affiliate = searchParams.get('groupurlname')
    const ageRange = searchParams.get('ar')
    const faceV = searchParams.get('face_v')
    
    if (posthog && productId) {
      posthog.capture('viewed_product', {
        product_id: productId,
        affiliate_id: affiliate,
        visitor_age_range: ageRange,
        product_type: productType,
        face_v: faceV ? parseFloat(faceV) : null,
      })
      capture('viewed_product', {
        product_id: Number(productId),
        product_type: productType,
        affiliate_id: affiliate,
        visitor_age_range: ageRange,
      })
    }

    // Save productId and full query string to cookie for 30 days
    if (productId) {
      const queryString = searchParams.toString()
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `last_product=${encodeURIComponent(queryString)}; expires=${expires}; path=/`
    }
  }, [searchParams])

  switch (productType) {
    case 'onlineSpeedDating':
    case 'workshop':
      return <OnlineSpeedDatingProductPage />
    case 'onlineSpeedDatingGay':
      return <OnlineSpeedDatingGayProductPage />
    case 'onlineSpeedDatingJewish':
      return <OnlineSpeedDatingJewishProductPage />
    case 'onlineSpeedDatingIndian':
      return <OnlineSpeedDatingIndianProductPage />
    case 'onlineSpeedDatingMuslim':
      return <OnlineSpeedDatingMuslimProductPage />
    case 'geoMaxing':
      return <GeoMaxingProductPage />
    case 'socialMediaMaxing':
      return <SocialMediaMaxingProductPage />
    default:
      return <OnlineSpeedDatingProductPage />
  }
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
