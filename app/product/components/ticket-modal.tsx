"use client"

import { useState } from "react"
import { X, User, Mail, Calendar, CheckCircle, Shield, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import posthog from 'posthog-js'

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
  eventType?: string
}

export default function TicketModal({ 
  isOpen, 
  onClose,
  eventTitle = "Online Speed Dating",
  eventDate = "Saturday, February 1, 2026",
  eventTime = "7:00 PM GMT",
  eventCity = "London",
  price = 15,
  femalePrice = 15,
  currency = "£",
  productId,
  eventType = "onlineSpeedDating"
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleNext = async () => {
    if (step === 1) {
      setIsLoading(true)
      // Track step 1 completion
      posthog.capture('ticket_modal_step_1_completed', { 
        email: email,
        eventTitle: eventTitle,
        eventCity: eventCity 
      })
      // Simulate brief loading
      setTimeout(() => {
        setStep(2)
        setIsLoading(false)
      }, 300)
    } else if (step === 2) {
      setIsLoading(true)
      // Track step 2 completion
      posthog.capture('ticket_modal_step_2_completed', { 
        name: name,
        age: age,
        gender: gender,
        eventTitle: eventTitle,
        eventCity: eventCity 
      })
      setTimeout(() => {
        setStep(3)
        setIsLoading(false)
      }, 300)
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
          productType: eventType,
          items: [{
            price: finalPrice * 100, // Convert to cents for Stripe
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
    setRegistrationSuccess(false)
    setRegistrationError(null)
    onClose()
  }

  const handleApplyDiscount = () => {
    const lowerCaseCode = discountCode.toLowerCase()
    switch (lowerCaseCode) {
      case "welcome15":
        setDiscountApplied(true)
        setDiscountAmount(0.15)
        posthog.capture('discount_code_applied', { 
          code: lowerCaseCode,
          discountAmount: 0.15,
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

  const getCurrentPrice = () => {
    const basePrice = gender === 'male' ? price : femalePrice
    return basePrice * (1 - discountAmount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-card via-secondary/30 to-secondary rounded-3xl w-full max-w-3xl text-foreground overflow-y-auto max-h-[95vh] relative shadow-2xl border border-border">
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
          <p className="text-primary-foreground/80 text-lg font-medium">
            Secure your spot today
          </p>
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
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <Mail className="w-4 h-4 mr-2" />
                  Step 1 of 3
                </div>
                <h3 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  {"Let's Get Started"}
                </h3>
                <p className="text-muted-foreground font-medium">
                  Enter your email to secure your spot
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-foreground">
                    <Mail className="w-4 h-4 mr-2 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-border focus:border-primary focus:ring-primary/20 rounded-xl h-12 font-medium text-lg"
                  />
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

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Step 3 of 3
                </div>
                <h3 className="font-serif text-3xl font-semibold text-foreground mb-2">
                  Complete Your Registration
                </h3>
                <p className="text-muted-foreground font-medium">
                  Review your details and checkout
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Order Summary
                </h4>
                
                <div className="space-y-3 mb-4 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Event</span>
                    <span className="font-medium text-foreground">{eventTitle} - {eventCity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">{eventDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attendee</span>
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ticket Type</span>
                    <span className="font-medium text-foreground capitalize">{gender} Ticket</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Event Ticket</span>
                  <div className="flex items-center space-x-2">
                    {discountApplied ? (
                      <>
                        <span className="text-muted-foreground line-through font-medium">
                          {currency}{(gender === 'male' ? price : femalePrice).toFixed(2)}
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {currency}{getCurrentPrice().toFixed(2)}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                          {(discountAmount * 100).toFixed(0)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {currency}{(gender === 'male' ? price : femalePrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="border-border focus:border-primary rounded-xl h-11"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleApplyDiscount}
                  className="rounded-xl h-11 px-6 bg-transparent"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          {!registrationSuccess && (
          <div className="flex justify-center items-center mt-8">
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !email) || 
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
              ) : step === 2 ? (
                "Continue to Checkout"
              ) : (
                "Complete Purchase"
              )}
            </Button>
          </div>
          )}

          {step === 3 && !registrationSuccess && (
            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex items-center justify-center space-x-3 text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium">
                  Secure payment. Cancel up to 24hrs before for full refund.
                </p>
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
