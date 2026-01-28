"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Heart, MessageCircle, User, Loader2, Calendar, Mail } from "lucide-react"

interface Match {
  id: string
  productId: number
  productType: string
  mutualMatch: boolean
  otherProfile: {
    id: string
    name: string
    contactInfo: string
  }
  matchedAt: string
}

interface MyMatchesComponentProps {
  userId: string
  productId?: number
}

export default function MyMatchesComponent({ userId, productId }: MyMatchesComponentProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchUserMatches()
    }
  }, [userId, productId])

  const fetchUserMatches = async () => {
    try {
      const url = productId 
        ? `/api/match/get-user-matches?productId=${productId}`
        : `/api/match/get-user-matches`
      const response = await fetch(url)
      if (response.ok) {
        const matchesData = await response.json()
        setMatches(matchesData)
      } else {
        console.error("Matches not found")
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
      toast({
        title: "Error",
        description: "Failed to load your matches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleContactMatch = (contactInfo: string, name: string) => {
    // Try to detect if it's an email, phone, or social media handle
    if (contactInfo.includes('@')) {
      window.open(`mailto:${contactInfo}?subject=Hello from speed dating!`, '_blank')
    } else if (contactInfo.includes('instagram.com') || contactInfo.includes('@')) {
      window.open(contactInfo.includes('http') ? contactInfo : `https://instagram.com/${contactInfo.replace('@', '')}`, '_blank')
    } else {
      // Copy to clipboard for phone numbers or other contact info
      navigator.clipboard.writeText(contactInfo)
      toast({
        title: "Contact info copied!",
        description: `${name}'s contact information has been copied to your clipboard.`,
      })
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            My Matches
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

  if (matches.length === 0) {
    return (
      <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            My Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">No matches yet</p>
            <p className="text-gray-500 text-sm">
              Attend an event and like other participants to see your matches here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const mutualMatches = matches.filter(m => m.mutualMatch)
  const oneWayMatches = matches.filter(m => !m.mutualMatch)

  return (
    <Card className="bg-gray-800 bg-opacity-80 backdrop-blur-lg shadow-xl border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Heart className="w-5 h-5 mr-2" />
          My Matches
        </CardTitle>
        <p className="text-gray-400 text-sm mt-1">
          {mutualMatches.length} mutual match{mutualMatches.length !== 1 ? 'es' : ''}, {oneWayMatches.length} pending
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mutual Matches */}
          {mutualMatches.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-1 fill-current" />
                Mutual Matches
              </h4>
              {mutualMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-600 mb-3"
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-green-600 text-white">
                        {match.otherProfile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-white truncate">
                          {match.otherProfile.name}
                        </h5>
                        <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                          Product {match.productId}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Matched {formatDate(match.matchedAt)}
                      </p>
                      <Button
                        size="sm"
                        className="text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleContactMatch(match.otherProfile.contactInfo, match.otherProfile.name)}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* One-way Matches */}
          {oneWayMatches.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                Pending Matches
              </h4>
              {oneWayMatches.slice(0, 3).map((match) => (
                <div
                  key={match.id}
                  className="p-3 bg-yellow-900 bg-opacity-20 rounded-lg border border-yellow-600 mb-3"
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-yellow-600 text-white">
                        {match.otherProfile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-white truncate">
                          {match.otherProfile.name}
                        </h5>
                        <Badge variant="secondary" className="bg-yellow-600 text-white text-xs">
                          Product {match.productId}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        Waiting for them to match back
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {oneWayMatches.length > 3 && (
                <p className="text-xs text-gray-400 text-center">
                  +{oneWayMatches.length - 3} more pending matches
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
