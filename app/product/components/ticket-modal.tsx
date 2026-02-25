"use client"

import { useState, useEffect } from "react"
import { X, User, Mail, Calendar, CheckCircle, Shield, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import posthog from 'posthog-js'
import { useFeatureFlagVariantKey } from 'posthog-js/react'
import * as Sentry from '@sentry/nextjs'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  eventTitle?: string
  eventDate?: string
  eventTime?: string
  eventCity?: string
  price?: number
  femalePrice?: number
  currency?: string
  productId?: number
  productType?: string
  regionId?: string
}

export default function TicketModal({ 
  isOpen, 
  onClose,
  eventTitle = "Online Speed Dating",
  eventDate = "Saturday, February 1, 2026",
  eventTime = "7:00 PM GMT",
  eventCity = "London",
  price = 1500,
  femalePrice = 1500,
  currency = "£",
  productId,
  productType = "onlineSpeedDating",
  regionId
}: TicketModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [gender, setGender] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [leadId, setLeadId] = useState<number | null>(null)
  const [isExistingAccountFlow, setIsExistingAccountFlow] = useState(false)
  const [dynamicMalePrice, setDynamicMalePrice] = useState<number | null>(null)
  const [dynamicFemalePrice, setDynamicFemalePrice] = useState<number | null>(null)
  const [isSoldOut, setIsSoldOut] = useState(false)
  const [soldOutNextEvent, setSoldOutNextEvent] = useState<{ productId: number; city: string; gmtdatetime: string } | null>(null)
  const [isWaitlisted, setIsWaitlisted] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [pricingLoaded, setPricingLoaded] = useState(false)
  const [pricingData, setPricingData] = useState<{
    maleSoldOut: boolean
    femaleSoldOut: boolean
    nextEvent: { productId: number; city: string; gmtdatetime: string } | null
  } | null>(null)
  const { user } = useAuth()
  
  // Get feature flag variant
  // const checkoutVariant = useFeatureFlagVariantKey('ticket-modal-test')
  const checkoutVariant = 'test'
  // Log feature flag variant only when it changes
  useEffect(() => {
    console.log(`🚩 Ticket Modal Feature Flag - checkout variant: ${checkoutVariant}`)
  }, [checkoutVariant])

  // Fetch dynamic pricing when modal opens
  useEffect(() => {
    if (!isOpen || !productId) return

    const fetchPricing = async () => {
      try {
        const params = new URLSearchParams({
          productId: productId.toString(),
          malePrice: price.toString(),
          femalePrice: (femalePrice ?? price).toString(),
          ...(regionId ? { regionId } : {}),
        })

        const response = await fetch(`/api/calculate-ticket-price?${params}`)
        if (!response.ok) {
          throw new Error(`Pricing API returned ${response.status}`)
        }

        const data = await response.json()

        console.log(`🎟️ Dynamic pricing for product ${productId}: Male tickets sold=${data.maleTickets}, Female tickets sold=${data.femaleTickets}`)
        console.log(`💰 Adjusted prices: Male=${data.adjustedMalePrice}, Female=${data.adjustedFemalePrice}`)
        console.log(`🔒 Sold-out flags: maleSoldOut=${data.maleSoldOut}, femaleSoldOut=${data.femaleSoldOut}, nextEvent=${JSON.stringify(data.nextEvent)}`)

        setDynamicMalePrice(data.adjustedMalePrice)
        setDynamicFemalePrice(data.adjustedFemalePrice)
        setPricingData({
          maleSoldOut: data.maleSoldOut,
          femaleSoldOut: data.femaleSoldOut,
          nextEvent: data.nextEvent,
        })
        setPricingLoaded(true)
      } catch (error) {
        console.error('Error fetching dynamic pricing:', error)
        Sentry.captureException(error, {
          tags: { feature: 'dynamic-ticket-pricing' },
          extra: { productId, regionId },
        })
        // Fall back to base prices
        setPricingLoaded(true)
      }
    }

    fetchPricing()
  }, [isOpen, productId, price, femalePrice, regionId])

  // Check sold-out status when gender is selected and pricing is loaded
  // Also re-check when step changes (for logged-in users jumping to step 3)
  useEffect(() => {
    if (!pricingLoaded || !gender || !pricingData) return

    const userSoldOut = gender === 'male' ? pricingData.maleSoldOut : pricingData.femaleSoldOut

    console.log(`🔍 Sold-out check: gender=${gender}, userSoldOut=${userSoldOut}, step=${step}, maleSoldOut=${pricingData.maleSoldOut}, femaleSoldOut=${pricingData.femaleSoldOut}, nextEvent=${JSON.stringify(pricingData.nextEvent)}`)

    if (userSoldOut) {
      setIsSoldOut(true)
      if (pricingData.nextEvent) {
        setSoldOutNextEvent(pricingData.nextEvent)
      } else {
        setIsWaitlisted(true)
      }
    } else {
      setIsSoldOut(false)
      setSoldOutNextEvent(null)
      setIsWaitlisted(false)
    }
  }, [pricingLoaded, pricingData, gender, step])

  // Start redirect countdown when sold out with next event and at step 3
  useEffect(() => {
    if (step === 3 && isSoldOut && soldOutNextEvent && redirectCountdown === null) {
      setRedirectCountdown(3)
    }
  }, [step, isSoldOut, soldOutNextEvent, redirectCountdown])

  // Redirect countdown when sold out with next event
  useEffect(() => {
    if (redirectCountdown === null) return

    if (redirectCountdown <= 0 && soldOutNextEvent) {
      window.location.href = `/product?productId=${soldOutNextEvent.productId}&productType=onlineSpeedDating`
      return
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(redirectCountdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [redirectCountdown, soldOutNextEvent])

  // If user is already logged in, skip to payment step
  useEffect(() => {
    if (isOpen && user) {
      // Pre-fill user data from their profile
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const userData = await response.json()
            setEmail(userData.email || user.email || "")
            setName(userData.full_name || "")
            setGender(userData.gender || "")
            setAge(userData.age?.toString() || "")
            setStep(3) // Go directly to payment step
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to basic user data
          setEmail(user.email || "")
          setStep(3)
        }
      }
      fetchUserData()
    }
  }, [isOpen, user])

  const handleNext = async () => {
    if (step === 1) {
      // Create lead and go to step 2
      setIsLoading(true)
      setRegistrationError(null)
      
      try {
        // Create lead
        const leadResponse = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email.toLowerCase().trim(),
            city: eventCity,
            country: eventCity,
            product_id: productId,
            product_type: productType
          })
        })

        if (leadResponse.ok) {
          const leadData = await leadResponse.json()
          setLeadId(leadData.id)
          console.log('📝 Lead created:', leadData.id)
          
          posthog.capture('lead_created', { 
            leadId: leadData.id,
            email: email,
            eventTitle: eventTitle,
            eventCity: eventCity 
          })
        } else {
          console.error('Failed to create lead, continuing anyway...')
        }

        // Go directly to step 2 to collect user details
        setIsNewUser(true)
        setStep(2)
        setIsLoading(false)
        
        posthog.capture('ticket_modal_new_user', { 
          email: email,
          eventTitle: eventTitle 
        })
      } catch (error) {
        console.error('Error in step 1:', error)
        setRegistrationError(error instanceof Error ? error.message : 'Failed to continue. Please try again.')
        setIsLoading(false)
      }
    } else if (step === 1.5) {
      // Existing account flow - create lead with provided email and go to step 2
      setIsLoading(true)
      setRegistrationError(null)
      
      try {
        // Create lead
        const leadResponse = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email.toLowerCase().trim(),
            city: eventCity,
            country: eventCity,
            product_id: productId,
            product_type: productType
          })
        })

        if (leadResponse.ok) {
          const leadData = await leadResponse.json()
          setLeadId(leadData.id)
          console.log('📝 Lead created for existing account:', leadData.id)
          
          posthog.capture('lead_created_existing_account', { 
            leadId: leadData.id,
            email: email,
            eventTitle: eventTitle,
            eventCity: eventCity 
          })
        } else {
          console.error('Failed to create lead, continuing anyway...')
        }

        // Go to step 2 to collect user details
        setStep(2)
        setIsLoading(false)
        
        posthog.capture('ticket_modal_existing_account_email_entered', { 
          email: email,
          eventTitle: eventTitle 
        })
      } catch (error) {
        console.error('Error in step 1.5:', error)
        setRegistrationError(error instanceof Error ? error.message : 'Failed to continue. Please try again.')
        setIsLoading(false)
      }
    } else if (step === 2) {
      // Update lead with user details
      setIsLoading(true)
      setRegistrationError(null)
      
      posthog.capture('ticket_modal_user_details_completed', { 
        leadId: leadId,
        name: name,
        age: age,
        gender: gender,
        eventTitle: eventTitle,
        eventCity: eventCity 
      })
      
      try {
        // Update the lead with user details
        if (leadId) {
          const leadResponse = await fetch('/api/leads', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: leadId,
              name: name,
              age: parseInt(age),
              gender: gender,
              city: eventCity,
              country: eventCity
            })
          })
          
          if (leadResponse.ok) {
            console.log('✅ Lead updated successfully')
            posthog.capture('lead_updated', { 
              leadId: leadId,
              name: name,
              age: age,
              gender: gender 
            })
          } else {
            console.error('Failed to update lead, continuing anyway...')
          }
        }
        
        setStep(3) // Go to payment
        setIsLoading(false)
      } catch (error) {
        console.error('Error updating lead:', error)
        // Still proceed to payment even if lead update fails
        setStep(3)
        setIsLoading(false)
      }
    } else if (step === 3) {
      setIsLoading(true)
      setRegistrationError(null)
      
      // Track checkout initiation
      posthog.capture('checkout_initiated', { 
        eventTitle: eventTitle,
        eventCity: eventCity,
        price: getCurrentPrice(),
        gender: gender,
        discountApplied: discountApplied,
        discountAmount: discountAmount 
      })
      
      try {
        // Create checkout session
        const finalPrice = getCurrentPrice();
        const checkoutData = {
          productId: productId,
          productType: productType,
          items: [{
            price: finalPrice, // Price is already in cents
            quantity: 1,
            name: `${eventTitle} - ${eventCity}`
          }],
          currency: currency,
          email: email,
          name: name,
          phoneNumber: '', // Optional field
          isMale: gender === 'male',
          queryCity: eventCity
        };

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkoutData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const { url, checkoutId, isFree } = await response.json();

        // Track successful checkout session creation
        posthog.capture('checkout_session_created', { 
          checkoutId: checkoutId,
          eventTitle: eventTitle,
          eventCity: eventCity,
          isFree: isFree 
        })

        // Redirect to Stripe checkout or success page
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error('Checkout error:', error)
        // Track checkout error
        posthog.capture('checkout_error', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          eventTitle: eventTitle,
          eventCity: eventCity 
        })
        setRegistrationError(
          error instanceof Error 
            ? error.message 
            : 'Failed to create checkout session. Please try again.'
        )
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    setStep(1)
    setName("")
    setEmail("")
    setGender("")
    setAge("")
    setDiscountCode("")
    setDiscountApplied(false)
    setDiscountAmount(0)
    setShowDiscountInput(false)
    setRegistrationSuccess(false)
    setRegistrationError(null)
    setIsNewUser(false)
    setLeadId(null)
    setIsExistingAccountFlow(false)
    setIsSoldOut(false)
    setSoldOutNextEvent(null)
    setIsWaitlisted(false)
    setRedirectCountdown(null)
    setPricingLoaded(false)
    setDynamicMalePrice(null)
    setDynamicFemalePrice(null)
    setPricingData(null)
    onClose()
  }

  const handleApplyDiscount = () => {
    const lowerCaseCode = discountCode.toLowerCase()
    switch (lowerCaseCode) {
      case "valentinesinvite20":
        setDiscountApplied(true)
        setDiscountAmount(0.20)
        posthog.capture('discount_code_applied', { 
          code: lowerCaseCode,
          discountAmount: 0.20,
          eventTitle: eventTitle 
        })
        break
      case "tempo20":
        setDiscountApplied(true)
        setDiscountAmount(0.20)
        posthog.capture('discount_code_applied', { 
          code: lowerCaseCode,
          discountAmount: 0.20,
          eventTitle: eventTitle 
        })
        break
      default:
        setDiscountApplied(false)
        setDiscountAmount(0)
        posthog.capture('discount_code_failed', { 
          code: lowerCaseCode,
          eventTitle: eventTitle 
        })
        alert("Invalid discount code")
    }
  }

  // Returns price in cents (prices from API are already in cents)
  const getCurrentPrice = () => {
    let basePrice: number
    if (gender === 'male') {
      basePrice = dynamicMalePrice ?? price
    } else {
      basePrice = dynamicFemalePrice ?? femalePrice
    }
    return Math.round(basePrice * (1 - discountAmount))
  }

  // Format cents to display currency (e.g., 1500 -> "15.00")
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2)
  }

  // Get currency symbol from currency code
  const getCurrencySymbol = () => {
    const currencyUpper = currency.toUpperCase()
    if (['USD', 'CAD', 'AUD'].includes(currencyUpper)) return '$'
    if (currencyUpper === 'GBP' || currency === '£') return '£'
    if (currencyUpper === 'EUR' || currency === '€') return '€'
    return currency
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-3xl w-full max-w-3xl text-foreground overflow-y-auto max-h-[95vh] relative shadow-2xl border border-border">
        <button 
          onClick={handleClose} 
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 rounded-t-3xl">
          <div className="flex items-center mb-4">
            <Calendar className="w-6 h-6 mr-3" />
            <div className="text-primary-foreground/90 font-medium">
              <div>{eventDate}</div>
              <div className="text-sm">{eventTime}</div>
            </div>
          </div>
          <h2 className="font-serif text-3xl font-semibold mb-2">
            {eventTitle} - {eventCity}
          </h2>
          {/* <p className="text-primary-foreground/80 text-lg font-medium">
            Secure your spot today
          </p> */}
        </div>

        <div className="p-8">
          {registrationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <p className="font-medium">{registrationError}</p>
            </div>
          )}

          {registrationSuccess ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                Registration Successful!
              </h3>
              <p className="text-muted-foreground mb-4">
                Your spot has been reserved. You will receive a confirmation email shortly.
              </p>
              <div className="bg-primary/10 text-primary p-4 rounded-xl">
                <p className="font-medium">Next Step: Complete Payment</p>
                <p className="text-sm mt-1">Check your email for payment instructions</p>
              </div>
            </div>
          ) : (
            <>
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  {"Let's Get Started"}
                </h3>
                <p className="text-muted-foreground font-medium">
                  Enter your email to secure your spot
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <Mail className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email && !isLoading) {
                        handleNext()
                      }
                    }}
                    className="border-border focus:border-primary focus:ring-primary/20 rounded-xl h-14 font-medium text-base pl-12"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground font-medium">or</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsExistingAccountFlow(true)
                        setStep(1.5)
                      }}
                      className="text-primary font-semibold hover:underline"
                    >
                      Already have an account? Click here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1.5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  Welcome Back!
                </h3>
                <p className="text-muted-foreground font-medium">
                  Enter the email you used to sign up
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <Mail className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email && !isLoading) {
                        handleNext()
                      }
                    }}
                    className="border-border focus:border-primary focus:ring-primary/20 rounded-xl h-14 font-medium text-base pl-12"
                  />
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExistingAccountFlow(false)
                      setEmail('')
                      setStep(1)
                    }}
                    className="text-primary font-semibold hover:underline text-sm"
                  >
                    ← Back to new registration
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <User className="w-4 h-4 mr-2" />
                  Step 2 of 3
                </div>
                <h3 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  Tell Us About You
                </h3>
                <p className="text-muted-foreground font-medium">
                  Just a few more details
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-foreground">
                    <User className="w-4 h-4 mr-2 text-primary" />
                    Full Name
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="border-border focus:border-primary focus:ring-primary/20 rounded-xl h-12 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Age
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="18"
                      max="100"
                      className="border-border focus:border-primary focus:ring-primary/20 rounded-xl h-12 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
                      Gender
                    </label>
                    <Select onValueChange={(value) => setGender(value)} value={gender}>
                      <SelectTrigger className="border-border focus:border-primary focus:ring-primary/20 rounded-xl h-12 font-medium">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && !pricingLoaded && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-muted-foreground font-medium">Checking availability...</p>
              </div>
            </div>
          )}

          {step === 3 && pricingLoaded && isSoldOut && soldOutNextEvent && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Heart className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                  Event Sold Out!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Directing you to next event on{' '}
                  <strong className="text-foreground">
                    {new Date(soldOutNextEvent.gmtdatetime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </strong>...
                </p>
                <p className="text-lg font-bold text-primary">
                  {redirectCountdown !== null ? `Redirecting in ${redirectCountdown}s...` : 'Preparing redirect...'}
                </p>
              </div>
            </div>
          )}

          {step === 3 && pricingLoaded && isSoldOut && isWaitlisted && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <Heart className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                  Event Sold Out
                </h3>
                <p className="text-muted-foreground mb-4">
                  Sorry, your event is sold out. But you have been added to the waitlist!
                </p>
                <div className="bg-primary/10 text-primary p-4 rounded-xl">
                  <p className="font-medium">You&apos;re on the waitlist</p>
                  <p className="text-sm mt-1">We&apos;ll notify you if a spot opens up or when new events are added for your area.</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && pricingLoaded && !isSoldOut && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                {/* <h3 className="font-serif text-2xl font-semibold text-foreground">
                  Checkout
                </h3> */}
              </div>

              {/* Order Summary */}
              {checkoutVariant === 'test' ? (
                // Test variant with ticket image - mobile optimized
                <div className="bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm">
                  {/* Mobile Layout: Image on top, content below */}
                  <div className="sm:hidden space-y-4">
                    {/* Ticket Image - Centered on top for mobile */}
                    <div className="flex justify-center">
                      <img 
                        src="/onlineSpeedDating/speed-dating-ticket.png" 
                        alt="Speed Dating Ticket"
                        className="w-32 h-16 object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* Ticket Title */}
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-foreground">Online Speed Dating</h4>
                      <p className="text-sm text-muted-foreground">1× Admission</p>
                    </div>
                    
                    {/* Pricing */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center flex-wrap justify-center gap-2">
                        {discountApplied ? (
                          <>
                            <span className="text-base text-muted-foreground line-through font-medium">
                              {getCurrencySymbol()}{formatPrice(gender === 'male' ? price : femalePrice)}
                            </span>
                            <span className="text-2xl font-bold text-foreground">
                              {getCurrencySymbol()}{formatPrice(getCurrentPrice())}
                            </span>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                              {(discountAmount * 100).toFixed(0)}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-foreground">
                            {getCurrencySymbol()}{formatPrice(getCurrentPrice())}
                          </span>
                        )}
                      </div>
                      <span className="text-red-600 text-sm font-bold">
                        🔥 Last Ticket at this price!
                      </span>
                    </div>
                    
                    {/* Important Notice */}
                    <div className="pt-3 border-t border-border">
                      {/* <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Please arrive 5 minutes prior to the scheduled start time</span>
                      </p> */}
                    </div>
                  </div>

                  {/* Desktop Layout: Image on left, content on right */}
                  <div className="hidden sm:flex gap-4 items-center">
                    {/* Ticket Image */}
                    <div className="flex-shrink-0">
                      <img 
                        src="/onlineSpeedDating/speed-dating-ticket.png" 
                        alt="Speed Dating Ticket"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    
                    {/* Ticket Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">Online Speed Dating Admission</h4>
                          <p className="text-sm text-muted-foreground">1× Admission</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            {discountApplied ? (
                              <>
                                <span className="text-muted-foreground line-through font-medium">
                                  {getCurrencySymbol()}{formatPrice(gender === 'male' ? price : femalePrice)}
                                </span>
                                <span className="text-2xl font-bold text-foreground">
                                  {getCurrencySymbol()}{formatPrice(getCurrentPrice())}
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                  {(discountAmount * 100).toFixed(0)}% OFF
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-foreground">
                                {getCurrencySymbol()}{formatPrice(getCurrentPrice())}
                              </span>
                            )}
                          </div>
                          <span className="text-red-600 text-sm font-bold mt-1">
                            🔥 Last Ticket at this price!
                          </span>
                        </div>
                      </div>
                      
                      {/* Important Notice */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Please arrive 5 minutes prior to the scheduled start time
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Control variant - original simple version
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-foreground">Speed Dating Ticket</span>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-2">
                        {discountApplied ? (
                          <>
                            <span className="text-muted-foreground line-through font-medium">
                              {getCurrencySymbol()}{formatPrice(gender === 'male' ? price : femalePrice)}
                            </span>
                            <span className="text-2xl font-bold text-foreground">
                              {getCurrencySymbol()}{formatPrice(getCurrentPrice())}
                            </span>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                              {(discountAmount * 100).toFixed(0)}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-foreground">
                            {getCurrencySymbol()}{formatPrice(getCurrentPrice())}
                          </span>
                        )}
                      </div>
                      <span className="text-red-600 text-sm font-bold mt-1">
                        🔥 Last Ticket at this price!
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!registrationSuccess && !(isSoldOut && step === 3) && !(step === 3 && !pricingLoaded) && (
          <div className="flex justify-center items-center mt-8">
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !email) || 
                (step === 1.5 && !email) ||
                (step === 2 && (!name || !age || !gender)) ||
                isLoading
              }
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold px-12 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : step === 1 ? (
                "Continue"
              ) : step === 1.5 ? (
                "Continue"
              ) : step === 2 ? (
                "Continue to Payment"
              ) : (
                "Complete Purchase"
              )}
            </Button>
          </div>
          )}

          {/* Discount Code - Below Complete Purchase button */}
          {step === 3 && pricingLoaded && !isSoldOut && !discountApplied && !registrationSuccess && (
            <div className="text-center mt-4">
              {!showDiscountInput ? (
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(true)}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  Have a discount code?
                </button>
              ) : (
                <div className="flex gap-2 max-w-xs mx-auto">
                  <Input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="border-border focus:border-primary rounded-xl h-10 text-sm"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleApplyDiscount}
                    className="rounded-xl h-10 px-4 bg-transparent text-sm"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && pricingLoaded && !isSoldOut && !registrationSuccess && (
            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex items-center justify-center space-x-3">
                <Shield className="w-6 h-6 text-green-600" />
                <p className="text-base font-semibold text-foreground">
                  Secure payment powered by
                </p>
                <img src="/brands/stripe-logo.png" alt="Stripe" className="h-14" />
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
