'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Mail, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { sendOTP, verifyOTP } from '@/lib/auth-utils'

interface CheckoutData {
  checkout_id: number
  checkout_session_id: string
  user_id: string | null
  email: string
  name: string | null
  total_order: number
  product_type: string
  product_description: string | null
  is_male: boolean | null
  query_city: string | null
  confirmation_email_sent: boolean
  checkout_time: string
}

interface CheckoutSuccessClientProps {
  productType: string
  checkoutSessionId: string | undefined
  email: string | undefined
}

export default function CheckoutSuccessClient({
  productType,
  checkoutSessionId,
  email: initialEmail,
}: CheckoutSuccessClientProps) {
  const { user, loading: authLoading } = useAuth()
  const [checkout, setCheckout] = useState<CheckoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp' | 'complete'>('email')
  const [authEmail, setAuthEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading2, setAuthLoading2] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  // Fetch checkout data and process confirmation
  useEffect(() => {
    if (!checkoutSessionId) {
      setError('No checkout session found')
      setLoading(false)
      return
    }

    const processCheckout = async () => {
      try {
        // First, confirm the checkout (send email if needed)
        const confirmResponse = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkoutSessionId,
          }),
        })

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm checkout')
        }

        const { checkout: checkoutData, emailSent } = await confirmResponse.json()
        setCheckout(checkoutData)
        setAuthEmail(checkoutData.email || '')
        setEmailConfirmed(emailSent || checkoutData.confirmation_email_sent)
        
        // If user is already logged in, mark as complete
        if (user?.id) {
          setStep('complete')
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error processing checkout:', err)
        setError('Failed to load order details')
        setLoading(false)
      }
    }

    // Wait for auth to be resolved before processing
    if (!authLoading) {
      processCheckout()
    }
  }, [checkoutSessionId, user?.id, authLoading])

  // =========================================================
  // ASSIGN CHECKOUT TO USER
  // This runs every time a logged-in user is on this page
  // It does 2 things:
  // 1. Assigns the checkout to the user (sets user_id)
  // 2. Transfers checkout data to user profile (name, is_male, city)
  // =========================================================
  useEffect(() => {
    if (user?.id && checkout) {
      const assignCheckoutToUser = async () => {
        try {
          console.log('🚀 Calling assign-checkout-to-user API...')
          
          const response = await fetch('/api/checkout/assign-to-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              checkoutSessionId,
              userId: user.id,
            }),
          })

          if (response.ok) {
            const { checkout: updatedCheckout, fieldsUpdated } = await response.json()
            console.log('✅ Checkout assigned to user. Fields updated:', fieldsUpdated)
            setCheckout(updatedCheckout)
            setStep('complete')
          } else {
            console.error('❌ Failed to assign checkout to user')
          }
        } catch (err) {
          console.error('❌ Error assigning checkout to user:', err)
        }
      }

      assignCheckoutToUser()
    }
  }, [user?.id, checkout, checkoutSessionId])

  // Also mark complete when user is detected
  useEffect(() => {
    if (user?.id && step !== 'complete') {
      setStep('complete')
    }
  }, [user?.id, step])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading2(true)
    setAuthError(null)

    try {
      const { error } = await sendOTP(authEmail.toLowerCase().trim())
      if (error) {
        setAuthError(error.message)
      } else {
        setStep('otp')
      }
    } catch (err) {
      setAuthError('Failed to send verification code. Please try again.')
    } finally {
      setAuthLoading2(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading2(true)
    setAuthError(null)

    try {
      const { error } = await verifyOTP(authEmail.toLowerCase().trim(), otpCode)
      if (error) {
        setAuthError(error.message)
        setAuthLoading2(false)
        return
      }
      
      // OTP verified - user will be logged in automatically via useAuth hook
      // The useEffect above will handle assigning to checkout and creating profile
    } catch (err) {
      setAuthError('Invalid verification code. Please try again.')
      setAuthLoading2(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-2xl w-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your order...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-2xl w-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <a href="/" className="text-primary hover:underline">
              Return to Home
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLoggedIn = !!user

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            Thank You for Your Purchase!
          </CardTitle>
          <CardDescription className="text-lg">
            Your order has been successfully processed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Summary - Always visible, minimal info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-300">Reference</span>
              <span className="font-mono text-xs text-gray-500">{checkout?.checkout_session_id}</span>
            </div>
            {checkout?.is_male !== null && checkout?.is_male !== undefined && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Ticket Type</span>
                <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                  checkout?.is_male 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-pink-100 text-pink-800'
                }`}>
                  {checkout?.is_male ? '👨 Male' : '👩 Female'} Ticket
                </span>
              </div>
            )}
          </div>

          {/* Email Confirmation Status */}
          {emailConfirmed && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Mail className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 dark:text-green-200">
                A confirmation email has been sent to <strong>{checkout?.email}</strong>
              </p>
            </div>
          )}

          {/* Email Verification Step */}
          {!isLoggedIn && step === 'email' && (
            <div className="border-2 border-primary rounded-xl p-8 bg-card shadow-lg">
              <div className="text-center mb-6">
                <h3 className="font-bold text-2xl mb-3">Verify Your Email</h3>
                <p className="text-muted-foreground">
                  Confirm your email to access your tickets
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-red-600">{authError}</p>
                )}
                <Button type="submit" disabled={authLoading2} className="w-full h-14 text-lg">
                  {authLoading2 ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* OTP Step */}
          {!isLoggedIn && step === 'otp' && (
            <div className="border-2 border-primary rounded-xl p-8 bg-card shadow-lg">
              <div className="text-center mb-6">
                <h3 className="font-bold text-2xl mb-3">Enter Verification Code</h3>
                <p className="text-muted-foreground">
                  We sent a 6-digit code to <strong>{authEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest h-14"
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-red-600">{authError}</p>
                )}
                <Button 
                  type="submit" 
                  disabled={authLoading2 || otpCode.length !== 6} 
                  className="w-full h-14 text-lg"
                >
                  {authLoading2 ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify & Complete'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtpCode('')
                    setAuthError(null)
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change email
                </button>
              </form>
            </div>
          )}

          {/* Complete State - Logged in */}
          {(isLoggedIn || step === 'complete') && (
            <>
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your account is set up and this order is linked. You can access your tickets from your dashboard.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
                >
                  Go to Dashboard
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
