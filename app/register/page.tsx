'use client'

import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { signUp } from "@/lib/auth-utils"
import { useRouter } from "next/navigation"

// Map timezone to city and country
function detectLocationFromTimezone(): { city: string; country: string } {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    console.log('Detected timezone:', timezone)
    
    // City to country mapping for major cities
    const cityToCountry: { [key: string]: string } = {
      // USA
      'New_York': 'USA', 'Los_Angeles': 'USA', 'Chicago': 'USA', 'Denver': 'USA',
      'Phoenix': 'USA', 'Detroit': 'USA', 'Boise': 'USA', 'Anchorage': 'USA',
      // Canada
      'Toronto': 'Canada', 'Vancouver': 'Canada', 'Montreal': 'Canada',
      'Edmonton': 'Canada', 'Winnipeg': 'Canada',
      // UK
      'London': 'United Kingdom',
      // Australia
      'Sydney': 'Australia', 'Melbourne': 'Australia', 'Brisbane': 'Australia',
      'Perth': 'Australia', 'Adelaide': 'Australia', 'Darwin': 'Australia',
      // Georgia
      'Tbilisi': 'Georgia',
      // Other common cities
      'Tokyo': 'Japan', 'Singapore': 'Singapore', 'Hong_Kong': 'Hong Kong',
      'Dubai': 'UAE', 'Paris': 'France', 'Berlin': 'Germany', 'Madrid': 'Spain',
      'Rome': 'Italy', 'Amsterdam': 'Netherlands', 'Brussels': 'Belgium',
      'Zurich': 'Switzerland', 'Stockholm': 'Sweden', 'Dublin': 'Ireland',
      'Auckland': 'New Zealand', 'Wellington': 'New Zealand',
      'Mumbai': 'India', 'Kolkata': 'India', 'Delhi': 'India',
      'Bangkok': 'Thailand', 'Manila': 'Philippines', 'Jakarta': 'Indonesia',
      'Seoul': 'South Korea', 'Shanghai': 'China', 'Beijing': 'China',
      'Cairo': 'Egypt', 'Johannesburg': 'South Africa', 'Lagos': 'Nigeria',
      'Nairobi': 'Kenya', 'Sao_Paulo': 'Brazil', 'Mexico_City': 'Mexico',
      'Buenos_Aires': 'Argentina', 'Santiago': 'Chile', 'Bogota': 'Colombia'
    }
    
    // Parse timezone (e.g., "America/New_York" or "Asia/Tbilisi")
    const parts = timezone.split('/')
    
    if (parts.length >= 2) {
      const cityPart = parts[parts.length - 1]
      let city = cityPart.replace(/_/g, ' ')
      let country = cityToCountry[cityPart] || ''
      
      // If no mapping found, try to infer from region
      if (!country) {
        const region = parts[0]
        if (region === 'America') {
          country = 'USA' // Default for America
        } else if (region === 'Europe') {
          country = cityPart.replace(/_/g, ' ') // Use city as country for Europe
        } else if (region === 'Australia') {
          country = 'Australia'
        } else if (region === 'Pacific') {
          country = 'Australia'
        } else {
          country = '' // Leave blank if we can't determine
        }
      }
      
      console.log('Detected city:', city, 'country:', country)
      return { city, country }
    }
  } catch (error) {
    console.error('Error detecting timezone:', error)
  }
  
  return { city: '', country: '' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [gender, setGender] = useState("")
  const [age, setAge] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [customCountry, setCustomCountry] = useState("")
  const [countryOptions, setCountryOptions] = useState<string[]>([
    'Australia',
    'United Kingdom',
    'Canada',
    'USA'
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Auto-detect location on mount
  useEffect(() => {
    const { city: detectedCity, country: detectedCountry } = detectLocationFromTimezone()
    setCity(detectedCity)
    
    // If detected country is not in the standard list, add it to options
    if (detectedCountry && !countryOptions.includes(detectedCountry)) {
      setCountryOptions(prev => [...prev, detectedCountry])
    }
    
    setCountry(detectedCountry)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const finalCountry = country === 'Other' ? customCountry : country

    if (!fullName || !gender || !age || !city || !finalCountry) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)

    const { data, error } = await signUp(email, password, {
      full_name: fullName,
      gender,
      age,
      city,
      country: finalCountry
    })
    
    if (error) {
      // Check for specific error messages from Supabase
      if (error.message.includes('already registered') || 
          error.message.includes('User already registered') ||
          error.message.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else if (data?.user?.identities && data.user.identities.length === 0) {
      // If identities array is empty, the user already exists
      setError('An account with this email already exists. Please sign in instead.')
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
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
            <CardTitle className="font-serif text-2xl">Create account</CardTitle>
            <CardDescription>Join us to attend amazing events</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                Account created! Redirecting to login...
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="John Doe" 
                  className="h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select 
                  id="gender" 
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  placeholder="25" 
                  className="h-11"
                  min="18"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  type="text" 
                  placeholder="New York" 
                  className="h-11"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <select 
                  id="country" 
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  <option value="">Select country</option>
                  {countryOptions.map((countryOption) => (
                    <option key={countryOption} value={countryOption}>
                      {countryOption}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {country === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="customCountry">Enter Country</Label>
                  <Input 
                    id="customCountry" 
                    type="text" 
                    placeholder="Enter your country" 
                    className="h-11"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Create a strong password"
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Confirm your password"
                  className="h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {"Already have an account? "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
        </p>
      </div>
    </main>
  )
}
