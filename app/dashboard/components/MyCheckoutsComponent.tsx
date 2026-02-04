"use client"

import { useState } from "react"
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
  UserPlus
} from "lucide-react"
import { InviteDialog } from "./InviteDialog"

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
  hasMatches: boolean
  matchCount?: number
  productType: string
  productId: number
  checkoutTime: string
  zoomInvite?: string
  city?: string
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

  const handleInviteClick = (event: EnrolledEvent) => {
    setSelectedEvent(event)
    setInviteDialogOpen(true)
  }
  
  // Transform checkouts into enrolled events format
  // Include 'event' and 'onlineSpeedDating' product types
  const enrolledEvents: EnrolledEvent[] = checkouts
    .filter(checkout => checkout.productType === 'event' || checkout.productType === 'onlineSpeedDating')
    .map(checkout => {
      // For onlineSpeedDating, find the matching product to get event details
      const matchingProduct = checkout.productType === 'onlineSpeedDating'
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
        hasMatches: false, // This would need to come from a matches table
        productType: checkout.productType,
        productId: checkout.productId,
        checkoutTime: checkout.checkoutTime,
        zoomInvite: matchingProduct?.zoomInvite,
        city: matchingProduct?.city || checkout.queryCity || undefined
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

              <div className="flex items-center gap-3">
                {/* Invite button for upcoming onlineSpeedDating events */}
                {event.status === "upcoming" && event.productType === 'onlineSpeedDating' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleInviteClick(event)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite a friend (20% off!)
                  </Button>
                )}
                
                {/* Join Event button for onlineSpeedDating with zoomInvite */}
                {event.productType === 'onlineSpeedDating' && event.zoomInvite && (
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => window.open(event.zoomInvite, '_blank')}
                  >
                    <Video className="w-4 h-4" />
                    Join Event
                  </Button>
                )}
                
                {event.status === "completed" && event.hasMatches ? (
                  <Button className="gap-2">
                    <Heart className="w-4 h-4" />
                    View Matches ({event.matchCount})
                  </Button>
                ) : event.status === "upcoming" ? (
                  <>
                    {event.hasMatches && (
                      <Button size="sm" className="gap-2">
                        <Heart className="w-4 h-4" />
                        Submit Matches
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No matches</span>
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
    </Card>
  )
}
