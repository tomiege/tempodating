'use client'

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Heart, 
  Users,
  Settings,
  LogOut
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "@/lib/auth-utils"

// Mock enrolled events - replace with actual data
const mockEvents = [
  {
    id: 1,
    title: "Online Speed Dating - London",
    date: "Saturday, February 1, 2026",
    time: "7:00 PM GMT",
    location: "London, UK",
    ageRange: "30-40",
    status: "upcoming",
    hasMatches: true
  },
  {
    id: 2,
    title: "Online Speed Dating - Manchester",
    date: "Saturday, February 8, 2026",
    time: "7:00 PM GMT",
    location: "Manchester, UK",
    ageRange: "30-40",
    status: "upcoming",
    hasMatches: false
  },
  {
    id: 3,
    title: "Online Speed Dating - London",
    date: "Saturday, January 18, 2026",
    time: "7:00 PM GMT",
    location: "London, UK",
    ageRange: "30-40",
    status: "completed",
    hasMatches: true,
    matchCount: 3
  }
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [signOutLoading, setSignOutLoading] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    setSignOutLoading(true)
    const { error } = await signOut()
    if (!error) {
      router.push('/login')
    } else {
      setSignOutLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center">Loading...</div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const enrolledEvents = mockEvents

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                Welcome back, {user?.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your events and connections
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-foreground">{enrolledEvents.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-foreground">
                  {enrolledEvents.filter(e => e.status === "upcoming").length}
                </p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Matches</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Dates Had</p>
              </CardContent>
            </Card>
          </div>

          {/* Enrolled Events */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-xl">Your Events</CardTitle>
                <Link href="/event">
                  <Button size="sm">Browse Events</Button>
                </Link>
              </div>
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
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          Ages {event.ageRange}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Video className="w-4 h-4" />
                          Zoom
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {event.status === "completed" && event.hasMatches ? (
                        <Button className="gap-2">
                          <Heart className="w-4 h-4" />
                          View Matches ({event.matchCount})
                        </Button>
                      ) : event.status === "upcoming" ? (
                        <>
                          <Link href={`/event`}>
                            <Button variant="outline" size="sm" className="bg-transparent">
                              View Details
                            </Button>
                          </Link>
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
                    <p className="text-sm text-muted-foreground mb-4">
                      Browse our upcoming events and find your perfect match
                    </p>
                    <Link href="/event">
                      <Button>Browse Events</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
