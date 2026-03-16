"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Video, 
  Heart, 
  Users,
  Loader2,
  UserPlus,
  MessageSquare,
  CheckCircle2
} from "lucide-react"
import { InviteDialog } from "./InviteDialog"
import { FeedbackDialog } from "./FeedbackDialog"
import MatchModal from "@/components/MatchModal"

interface CheckoutData {
  checkoutId: number
  checkoutSessionId: string
  userId: string | null
  email: string
  siteName: string
  totalOrder: number
  customerId: string
  productType: string
  productId: number
  confirmationEmailSent: boolean
  currency: string | null
  productDescription: string | null
  experiment: string | null
  checkoutTime: string
  name: string | null
  phoneNumber: string | null
  isMale: boolean | null
  queryCity: string | null
  createdAt: string
  updatedAt: string
}

interface OnlineSpeedDatingProduct {
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

interface EnrolledEvent {
  id: number
  title: string
  date: string
  time: string
  status: 'upcoming' | 'completed'
  productType: string
  productId: number
  checkoutTime: string
  zoomInvite?: string
  city?: string
  gmtdatetime?: string
}

interface MyCheckoutsComponentProps {
  checkouts: CheckoutData[]
  onlineSpeedDatingProducts: OnlineSpeedDatingProduct[]
  loading?: boolean
}

export function MyCheckoutsComponent({ 
  checkouts, 
  onlineSpeedDatingProducts,
  loading = false 
}: MyCheckoutsComponentProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EnrolledEvent | null>(null)
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchModalEvent, setMatchModalEvent] = useState<EnrolledEvent | null>(null)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackEvent, setFeedbackEvent] = useState<EnrolledEvent | null>(null)
  // Set of "productId-productType" keys for which the user has already left feedback
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set())
  const [now, setNow] = useState(new Date())

  // Update current time every 30 seconds so the Match button enables in real-time
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Fetch user's existing feedback to know which events already have feedback
  useEffect(() => {
    const fetchMyFeedback = async () => {
      try {
        const response = await fetch('/api/feedback?mine=true')
        if (response.ok) {
          const data = await response.json()
          const keys = new Set<string>(
            data
              .filter((f: { product_id: number | null; product_type: string | null }) => f.product_id && f.product_type)
              .map((f: { product_id: number; product_type: string }) => `${f.product_id}-${f.product_type}`)
          )
          setFeedbackSubmitted(keys)
        }
      } catch (error) {
        console.error('Error fetching user feedback:', error)
      }
    }
    fetchMyFeedback()
  }, [])

  const handleInviteClick = (event: EnrolledEvent) => {
    setSelectedEvent(event)
    setInviteDialogOpen(true)
  }

  const handleMatchClick = (event: EnrolledEvent) => {
    setMatchModalEvent(event)
    setMatchModalOpen(true)
  }

  const handleFeedbackClick = (event: EnrolledEvent) => {
    setFeedbackEvent(event)
    setFeedbackDialogOpen(true)
  }

  const handleFeedbackSubmitted = (productId: number, productType: string) => {
    setFeedbackSubmitted(prev => new Set(prev).add(`${productId}-${productType}`))
  }

  const hasFeedback = (event: EnrolledEvent) => {
    return feedbackSubmitted.has(`${event.productId}-${event.productType}`)
  }

  /** Returns true when the event start datetime has passed */
  const hasEventStarted = (event: EnrolledEvent) => {
    if (!event.gmtdatetime) return event.status === 'completed'
    return now >= new Date(event.gmtdatetime)
  }

  /** Returns true if the Match button should be enabled (30 min after event start) */
  const isMatchEnabled = (event: EnrolledEvent) => {
    if (!event.gmtdatetime) return false
    const eventStart = new Date(event.gmtdatetime)
    const unlockTime = new Date(eventStart.getTime() + 30 * 60 * 1000)
    return now >= unlockTime
  }
  
  // Transform checkouts into enrolled events format
  // Include 'event' and all onlineSpeedDating variant product types, deduplicated by productId
  const seenProductIds = new Set<number>()
  const enrolledEvents: EnrolledEvent[] = checkouts
    .filter(checkout => checkout.productType === 'event' || checkout.productType.startsWith('onlineSpeedDating'))
    .filter(checkout => {
      if (seenProductIds.has(checkout.productId)) return false
      seenProductIds.add(checkout.productId)
      return true
    })
    .map(checkout => {
      // For onlineSpeedDating variants, find the matching product to get event details
      const matchingProduct = checkout.productType.startsWith('onlineSpeedDating')
        ? onlineSpeedDatingProducts.find(p => p.productId === checkout.productId)
        : null

      // Use product's gmtdatetime if available, otherwise fall back to checkout time
      const eventDate = matchingProduct 
        ? new Date(matchingProduct.gmtdatetime)
        : new Date(checkout.checkoutTime)
      const now = new Date()
      const isUpcoming = eventDate > now
      
      return {
        id: checkout.checkoutId,
        title: matchingProduct?.title || checkout.productDescription || `Event #${checkout.productId}`,
        date: eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: eventDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        }),
        status: isUpcoming ? 'upcoming' : 'completed',
        productType: checkout.productType,
        productId: checkout.productId,
        checkoutTime: checkout.checkoutTime,
        zoomInvite: matchingProduct?.zoomInvite,
        city: matchingProduct?.city || checkout.queryCity || undefined,
        gmtdatetime: matchingProduct?.gmtdatetime
      }
    })

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-xl">Your Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-muted-foreground">Loading your events...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-serif text-xl">Your Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enrolledEvents.map((event) => (
            <div 
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-foreground">{event.title}</h3>
                  {event.productType === 'onlineSpeedDatingGay' && (
                    <Badge variant="outline" className="text-xs">Gay</Badge>
                  )}
                  {event.productType === 'onlineSpeedDatingJewish' && (
                    <Badge variant="outline" className="text-xs">Jewish</Badge>
                  )}
                  {event.productType === 'onlineSpeedDatingIndian' && (
                    <Badge variant="outline" className="text-xs">Indian</Badge>
                  )}
                  {event.productType === 'onlineSpeedDatingMuslim' && (
                    <Badge variant="outline" className="text-xs">Muslim</Badge>
                  )}
                  {event.status === "upcoming" ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Upcoming
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Completed
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    Online Event
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Invite button (before event) / Leave Feedback (after event) / Tick (feedback done) */}
                {event.productType.startsWith('onlineSpeedDating') && (
                  hasFeedback(event) ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium" title="Feedback submitted">
                      <CheckCircle2 className="w-5 h-5" />
                      Feedback Sent
                    </span>
                  ) : hasEventStarted(event) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      onClick={() => handleFeedbackClick(event)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Leave Feedback
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleInviteClick(event)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </Button>
                  )
                )}
                
                {/* Join Event button for onlineSpeedDating with zoomInvite */}
                {event.productType.startsWith('onlineSpeedDating') && event.zoomInvite && (
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => window.open(event.zoomInvite, '_blank')}
                  >
                    <Video className="w-4 h-4" />
                    Join Event
                  </Button>
                )}
                
                {/* Match button — enabled 30 min after event start */}
                {event.productType.startsWith('onlineSpeedDating') && (
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={!isMatchEnabled(event)}
                    onClick={() => handleMatchClick(event)}
                    title={
                      isMatchEnabled(event)
                        ? 'View participants and submit matches'
                        : 'Available 30 minutes after the event starts'
                    }
                  >
                    <Heart className="w-4 h-4" />
                    Match
                  </Button>
                )}
              </div>
            </div>
          ))}

          {enrolledEvents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No events yet</h3>
              <p className="text-sm text-muted-foreground">
                Browse our upcoming events and find your perfect match
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {selectedEvent && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          eventTitle={selectedEvent.title}
          productId={selectedEvent.productId}
          productType={selectedEvent.productType}
          city={selectedEvent.city}
        />
      )}

      {matchModalEvent && (
        <MatchModal
          isOpen={matchModalOpen}
          onClose={() => {
            setMatchModalOpen(false)
            setMatchModalEvent(null)
          }}
          productId={matchModalEvent.productId}
          productType={matchModalEvent.productType}
          eventTitle={`${matchModalEvent.title}${matchModalEvent.city ? ` — ${matchModalEvent.city}` : ''}`}
        />
      )}

      {feedbackEvent && (
        <FeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          eventTitle={feedbackEvent.title}
          productId={feedbackEvent.productId}
          productType={feedbackEvent.productType}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </Card>
  )
}
