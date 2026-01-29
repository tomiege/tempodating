"use client"

import { useState, useEffect } from "react"
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
  productType?: string
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
  productType = "onlineSpeedDating"
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
  const { user } = useAuth()

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

  // Returns price in cents (prices from API are already in cents)
  const getCurrentPrice = () => {
    const basePrice = gender === 'male' ? price : femalePrice
    return Math.round(basePrice * (1 - discountAmount))
  }

  // Format cents to display currency (e.g., 1500 -> "15.00")
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2)
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

              {/* Prominent Ticket Type Badge */}
              <div className="text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-lg font-bold ${
                  gender === 'male' 
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200' 
                    : 'bg-pink-100 text-pink-800 border-2 border-pink-200'
                }`}>
                  {gender === 'male' ? '👨' : '👩'} {gender === 'male' ? 'Male' : 'Female'} Ticket
                </div>
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
                </div>

                {/* Price Display */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{gender === 'male' ? 'Male' : 'Female'} Ticket</span>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2">
                      {discountApplied ? (
                        <>
                          <span className="text-muted-foreground line-through font-medium">
                            {currency}{formatPrice(gender === 'male' ? price : femalePrice)}
                          </span>
                          <span className="text-2xl font-bold text-foreground">
                            {currency}{formatPrice(getCurrentPrice())}
                          </span>
                          <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                            {(discountAmount * 100).toFixed(0)}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-foreground">
                          {currency}{formatPrice(gender === 'male' ? price : femalePrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-red-600 text-sm font-bold mt-1">
                      Last Ticket at this price!
                    </span>
                  </div>
                </div>
              </div>

              {/* Discount Code - Hidden by default */}
              {!discountApplied && (
                <div className="text-center">
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
            </div>
          )}

          {/* Footer */}
          {!registrationSuccess && (
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
