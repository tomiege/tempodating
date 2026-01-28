"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Heart, Loader2, MessageCircle, X, User, Calendar, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Participant {
  id: string
  name: string
  bio: string
  age?: number
  city?: string
  avatarUrl?: string
  isMale?: boolean
  isLiked: boolean
}

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

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
  productType?: string
  eventTitle: string
}

export default function MatchModal({
  isOpen,
  onClose,
  productId,
  productType = "onlineSpeedDating",
  eventTitle,
}: MatchModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [likingUser, setLikingUser] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && productId) {
      fetchParticipants()
      fetchMatches()
    }
  }, [isOpen, productId])

  const fetchParticipants = async () => {
    setLoadingParticipants(true)
    try {
      const response = await fetch(
        `/api/match/get-event-participants?productId=${productId}&productType=${productType}`
      )
      if (response.ok) {
        const data = await response.json()
        setParticipants(data)
      } else {
        const error = await response.json()
        console.error("Error fetching participants:", error)
        toast({
          title: "Error",
          description: error.error || "Failed to load participants",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive",
      })
    } finally {
      setLoadingParticipants(false)
    }
  }

  const fetchMatches = async () => {
    setLoadingMatches(true)
    try {
      const response = await fetch(
        `/api/match/get-user-matches?productId=${productId}`
      )
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      } else {
        console.error("Error fetching matches")
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleLike = async (participantId: string) => {
    setLikingUser(participantId)
    try {
      const response = await fetch("/api/match/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likedUserId: participantId,
          productId,
          productType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId ? { ...p, isLiked: true } : p
          )
        )

        // Refresh matches to get updated mutual match status
        fetchMatches()

        if (data.isMutualMatch) {
          toast({
            title: "🎉 It's a Match!",
            description: "You both liked each other! Check your matches to see contact info.",
          })
        } else {
          toast({
            title: "Liked!",
            description: "If they like you back, you'll be able to see their contact info.",
          })
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to like this person",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error liking user:", error)
      toast({
        title: "Error",
        description: "Failed to like this person",
        variant: "destructive",
      })
    } finally {
      setLikingUser(null)
    }
  }

  const handleUnlike = async (participantId: string) => {
    setLikingUser(participantId)
    try {
      const response = await fetch(
        `/api/match/like?likedUserId=${participantId}&productId=${productId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        // Update local state
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId ? { ...p, isLiked: false } : p
          )
        )
        
        // Refresh matches
        fetchMatches()

        toast({
          title: "Unliked",
          description: "You've removed your like.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to unlike",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error unliking user:", error)
      toast({
        title: "Error",
        description: "Failed to unlike",
        variant: "destructive",
      })
    } finally {
      setLikingUser(null)
    }
  }

  const handleContact = (contactInfo: string, name: string) => {
    if (contactInfo.includes("@") && !contactInfo.includes("instagram")) {
      window.open(
        `mailto:${contactInfo}?subject=Hello from speed dating!`,
        "_blank"
      )
    } else if (contactInfo.includes("instagram.com") || contactInfo.startsWith("@")) {
      window.open(
        contactInfo.includes("http")
          ? contactInfo
          : `https://instagram.com/${contactInfo.replace("@", "")}`,
        "_blank"
      )
    } else {
      navigator.clipboard.writeText(contactInfo)
      toast({
        title: "Contact info copied!",
        description: `${name}'s contact information has been copied to your clipboard.`,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const mutualMatches = matches.filter((m) => m.mutualMatch)
  const pendingMatches = matches.filter((m) => !m.mutualMatch)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Match - {eventTitle}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Like other participants to connect. When you both like each other, you'll see their contact info!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="participants" className="data-[state=active]:bg-gray-700">
              Participants ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-gray-700">
              Matches ({mutualMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <ScrollArea className="h-[50vh] pr-4">
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300">No other participants yet</p>
                  <p className="text-gray-500 text-sm">
                    Check back later to see who attended the event.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          {participant.avatarUrl ? (
                            <AvatarImage src={participant.avatarUrl} />
                          ) : null}
                          <AvatarFallback className="bg-gray-600 text-white">
                            {participant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white truncate">
                              {participant.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {participant.age && (
                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                  {participant.age}
                                </Badge>
                              )}
                              {participant.isMale !== undefined && (
                                <Badge
                                  variant="secondary"
                                  className={
                                    participant.isMale
                                      ? "bg-blue-600 text-white"
                                      : "bg-pink-600 text-white"
                                  }
                                >
                                  {participant.isMale ? "M" : "F"}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {participant.city && (
                            <p className="text-sm text-gray-400">{participant.city}</p>
                          )}
                          {participant.bio && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                              {participant.bio}
                            </p>
                          )}
                          <div className="mt-3">
                            {participant.isLiked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-pink-600 text-pink-400 hover:bg-pink-600 hover:text-white"
                                onClick={() => handleUnlike(participant.id)}
                                disabled={likingUser === participant.id}
                              >
                                {likingUser === participant.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Heart className="w-3 h-3 mr-1 fill-current" />
                                )}
                                Liked
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="text-xs bg-pink-600 hover:bg-pink-700"
                                onClick={() => handleLike(participant.id)}
                                disabled={likingUser === participant.id}
                              >
                                {likingUser === participant.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Heart className="w-3 h-3 mr-1" />
                                )}
                                Like
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="matches">
            <ScrollArea className="h-[50vh] pr-4">
              {loadingMatches ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300">No matches yet</p>
                  <p className="text-gray-500 text-sm">
                    Like other participants to see your matches here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mutual Matches */}
                  {mutualMatches.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center">
                        <Heart className="w-4 h-4 mr-1 fill-current" />
                        Mutual Matches ({mutualMatches.length})
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
                              <h5 className="font-medium text-white truncate">
                                {match.otherProfile.name}
                              </h5>
                              <p className="text-xs text-gray-400 mb-2">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Matched {formatDate(match.matchedAt)}
                              </p>
                              {match.otherProfile.contactInfo && (
                                <Button
                                  size="sm"
                                  className="text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleContact(
                                      match.otherProfile.contactInfo,
                                      match.otherProfile.name
                                    )
                                  }
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Contact
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending Matches */}
                  {pendingMatches.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        Waiting for them ({pendingMatches.length})
                      </h4>
                      {pendingMatches.map((match) => (
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
                              <h5 className="font-medium text-white truncate">
                                {match.otherProfile.name}
                              </h5>
                              <p className="text-xs text-gray-400">
                                Waiting for them to match back
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
