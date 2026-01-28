"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, MapPin, Clock, Users, Loader2, ExternalLink, AlertCircle, CheckCircle, Heart } from "lucide-react"
import { useSession } from "next-auth/react"
import MatchModal from "@/components/MatchModal"
import { User } from "@/types/profile"

interface CheckoutData {
  checkoutId: string
  checkoutSessionId: string
  totalOrder: number
  confirmationEmailSent: boolean
  siteName: string
  email: string
  customerId: string
  productType: string
  productId: number
  product_description?: string
  experiment?: string
  checkoutTime: string
  profileId?: string
  name?: string
  phoneNumber?: string
  isMale?: boolean
  canReschedule?: boolean
}

interface Event {
  eventId: number
  gmtdatetime: string
  title: string
  zoomInvite: string
  city: string
  country: string
  soldOut?: boolean
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
  eventType: string
  zoomInvite: string
  region_id: string
}

interface MyEventsComponentProps {
  events: Event[]
  user?: User | null
  onProfileValidationError?: () => void
}

export default function MyEventsComponent({ events, user, onProfileValidationError }: MyEventsComponentProps) {
  const [checkouts, setCheckouts] = useState<CheckoutData[]>([])
  const [loading, setLoading] = useState(true)
  const [availableEvents, setAvailableEvents] = useState<{[key: string]: Event[]}>({})
  const [loadingEvents, setLoadingEvents] = useState<{[key: string]: boolean}>({})
  const [updatingCheckout, setUpdatingCheckout] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [onlineSpeedDatingProducts, setOnlineSpeedDatingProducts] = useState<OnlineSpeedDatingProduct[]>([])
  const [confirmationData, setConfirmationData] = useState<{
    checkoutId: string
    newEventId: number
    eventTitle: string
    eventDate: string
  } | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [selectedProductForMatch, setSelectedProductForMatch] = useState<{
    productId: number
    productType: string
    title: string
  } | null>(null)
  const { toast } = useToast()
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
    
    if (status === "loading") {
      console.log("Session is still loading...")
      return
    }
    
    if (status === "unauthenticated") {
      console.log("User is not authenticated")
      setLoading(false)
      return
    }
    
    if (status === "authenticated") {
      console.log("User is authenticated, fetching checkouts...")
      fetchUserCheckouts()
    }
  }, [status])

  useEffect(() => {
    // Fetch available events for checkouts with productId = 0 (flexible events)
    // or canReschedule = true (reschedule events)
    checkouts.forEach(checkout => {
      if (checkout.productType === 'event') {
        const isFlexibleEvent = checkout.productId === 0
        const canRescheduleEvent = checkout.canReschedule === true && checkout.productId !== 0
        
        if (isFlexibleEvent) {
          fetchAvailableEvents(checkout)
        } else if (canRescheduleEvent) {
          fetchAvailableEventsForReschedule(checkout)
        }
      }
    })

    // Fetch online speed dating products if there are any onlineSpeedDating checkouts
    const hasOnlineSpeedDating = checkouts.some(c => c.productType === 'onlineSpeedDating')
    if (hasOnlineSpeedDating) {
      fetchOnlineSpeedDatingProducts()
    }
  }, [checkouts])

  const fetchOnlineSpeedDatingProducts = async () => {
    try {
      const response = await fetch('/api/products/onlineSpeedDating')
      if (response.ok) {
        const products = await response.json()
        setOnlineSpeedDatingProducts(products)
      } else {
        console.error("Failed to fetch online speed dating products")
      }
    } catch (error) {
      console.error("Error fetching online speed dating products:", error)
    }
  }

  const fetchUserCheckouts = async () => {
    try {
      console.log("Fetching user checkouts...")
      const response = await fetch('/api/events/get-user-events')
      console.log("Response status:", response.status)
      console.log("Response:", response)
      
      if (response.ok) {
        const checkoutsData = await response.json()
        console.log("Checkouts data:", checkoutsData)
        setCheckouts(checkoutsData)
      } else {
        const errorData = await response.text()
        console.error("Checkouts not found. Response:", errorData)
      }
    } catch (error) {
      console.error("Error fetching checkouts:", error)
      toast({
        title: "Error",
        description: "Failed to load your events. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const extractCityFromDescription = (description: string): string | null => {
    // Look for patterns like "in [City]" in the product description
    // Handle patterns like "in Houston", "in New York", "in Los Angeles - Male"
    const patterns = [
      /in\s+([A-Za-z\s]+?)(\s+-|\s+$|\s+,)/i,  // "in Houston -", "in Houston,"
      /Speed Dating in\s+([A-Za-z\s]+?)(\s+-|\s+$|\s+,)/i,  // "Speed Dating in Houston"
      /Dating in\s+([A-Za-z\s]+?)(\s+-|\s+$|\s+,)/i,  // "Dating in Houston"
    ]
    
    for (const pattern of patterns) {
      const match = description.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return null
  }

  const fetchAvailableEvents = async (checkout: CheckoutData) => {
    setLoadingEvents(prev => ({ ...prev, [checkout.checkoutId]: true }))
    try {
      const city = extractCityFromDescription(checkout.product_description || '')
      if (!city) {
        setAvailableEvents(prev => ({
          ...prev,
          [checkout.checkoutId]: []
        }))
        return []
      }

      const queryParams = new URLSearchParams({
        siteName: checkout.siteName,
        city: city
      })

      const response = await fetch(`/api/events/get-available-events?${queryParams}`)
      if (response.ok) {
        const events = await response.json()
        setAvailableEvents(prev => ({
          ...prev,
          [checkout.checkoutId]: events
        }))
        return events
      } else {
        console.error("Failed to fetch available events:", response.status)
        setAvailableEvents(prev => ({
          ...prev,
          [checkout.checkoutId]: []
        }))
      }
    } catch (error) {
      console.error("Error fetching available events:", error)
      setAvailableEvents(prev => ({
        ...prev,
        [checkout.checkoutId]: []
      }))
    } finally {
      setLoadingEvents(prev => ({ ...prev, [checkout.checkoutId]: false }))
    }
    return []
  }

  const fetchAvailableEventsForReschedule = async (checkout: CheckoutData) => {
    setLoadingEvents(prev => ({ ...prev, [checkout.checkoutId]: true }))
    try {
      // Find the current event by productId (eventId)
      const currentEvent = events.find(event => event.eventId === checkout.productId)
      console.log(`Looking for current event with ID ${checkout.productId} in events:`, events.map(e => e.eventId))
      console.log('Found current event:', currentEvent)
      
      if (!currentEvent) {
        console.log(`No current event found for productId ${checkout.productId}`)
        setAvailableEvents(prev => ({
          ...prev,
          [checkout.checkoutId]: []
        }))
        return []
      }

      const queryParams = new URLSearchParams({
        siteName: checkout.siteName,
        city: currentEvent.city
      })

      const response = await fetch(`/api/events/get-available-events?${queryParams}`)
      if (response.ok) {
        const availableEvents = await response.json()
        console.log(`Found ${availableEvents.length} available events for reschedule in ${currentEvent.city}:`, availableEvents)
        console.log(`Current event ID that will be filtered out: ${checkout.productId}`)
        console.log(`Available event IDs before filtering:`, availableEvents.map((e: Event) => e.eventId))
        // Filter out the current event from the available events
        const filteredEvents = availableEvents.filter((event: Event) => event.eventId !== checkout.productId)
        console.log(`After filtering out current event (${checkout.productId}), ${filteredEvents.length} events remain:`, filteredEvents)
        console.log(`Remaining event IDs:`, filteredEvents.map((e: Event) => e.eventId))
        setAvailableEvents(prev => ({
          ...prev,
          [checkout.checkoutId]: filteredEvents
        }))
        return filteredEvents
      } else {
        console.error("Failed to fetch available events for reschedule:", response.status)
        setAvailableEvents(prev => ({
          ...prev,
          [checkout.checkoutId]: []
        }))
      }
    } catch (error) {
      console.error("Error fetching available events for reschedule:", error)
      setAvailableEvents(prev => ({
        ...prev,
        [checkout.checkoutId]: []
      }))
    } finally {
      setLoadingEvents(prev => ({ ...prev, [checkout.checkoutId]: false }))
    }
    return []
  }

  const updateCheckoutEvent = async (checkoutId: string, newEventId: number) => {
    setUpdatingCheckout(checkoutId)
    try {
      const response = await fetch('/api/checkout/update-event', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutId,
          newProductId: newEventId,
        }),
      })

      if (response.ok) {
        // Update the local state
        setCheckouts(prev => prev.map(checkout => 
          checkout.checkoutId === checkoutId 
            ? { ...checkout, productId: newEventId, canReschedule: false }
            : checkout
        ))
        
        // Clear the available events for this checkout since it's no longer a reschedule event
        setAvailableEvents(prev => ({
          ...prev,
          [checkoutId]: []
        }))
        
        toast({
          title: "Success",
          description: "Event selection updated successfully!",
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }
    } catch (error) {
      console.error("Error updating checkout:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event selection",
        variant: "destructive",
      })
    } finally {
      setUpdatingCheckout(null)
    }
  }

  const handleRescheduleClick = (checkoutId: string, event: Event) => {
    setConfirmationData({
      checkoutId,
      newEventId: event.eventId,
      eventTitle: event.title,
      eventDate: formatDate(event.gmtdatetime)
    })
    setShowConfirmModal(true)
  }

  const confirmReschedule = async () => {
    if (!confirmationData) return
    
    setShowConfirmModal(false)
    await updateCheckoutEvent(confirmationData.checkoutId, confirmationData.newEventId)
    setConfirmationData(null)
  }

  const cancelReschedule = () => {
    setShowConfirmModal(false)
    setConfirmationData(null)
  }

  const closeMatchModal = () => {
    setShowMatchModal(false)
    setSelectedProductForMatch(null)
  }

  if (loading || status === "loading") {
    return (
      <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            My Events & Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            My Events & Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Please sign in to view your events</p>
            <p className="text-gray-500 text-sm">
              You need to be logged in to see your registered events and purchased products.
            </p>
            <Button 
              className="mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = "/auth/signin"}
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (checkouts.length === 0) {
    return (
      <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            My Events & Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">No events or products found</p>
            <p className="text-gray-500 text-sm">
              Complete an event registration or product purchase to see them here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Separate events, online speed dating, and other products
  const eventCheckouts = checkouts.filter(checkout => checkout.productType === 'event')
  const onlineSpeedDatingCheckouts = checkouts.filter(checkout => checkout.productType === 'onlineSpeedDating')
  const products = checkouts.filter(checkout => checkout.productType !== 'event' && checkout.productType !== 'onlineSpeedDating')

  // Helper function to find event details for a checkout
  const findEventForCheckout = (checkout: CheckoutData) => {
    return events.find(event => event.eventId === checkout.productId)
  }

  // Helper function to check if event has ended
  const isEventEnded = (eventGmtTime: string) => {
    const eventDate = new Date(eventGmtTime)
    const currentDate = new Date()
    return currentDate > eventDate
  }

  // Helper function to validate user profile
  const validateUserProfile = (user: User | null | undefined): { isValid: boolean, missingFields: string[] } => {
    if (!user) {
      return { isValid: false, missingFields: ['name', 'gender', 'contactInfo'] }
    }

    const missingFields: string[] = []
    
    if (!user.name || user.name.trim() === '') {
      missingFields.push('name')
    }
    
    if (user.isMale === undefined || user.isMale === null) {
      missingFields.push('gender')
    }
    
    if (!user.contactInfo || user.contactInfo.trim() === '') {
      missingFields.push('contactInfo')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  const handleMatchClick = (productId: number, productType: string, title: string) => {
    // Validate user profile before allowing match
    const profileValidation = validateUserProfile(user)
    
    if (!profileValidation.isValid) {
      toast({
        title: "Complete Your Profile",
        description: `Please fill in your ${profileValidation.missingFields.join(', ')} before you can view matches.`,
        variant: "destructive",
      })
      
      // Call the callback to trigger profile validation error handling in parent
      if (onProfileValidationError) {
        onProfileValidationError()
      }
      return
    }

    // Profile is valid, proceed with match
    setSelectedProductForMatch({
      productId,
      productType,
      title
    })
    setShowMatchModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Events Section */}
      {eventCheckouts.length > 0 && (
        <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              My Events
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              {eventCheckouts.length} event{eventCheckouts.length !== 1 ? 's' : ''} registered
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventCheckouts.map((checkout) => {
                const eventDetails = findEventForCheckout(checkout)
                const isFlexibleEvent = checkout.productId === 0
                const canRescheduleEvent = checkout.canReschedule === true && checkout.productId !== 0
                const checkoutAvailableEvents = availableEvents[checkout.checkoutId] || []
                const isLoadingEvents = loadingEvents[checkout.checkoutId] || false
                const city = isFlexibleEvent 
                  ? extractCityFromDescription(checkout.product_description || '')
                  : eventDetails?.city
                
                // For reschedule events, show minimal info with blue styling
                if (canRescheduleEvent) {
                  console.log(`Rendering reschedule UI for checkout ${checkout.checkoutId}:`, {
                    availableEventsCount: checkoutAvailableEvents.length,
                    availableEvents: checkoutAvailableEvents,
                    isLoading: isLoadingEvents
                  })
                  
                  return (
                    <div
                      key={checkout.checkoutSessionId}
                      className="p-4 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-600"
                    >
                      <div className="mb-3">
                        <h4 className="font-medium text-blue-300 text-lg mb-1">
                          Reschedule event
                        </h4>
                        <p className="text-sm text-blue-400">
                          {checkout.siteName}
                        </p>
                      </div>
                      
                      {isLoadingEvents ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
                          <span className="text-sm text-blue-300">Loading available events...</span>
                        </div>
                      ) : checkoutAvailableEvents.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-blue-300 mb-3">
                            Choose your new event{city ? ` in ${city}` : ''} ({checkoutAvailableEvents.length} available):
                          </p>
                          <div className="space-y-2 max-w-full">
                            {checkoutAvailableEvents.map((event, index) => {
                              console.log(`Rendering event ${index + 1}/${checkoutAvailableEvents.length}:`, event.title, event.eventId)
                              return (
                                <div 
                                  key={event.eventId} 
                                  className="bg-blue-800 bg-opacity-40 p-3 rounded border border-blue-600 hover:bg-opacity-60 transition-colors w-full"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <h6 className="text-sm font-medium text-white truncate">
                                        {event.title}
                                      </h6>
                                      <p className="text-xs text-blue-300">
                                        {formatDate(event.gmtdatetime)}
                                      </p>
                                      {/* <p className="text-xs text-blue-400">
                                        // {event.city}, {event.country}
                                      </p> */}
                                    </div>
                                    <div className="flex-shrink-0">
                                      <Button
                                        size="sm"
                                        className="text-xs bg-blue-600 hover:bg-blue-500 px-4 py-2 h-auto whitespace-nowrap w-full sm:w-auto"
                                        onClick={() => handleRescheduleClick(checkout.checkoutId, event)}
                                        disabled={updatingCheckout === checkout.checkoutId}
                                      >
                                        {updatingCheckout === checkout.checkoutId ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          "Select"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-blue-400">
                            No other events available{city ? ` in ${city}` : ''} for rescheduling.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                }
                
                // Regular event display for non-reschedule events
                return (
                  <div
                    key={checkout.checkoutSessionId}
                    className="p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">
                          {eventDetails?.title || checkout.product_description || `Event ${checkout.productId}`}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {checkout.siteName}
                        </p>
                        {/* {eventDetails && (
                          <p className="text-sm text-blue-400">
                            {eventDetails.city}, {eventDetails.country}
                          </p>
                        )} */}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Registered: {formatDate(checkout.checkoutTime)}
                      </div>
                      {eventDetails && (
                        <div className="flex items-center text-xs text-blue-300">
                          <Calendar className="w-3 h-3 mr-1" />
                          Event Date: {formatDate(eventDetails.gmtdatetime)}
                        </div>
                      )}
                    </div>
                    
                    {/* Flexible Event Selection */}
                    {isFlexibleEvent && (
                      <div className="mb-3 p-3 bg-amber-900 bg-opacity-30 rounded-lg border border-amber-600">
                        <div className="flex items-center text-amber-300 text-sm mb-2">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Select Your Event
                        </div>
                        <p className="text-xs text-amber-200 mb-3">
                          You have a flexible ticket. Select from available events{city ? ` in ${city}` : ''}.
                        </p>
                        
                        {isLoadingEvents ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400 mr-2" />
                            <span className="text-xs text-amber-300">Loading available events...</span>
                          </div>
                        ) : checkoutAvailableEvents.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-300">Next available event:</p>
                            <div className="bg-gray-800 p-3 rounded border border-gray-600">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-white">
                                    {checkoutAvailableEvents[0].title}
                                  </h5>
                                  <p className="text-xs text-blue-400">
                                    {checkoutAvailableEvents[0].city}, {checkoutAvailableEvents[0].country}
                                  </p>
                                  <p className="text-xs text-green-400">
                                    {formatDate(checkoutAvailableEvents[0].gmtdatetime)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  className="text-xs bg-green-600 hover:bg-green-700 ml-3"
                                  onClick={() => updateCheckoutEvent(checkout.checkoutId, checkoutAvailableEvents[0].eventId)}
                                  disabled={updatingCheckout === checkout.checkoutId}
                                >
                                  {updatingCheckout === checkout.checkoutId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Select This Event
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {checkoutAvailableEvents.length > 1 && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                                  View {checkoutAvailableEvents.length - 1} more event{checkoutAvailableEvents.length > 2 ? 's' : ''}
                                </summary>
                                <div className="mt-2 space-y-2">
                                  {checkoutAvailableEvents.slice(1).map((event) => (
                                    <div key={event.eventId} className="bg-gray-800 p-2 rounded border border-gray-600">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h6 className="text-xs font-medium text-white">
                                            {event.title}
                                          </h6>
                                          {/* <p className="text-xs text-blue-400">
                                            {event.city}, {event.country}
                                          </p> */}
                                          <p className="text-xs text-green-400">
                                            {formatDate(event.gmtdatetime)}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs bg-transparent border-gray-600 text-gray-300 hover:bg-gray-600 ml-2"
                                          onClick={() => updateCheckoutEvent(checkout.checkoutId, event.eventId)}
                                          disabled={updatingCheckout === checkout.checkoutId}
                                        >
                                          Select
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-gray-400">
                              No upcoming events available{city ? ` in ${city}` : ''}.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {eventDetails?.zoomInvite && (
                        <Button
                          size="sm"
                          className="text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(eventDetails.zoomInvite, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Complete Quiz
                        </Button>
                      )}
                      
                      {/* Match Button - only show for confirmed events and only clickable after event ends */}
                      {!isFlexibleEvent && !canRescheduleEvent && (
                        <Button
                          size="sm"
                          className={`text-xs ${
                            eventDetails && !isEventEnded(eventDetails.gmtdatetime)
                              ? "bg-gray-600 cursor-not-allowed opacity-50"
                              : "bg-green-600 hover:bg-green-700 cursor-pointer"
                          }`}
                          onClick={() => {
                            // If we have event details, check if event has ended
                            // If we don't have event details (past event), allow matching
                            if (!eventDetails || isEventEnded(eventDetails.gmtdatetime)) {
                              handleMatchClick(
                                checkout.productId, 
                                checkout.productType, 
                                eventDetails?.title || `Event ${checkout.productId}`
                              )
                            }
                          }}
                          disabled={eventDetails && !isEventEnded(eventDetails.gmtdatetime)}
                          title={
                            eventDetails && !isEventEnded(eventDetails.gmtdatetime)
                              ? "Match button will be available after the event ends"
                              : "Find your matches"
                          }
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          {eventDetails && !isEventEnded(eventDetails.gmtdatetime) ? "Match (Soon)" : "Match"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Online Speed Dating Section */}
      {onlineSpeedDatingCheckouts.length > 0 && (
        <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-500" />
              Online Speed Dating
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              {onlineSpeedDatingCheckouts.length} session{onlineSpeedDatingCheckouts.length !== 1 ? 's' : ''} registered
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onlineSpeedDatingCheckouts.map((checkout) => {
                // Find product details from the onlineSpeedDatingProducts array by matching productId
                const productDetails = onlineSpeedDatingProducts.find(
                  product => product.productId === checkout.productId && product.eventType === 'onlineSpeedDating'
                )
                const hasEventEnded = productDetails ? isEventEnded(productDetails.gmtdatetime) : true
                
                return (
                  <div
                    key={checkout.checkoutSessionId}
                    className="p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">
                          {productDetails?.title || checkout.product_description || `Online Speed Dating ${checkout.productId}`}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Registered: {formatDate(checkout.checkoutTime)}
                      </div>
                      {productDetails && (
                        <div className="flex items-center text-xs text-blue-300">
                          <Calendar className="w-3 h-3 mr-1" />
                          Event Date: {formatDate(productDetails.gmtdatetime)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {productDetails?.zoomInvite && (
                        <Button
                          size="sm"
                          className="text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(productDetails.zoomInvite, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Join Event
                        </Button>
                      )}
                      
                      {/* Match Button */}
                      <Button
                        size="sm"
                        className={`text-xs ${
                          !hasEventEnded
                            ? "bg-gray-600 cursor-not-allowed opacity-50"
                            : "bg-pink-600 hover:bg-pink-700 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (hasEventEnded) {
                            handleMatchClick(
                              checkout.productId, 
                              checkout.productType, 
                              productDetails?.title || checkout.product_description || `Online Speed Dating ${checkout.productId}`
                            )
                          }
                        }}
                        disabled={!hasEventEnded}
                        title={
                          !hasEventEnded
                            ? "Match button will be available after the event ends"
                            : "Find your matches"
                        }
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        {!hasEventEnded ? "Match (Soon)" : "Match"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              My Products
            </CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} purchased
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((checkout) => (
                <div
                  key={checkout.checkoutSessionId}
                  className="p-4 bg-gray-700 bg-opacity-50 rounded-lg border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white">
                        {checkout.product_description || `Product ${checkout.productId}`}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {checkout.siteName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400 mb-3">
                    <Clock className="w-3 h-3 mr-1" />
                    Purchased: {formatDate(checkout.checkoutTime)}
                  </div>
                  

                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Confirmation Modal */}
      {showConfirmModal && confirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm Event Reschedule
            </h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to reschedule to:
            </p>
            <div className="bg-blue-900 bg-opacity-30 p-3 rounded border border-blue-600 mb-4">
              <h4 className="text-sm font-medium text-white">
                {confirmationData.eventTitle}
              </h4>
              <p className="text-xs text-blue-300">
                {confirmationData.eventDate}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelReschedule}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmReschedule}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updatingCheckout !== null}
              >
                {updatingCheckout !== null ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : null}
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Match Modal */}
      {selectedProductForMatch && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={closeMatchModal}
          productId={selectedProductForMatch.productId}
          productType={selectedProductForMatch.productType}
          eventTitle={selectedProductForMatch.title}
        />
      )}
    </div>
  )
}
