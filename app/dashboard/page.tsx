'use client'

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { 
  LogOut,
  Loader2,
  MessageCircle
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "@/lib/auth-utils"
import DashboardProfileComponent from "./components/DashboardProfileComponent"
import { MyCheckoutsComponent } from "./components/MyCheckoutsComponent"
import MyMatchesComponent from "./components/MyMatchesComponent"
import { UpsellNextEventComponent } from "./components/UpsellNextEventComponent"
import MessagesComponent from "./components/MessagesComponent"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { User } from "@/types/profile"

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

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [checkouts, setCheckouts] = useState<CheckoutData[]>([])
  const [checkoutsLoading, setCheckoutsLoading] = useState(true)
  const [onlineSpeedDatingProducts, setOnlineSpeedDatingProducts] = useState<OnlineSpeedDatingProduct[]>([])
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch user's checkouts
  useEffect(() => {
    const fetchCheckouts = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/user/checkouts')
        if (response.ok) {
          const data = await response.json()
          setCheckouts(data)
        } else {
          console.error('Failed to fetch checkouts')
        }
      } catch (error) {
        console.error('Error fetching checkouts:', error)
      } finally {
        setCheckoutsLoading(false)
      }
    }

    if (user) {
      fetchCheckouts()
    }
  }, [user])

  // Fetch online speed dating products when checkouts are loaded
  useEffect(() => {
    const fetchOnlineSpeedDatingProducts = async () => {
      const hasOnlineSpeedDating = checkouts.some(c => c.productType === 'onlineSpeedDating')
      if (!hasOnlineSpeedDating) return
      
      try {
        const response = await fetch('/api/products/onlineSpeedDating')
        if (response.ok) {
          const data = await response.json()
          setOnlineSpeedDatingProducts(data)
        } else {
          console.error('Failed to fetch online speed dating products')
        }
      } catch (error) {
        console.error('Error fetching online speed dating products:', error)
      }
    }

    if (checkouts.length > 0) {
      fetchOnlineSpeedDatingProducts()
    }
  }, [checkouts])

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data)
        } else {
          console.error('Failed to fetch profile')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user])

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return
      try {
        const response = await fetch('/api/messages/inbox')
        if (response.ok) {
          const data = await response.json()
          const unread = data.reduce((sum: number, c: { unreadCount: number }) => sum + c.unreadCount, 0)
          setUnreadMessageCount(unread)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    if (user) {
      fetchUnreadCount()
    }
  }, [user])

  // Handle profile update callback
  const handleProfileUpdate = (updatedUser: User) => {
    setUserProfile(updatedUser)
  }

  const handleSignOut = async () => {
    setSignOutLoading(true)
    const { error } = await signOut()
    if (!error) {
      router.push('/login')
    } else {
      setSignOutLoading(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading your dashboard...</span>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                Welcome back, {userProfile?.name || user?.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your events and connections
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-transparent"
                onClick={handleSignOut}
                disabled={signOutLoading}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signOutLoading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Messages
                {unreadMessageCount > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Events Section - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-8">
                  <UpsellNextEventComponent
                    checkouts={checkouts}
                    onlineSpeedDatingProducts={onlineSpeedDatingProducts}
                  />
                  <MyCheckoutsComponent 
                    checkouts={checkouts}
                    onlineSpeedDatingProducts={onlineSpeedDatingProducts}
                    loading={checkoutsLoading}
                  />
                </div>

                {/* Profile Section - Takes 1 column */}
                <div className="lg:col-span-1 space-y-8">
                  <DashboardProfileComponent 
                    user={userProfile} 
                    onUserUpdate={handleProfileUpdate}
                  />
                  {user && (
                    <MyMatchesComponent userId={user.id} />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages">
              {user && (
                <div className="max-w-2xl mx-auto">
                  <MessagesComponent userId={user.id} onUnreadCountChange={setUnreadMessageCount} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </main>
  )
}
