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
import { Heart, Loader2, X, User, Calendar, Check, MessageCircle, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProfileModal, { ProfileModalUser } from "@/components/ProfileModal"

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
    email: string
    bio: string
    avatarUrl: string
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
  const [messagingUser, setMessagingUser] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [existingChatPartners, setExistingChatPartners] = useState<Set<string>>(new Set())
  const [profileModalUser, setProfileModalUser] = useState<ProfileModalUser | null>(null)
  const [postLikeMessageUser, setPostLikeMessageUser] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && productId) {
      fetchParticipants()
      fetchMatches()
      fetchExistingChats()
    }
  }, [isOpen, productId])

  const fetchExistingChats = async () => {
    try {
      const response = await fetch("/api/messages/inbox")
      if (response.ok) {
        const data = await response.json()
        setExistingChatPartners(new Set(data.map((c: { partnerId: string }) => c.partnerId)))
      }
    } catch (error) {
      console.error("Error fetching existing chats:", error)
    }
  }

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

        // Show optional message prompt after liking (unless already chatting)
        if (!existingChatPartners.has(participantId)) {
          setPostLikeMessageUser(participantId)
          setMessageText("")
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

  const handleSendMessage = async (toUserId: string) => {
    if (!messageText.trim() || sendingMessage) return
    setSendingMessage(true)
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, message: messageText.trim() }),
      })
      if (response.ok) {
        toast({ title: "Message sent!", description: "Check your Messages tab to continue the conversation." })
        setMessageText("")
        setMessagingUser(null)
        setPostLikeMessageUser(null)
        setExistingChatPartners(prev => new Set([...prev, toUserId]))
      } else {
        const err = await response.json()
        toast({ title: "Error", description: err.error || "Failed to send message", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    } finally {
      setSendingMessage(false)
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
                        <button type="button" onClick={() => setProfileModalUser({ id: participant.id, name: participant.name, avatarUrl: participant.avatarUrl, bio: participant.bio, age: participant.age, city: participant.city, isMale: participant.isMale })} className="flex-shrink-0">
                          <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                            {participant.avatarUrl ? (
                              <AvatarImage src={participant.avatarUrl} />
                            ) : null}
                            <AvatarFallback className="bg-gray-600 text-white">
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <button type="button" onClick={() => setProfileModalUser({ id: participant.id, name: participant.name, avatarUrl: participant.avatarUrl, bio: participant.bio, age: participant.age, city: participant.city, isMale: participant.isMale })} className="text-left">
                              <h4 className="font-medium text-white truncate hover:text-red-400 cursor-pointer transition-colors">
                                {participant.name}
                              </h4>
                            </button>
                            <div className="flex items-center gap-2">
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
                          {participant.bio && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                              {participant.bio}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            {participant.isLiked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-pink-600 text-pink-400 hover:bg-pink-600 hover:text-white"
                                onClick={() => { handleUnlike(participant.id); setPostLikeMessageUser(null); setMessageText("") }}
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
                            {existingChatPartners.has(participant.id) && (
                              <span className="text-xs text-gray-400 flex items-center">
                                <Check className="w-3 h-3 mr-1" />
                                Message sent
                              </span>
                            )}
                          </div>
                          {postLikeMessageUser === participant.id && !existingChatPartners.has(participant.id) && (
                            <div className="mt-3 space-y-2 bg-gray-700/50 rounded-lg p-3">
                              <p className="text-xs text-gray-300">
                                <MessageCircle className="w-3 h-3 inline mr-1" />
                                Want to leave {participant.name} a message?
                              </p>
                              <Textarea
                                placeholder={`Write a message to ${participant.name}...`}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage(participant.id)
                                  }
                                }}
                                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 resize-none text-sm min-h-[60px]"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-gray-400"
                                  onClick={() => { setPostLikeMessageUser(null); setMessageText("") }}
                                >
                                  Skip
                                </Button>
                                <Button
                                  size="sm"
                                  className="text-xs bg-red-600 hover:bg-red-700"
                                  onClick={() => handleSendMessage(participant.id)}
                                  disabled={!messageText.trim() || sendingMessage}
                                >
                                  {sendingMessage ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Send className="w-3 h-3 mr-1" />
                                  )}
                                  Send
                                </Button>
                              </div>
                            </div>
                          )}
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
                            <button type="button" onClick={() => setProfileModalUser({ id: match.otherProfile.id, name: match.otherProfile.name, avatarUrl: match.otherProfile.avatarUrl, bio: match.otherProfile.bio })} className="flex-shrink-0">
                              <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                                {match.otherProfile.avatarUrl ? (
                                  <AvatarImage src={match.otherProfile.avatarUrl} alt={match.otherProfile.name} />
                                ) : null}
                                <AvatarFallback className="bg-green-600 text-white">
                                  {match.otherProfile.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="flex-1 min-w-0">
                              <button type="button" onClick={() => setProfileModalUser({ id: match.otherProfile.id, name: match.otherProfile.name, avatarUrl: match.otherProfile.avatarUrl, bio: match.otherProfile.bio })} className="text-left">
                                <h5 className="font-medium text-white truncate hover:text-red-400 cursor-pointer transition-colors">
                                  {match.otherProfile.name}
                                </h5>
                              </button>
                              <p className="text-xs text-gray-400 mb-2">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Matched {formatDate(match.matchedAt)}
                              </p>
                              {match.otherProfile.bio && (
                                <div className="mt-2 pt-2 border-t border-green-700/50">
                                  <p className="text-xs font-medium text-gray-400 mb-1">Bio</p>
                                  <p className="text-sm text-gray-300 whitespace-pre-line break-words">
                                    {match.otherProfile.bio}
                                  </p>
                                </div>
                              )}
                              {match.otherProfile.email && (
                                <div className="mt-2 pt-2 border-t border-green-700/50">
                                  <p className="text-xs font-medium text-gray-400 mb-1">Email</p>
                                  <a href={`mailto:${match.otherProfile.email}`} className="text-sm text-green-400 hover:underline break-all">
                                    {match.otherProfile.email}
                                  </a>
                                </div>
                              )}
                              {match.otherProfile.contactInfo && (
                                <div className="mt-2 pt-2 border-t border-green-700/50">
                                  <p className="text-xs font-medium text-gray-400 mb-1">Contact</p>
                                  <p className="text-sm text-gray-300 whitespace-pre-line break-words">
                                    {match.otherProfile.contactInfo}
                                  </p>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-green-700/50">
                                {existingChatPartners.has(match.otherProfile.id) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-gray-500 text-gray-400 cursor-default opacity-60"
                                    disabled
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Chatting
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-red-500 text-red-400 hover:bg-red-600 hover:text-white"
                                    onClick={() => setMessagingUser(messagingUser === match.otherProfile.id ? null : match.otherProfile.id)}
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    Message
                                  </Button>
                                )}
                              </div>
                              {messagingUser === match.otherProfile.id && !existingChatPartners.has(match.otherProfile.id) && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    placeholder={`Write a message to ${match.otherProfile.name}...`}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage(match.otherProfile.id)
                                      }
                                    }}
                                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 resize-none text-sm min-h-[60px]"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-gray-400"
                                      onClick={() => { setMessagingUser(null); setMessageText("") }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                  className="text-xs bg-red-600 hover:bg-red-700"
                                      onClick={() => handleSendMessage(match.otherProfile.id)}
                                      disabled={!messageText.trim() || sendingMessage}
                                    >
                                      {sendingMessage ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      ) : (
                                        <Send className="w-3 h-3 mr-1" />
                                      )}
                                      Send
                                    </Button>
                                  </div>
                                </div>
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
      <ProfileModal
        user={profileModalUser}
        isOpen={!!profileModalUser}
        onClose={() => setProfileModalUser(null)}
      />
    </Dialog>
  )
}
