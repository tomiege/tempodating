'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, MapPin, Loader2, Calendar, Video, Globe } from "lucide-react"

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

export default function OnlineSpeedDatingPage() {
  const [events, setEvents] = useState<OnlineSpeedDatingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>('USA')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/products/onlineSpeedDating')
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        const data = await response.json()
        setEvents(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Get unique countries from events
  const countries = [...new Set(events.map(event => event.country))].sort()

  // Filter events by selected country
  const filteredEvents = events.filter(event => event.country === selectedCountry)

  // Group filtered events by country (for "all" option)
  const eventsByCountry = filteredEvents.reduce((acc, event) => {
    if (!acc[event.country]) {
      acc[event.country] = []
    }
    acc[event.country].push(event)
    return acc
  }, {} as Record<string, OnlineSpeedDatingEvent[]>)

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
              Online Speed Dating
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance max-w-2xl mx-auto">
              Find Your Match from Anywhere in the World
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty mb-8">
              Join our virtual speed dating events and meet singles from your area. 
              Quick, fun, and from the comfort of your home.
            </p>
            
            {!loading && !error && events.length > 0 && (
              <div className="flex items-center justify-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">Select your country:</span>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[220px] h-11 text-base font-medium">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading events...</span>
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

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No events available at the moment.</p>
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && events.length > 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No events available in {selectedCountry}.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSelectedCountry('all')}
              >
                View All Countries
              </Button>
            </div>
          )}

          {!loading && !error && filteredEvents.length > 0 && (
            <div className="space-y-12">
              {Object.entries(eventsByCountry).map(([country, countryEvents]) => (
                <div key={country}>
                  <div className="flex items-center gap-2 mb-6">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-xl text-foreground">{country}</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {countryEvents.map((event) => (
                      <Card 
                        key={event.productId} 
                        className={`overflow-hidden hover:shadow-lg transition-shadow ${event.soldOut ? 'opacity-75' : ''}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Video className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-primary">Online Event</span>
                            {event.soldOut && (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive ml-auto">
                                Sold Out
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-lg text-foreground mb-2">{event.title}</h3>
                          
                          <div className="space-y-2 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.city}, {event.country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(event.gmtdatetime, event.timezone)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(event.gmtdatetime, event.timezone)} • {event.duration_in_minutes} min</span>
                            </div>
                          </div>
                          
                          <div className="border-t pt-4 mt-4">
                            {event.soldOut ? (
                              <Button 
                                variant="outline"
                                disabled
                                className="w-full"
                              >
                                Sold Out
                              </Button>
                            ) : (
                              <Button asChild className="w-full">
                                <Link href={`/product?productId=${event.productId}&productType=${event.productType}`}>
                                  Book Now
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
