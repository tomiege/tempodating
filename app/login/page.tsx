'use client'

import Link from "next/link"
import { Heart, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { sendOTP, verifyOTP } from "@/lib/auth-utils"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await sendOTP(email.toLowerCase().trim())
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setStep('otp')
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await verifyOTP(email.toLowerCase().trim(), otpCode)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data?.user) {
      router.push("/dashboard")
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await sendOTP(email.toLowerCase().trim())
    
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Pink gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-100/80 via-background to-pink-50/40 -z-10" />
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <span className="font-serif text-2xl font-semibold text-foreground">Tempo</span>
        </Link>

        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-serif text-2xl">Welcome back</CardTitle>
            <CardDescription>
              {step === 'email' 
                ? "Enter your email to receive a verification code" 
                : `Enter the 6-digit code sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {step === 'email' ? (
              <form className="space-y-4" onSubmit={handleSendOTP}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading || !email}>
                  {loading ? "Sending code..." : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyOTP}>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Verification Code
                  </Label>
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="Enter 6-digit code"
                    className="h-11 text-center text-xl tracking-widest"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading || otpCode.length !== 6}>
                  {loading ? "Verifying..." : "Sign In"}
                </Button>
                
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-primary hover:underline"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div> */}

           
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
        </p>
      </div>
    </main>
  )
}
