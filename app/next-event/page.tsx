"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, Clock, Search, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

interface SpeedDatingEvent {
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

interface Prediction {
  description: string
  place_id: string
}

type EventCategory = "straight" | "gay" | "jewish" | "indian" | "muslim"

const CATEGORY_CONFIG: Record<EventCategory, { label: string; jsonFile: string; productType: string }> = {
  straight: { label: "Straight", jsonFile: "/products/onlineSpeedDating.json", productType: "onlineSpeedDating" },
  gay: { label: "Gay", jsonFile: "/products/onlineSpeedDatingGay.json", productType: "onlineSpeedDatingGay" },
  jewish: { label: "Jewish", jsonFile: "/products/onlineSpeedDating.json", productType: "onlineSpeedDatingJewish" },
  indian: { label: "Indian", jsonFile: "/products/onlineSpeedDating.json", productType: "onlineSpeedDatingIndian" },
  muslim: { label: "Muslim", jsonFile: "/products/onlineSpeedDating.json", productType: "onlineSpeedDatingMuslim" },
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatEventDate(gmtdatetime: string, timezone: string): string {
  const date = new Date(gmtdatetime)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  })
}

function formatEventTime(gmtdatetime: string, timezone: string): string {
  const date = new Date(gmtdatetime)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: timezone,
  })
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price / 100)
}

function formatDistance(km: number): string {
  if (km < 1) return "< 1 km"
  if (km < 100) return `${Math.round(km)} km`
  return `${Math.round(km)} km`
}

export default function NextEventPage() {
  const [address, setAddress] = useState("")
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [category, setCategory] = useState<EventCategory>("straight")
  const [allEvents, setAllEvents] = useState<SpeedDatingEvent[]>([])
  const [nearestEvents, setNearestEvents] = useState<(SpeedDatingEvent & { distance: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [autocompleteLoading, setAutocompleteLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch events when category changes
  useEffect(() => {
    const config = CATEGORY_CONFIG[category]
    fetch(config.jsonFile)
      .then((res) => res.json())
      .then((data: SpeedDatingEvent[]) => {
        const now = new Date()
        const upcoming = data.filter((e) => new Date(e.gmtdatetime) > now && !e.soldOut)
        setAllEvents(upcoming)
      })
      .catch(() => setAllEvents([]))
  }, [category])

  // Recalculate nearest events when location or events change
  useEffect(() => {
    if (!selectedLocation || allEvents.length === 0) {
      setNearestEvents([])
      return
    }
    const withDistance = allEvents
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        ...e,
        distance: haversineDistance(selectedLocation.lat, selectedLocation.lng, e.latitude!, e.longitude!),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)

    setNearestEvents(withDistance)
  }, [selectedLocation, allEvents])

  const fetchAutocomplete = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([])
      setShowDropdown(false)
      return
    }
    setAutocompleteLoading(true)
    try {
      const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(input)}`)
      const data = await res.json()
      setPredictions(data.predictions || [])
      setShowDropdown(data.predictions?.length > 0)
    } catch {
      setPredictions([])
    } finally {
      setAutocompleteLoading(false)
    }
  }, [])

  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setAddress(value)
    setSelectedLocation(null)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchAutocomplete(value)
    }, 300)
  }

  async function handleSelectPrediction(prediction: Prediction) {
    setAddress(prediction.description)
    setShowDropdown(false)
    setPredictions([])
    setLoading(true)

    try {
      const res = await fetch(`/api/geocode?place_id=${encodeURIComponent(prediction.place_id)}`)
      const data = await res.json()
      if (data.lat && data.lng) {
        setSelectedLocation({ lat: data.lat, lng: data.lng, address: prediction.description })
      }
    } catch {
      // geocode failed silently
    } finally {
      setLoading(false)
    }
  }

  const categories: EventCategory[] = ["straight", "gay", "jewish", "indian", "muslim"]

  return (
    <main className="min-h-screen">
      <Header />

      <section className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
              Find Your Next Event
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your address and we&apos;ll find the closest speed dating events near you.
            </p>
          </div>

          {/* Category Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">Event Type</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Address Input */}
          <div className="mb-8 relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Address
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Start typing your address..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              {autocompleteLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && predictions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-accent transition-colors flex items-center gap-3 border-b last:border-b-0"
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">{prediction.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Finding events near you...</span>
            </div>
          )}

          {/* Results */}
          {selectedLocation && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Showing closest events to <span className="font-medium text-foreground">{selectedLocation.address}</span>
                </span>
              </div>

              {nearestEvents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No upcoming {CATEGORY_CONFIG[category].label.toLowerCase()} events found right now.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try a different event type or check back later.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    {nearestEvents.length} Closest Events
                  </h2>

                  {nearestEvents.map((event) => (
                    <Card key={event.productId} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">
                                {event.title} — {event.city}
                              </h3>
                              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {formatDistance(event.distance)} away
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatEventDate(event.gmtdatetime, event.timezone)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{formatEventTime(event.gmtdatetime, event.timezone)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.city}, {event.country}</span>
                              </div>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              From{" "}
                              <span className="font-semibold text-foreground">
                                {formatPrice(Math.min(event.male_price, event.female_price), event.currency)}
                              </span>
                            </div>
                          </div>

                          <div className="sm:self-center">
                            <Link
                              href={`/product?productId=${event.productId}&productType=${CATEGORY_CONFIG[category].productType}`}
                            >
                              <Button className="w-full sm:w-auto gap-2">
                                View Event
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prompt when no location selected */}
          {!selectedLocation && !loading && (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <MapPin className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Enter your address above to find events near you
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
