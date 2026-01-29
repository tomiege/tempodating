'use client'

import { useEffect, useState } from 'react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Sparkles, Download, Loader2, ShoppingBag } from "lucide-react"

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

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'ebook':
      return BookOpen
    case 'digital cards':
      return Sparkles
    default:
      return ShoppingBag
  }
}

const formatPrice = (price: number, currency: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  })
  return formatter.format(price / 100)
}

export default function OnDemandProductsPage() {
  const [products, setProducts] = useState<OnDemandProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/onDemand')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
              Digital Products
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance max-w-2xl mx-auto">
              On-Demand Dating Resources
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Instant access to our collection of eBooks, guides, and digital tools designed to transform your dating life.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading products...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-destructive">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No products available at the moment.</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const IconComponent = getCategoryIcon(product.category)
                return (
                  <Card 
                    key={product.productId} 
                    className={`overflow-hidden hover:shadow-lg transition-shadow ${!product.available ? 'opacity-75' : ''}`}
                  >
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {product.category}
                        </span>
                        {product.featured && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Featured
                          </span>
                        )}
                        {!product.available && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg text-foreground mb-2">{product.title}</h3>
                      <p className="text-muted-foreground text-sm mb-6 line-clamp-3">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <Button 
                          variant={product.available ? "default" : "outline"} 
                          size="sm"
                          disabled={!product.available}
                        >
                          {product.available ? (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Get Now
                            </>
                          ) : (
                            "Notify Me"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
