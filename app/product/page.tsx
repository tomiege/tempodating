"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useFeatureFlagVariantKey } from 'posthog-js/react'
import posthog from 'posthog-js'
import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ProductControlPage from "./experiments/product-control"
import ProductTestPage from "./experiments/product-test"

function ProductContent() {
  const searchParams = useSearchParams()
  
  // Get the feature flag variant
  const variant = useFeatureFlagVariantKey('product-page-test')
  console.log('Product Page Variant:', variant)
  
  // Capture PostHog event for product view with affiliate and age range data
  useEffect(() => {
    const productId = searchParams.get('productId')
    const productType = searchParams.get('productType')
    const affiliate = searchParams.get('groupurlname')
    const ageRange = searchParams.get('ar')
    
    if (posthog && productId) {
      posthog.capture('viewed_product', {
        product_id: productId,
        affiliate_id: affiliate,
        visitor_age_range: ageRange,
        product_type: productType,
      })
    }
  }, [searchParams])
  // Render the test variant (old product page from Luv2)
  if (variant === 'test') {
    return <ProductTestPage />
  }

  // Render the control variant (current product page) by default
  return <ProductControlPage />
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
