'use client'

import { useEffect, useState } from 'react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, Star, Loader2, Calendar, User } from "lucide-react"

interface WorkshopProduct {
  productId: number
  title: string
  description: string
  productType: string
  gmtdatetime: string
  timezone: string
  duration_in_minutes: number
  price: number
  currency: string
  maxAttendees: number
  currentAttendees: number
  instructor: string
  instructorBio: string
  rating: number
  soldOut: boolean
  location: string
  zoomInvite: string
}

const formatPrice = (price: number, currency: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  })
  return formatter.format(price / 100)
}

const formatDate = (dateString: string, timezone: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  })
}

const formatTime = (dateString: string, timezone: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone,
  })
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const response = await fetch('/api/products/workshop')
        if (!response.ok) {
          throw new Error('Failed to fetch workshops')
        }
        const data = await response.json()
        setWorkshops(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkshops()
  }, [])

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="py-20 md:py-28 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
              Dating Workshops
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance max-w-2xl mx-auto">
              Level Up Your Dating Game with Expert Guidance
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Join our interactive workshops led by dating coaches and relationship experts.
              Learn practical skills that will transform your dating life.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading workshops...</span>
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

          {!loading && !error && workshops.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No workshops available at the moment.</p>
            </div>
          )}

          {!loading && !error && workshops.length > 0 && (
            <div className="space-y-6">
              {workshops.map((workshop) => (
                <Card 
                  key={workshop.productId} 
                  className="overflow-hidden transition-shadow opacity-75"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                            Sold Out
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-xl text-foreground mb-2">{workshop.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{workshop.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(workshop.gmtdatetime, workshop.timezone)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(workshop.gmtdatetime, workshop.timezone)} • {workshop.duration_in_minutes} min</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{workshop.currentAttendees}/{workshop.maxAttendees} enrolled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{workshop.rating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{workshop.instructor}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2 italic">{workshop.instructorBio}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-4 min-w-[150px]">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{workshop.location}</p>
                        </div>
                        <Button 
                          variant="outline"
                          disabled={true}
                          className="w-full cursor-not-allowed"
                        >
                          Sold Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
