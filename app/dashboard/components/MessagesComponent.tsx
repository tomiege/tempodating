"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, ArrowLeft, Loader2, Sparkles, MapPin } from "lucide-react"
import ProfileModal, { ProfileModalUser } from "@/components/ProfileModal"

interface Conversation {
  partnerId: string
  partnerName: string
  partnerAvatarUrl: string | null
  partnerBio: string | null
  partnerAge: number | null
  partnerCity: string | null
  partnerIsMale: boolean | null
  lastMessage: string
  lastMessageAt: string
  lastMessageFromMe: boolean
  unreadCount: number
}

interface Message {
  id: string
  fromUserId: string
  toUserId: string
  message: string
  isRead: boolean
  createdAt: string
}

interface OtherUser {
  id: string
  name: string
  avatarUrl: string | null
  bio: string | null
  age: number | null
  city: string | null
  isMale: boolean | null
}

interface RecommendedMember {
  id: string
  name: string
  avatarUrl: string | null
  bio: string | null
  age: number | null
  city: string | null
  isMale: boolean | null
}

interface MessagesComponentProps {
  userId: string
  onUnreadCountChange?: (count: number) => void
}

export default function MessagesComponent({ userId, onUnreadCountChange }: MessagesComponentProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [profileModalUser, setProfileModalUser] = useState<ProfileModalUser | null>(null)
  const [recommended, setRecommended] = useState<RecommendedMember[]>([])
  const [recommendedLoading, setRecommendedLoading] = useState(true)
  const [startingChat, setStartingChat] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch inbox conversations
  useEffect(() => {
    fetchInbox()
    fetchRecommended()
  }, [])

  const fetchRecommended = async () => {
    try {
      const response = await fetch("/api/messages/recommended")
      if (response.ok) {
        const data = await response.json()
        setRecommended(data)
      }
    } catch (error) {
      console.error("Error fetching recommended:", error)
    } finally {
      setRecommendedLoading(false)
    }
  }

  const fetchInbox = async () => {
    try {
      const response = await fetch("/api/messages/inbox")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        const unread = data.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0)
        onUnreadCountChange?.(unread)
      }
    } catch (error) {
      console.error("Error fetching inbox:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch thread when a conversation is selected
  const openConversation = async (partnerId: string) => {
    setSelectedPartnerId(partnerId)
    setThreadLoading(true)
    try {
      const response = await fetch(`/api/messages/inbox?withUserId=${partnerId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        setOtherUser(data.otherUser)
      }

      // Mark messages as read
      await fetch("/api/messages/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: partnerId }),
      })

      // Update unread count in conversation list
      setConversations(prev => {
        const updated = prev.map(c =>
          c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
        )
        const unread = updated.reduce((sum, c) => sum + c.unreadCount, 0)
        onUnreadCountChange?.(unread)
        return updated
      })
    } catch (error) {
      console.error("Error fetching conversation:", error)
    } finally {
      setThreadLoading(false)
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartnerId || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedPartnerId,
          message: newMessage.trim(),
        }),
      })

      if (response.ok) {
        const sent = await response.json()
        setMessages(prev => [...prev, {
          id: sent.id,
          fromUserId: sent.from_user_id,
          toUserId: sent.to_user_id,
          message: sent.message,
          isRead: sent.is_read,
          createdAt: sent.created_at,
        }])
        setNewMessage("")

        // Update the conversation list
        setConversations(prev => {
          const existing = prev.find(c => c.partnerId === selectedPartnerId)
          if (existing) {
            return prev.map(c =>
              c.partnerId === selectedPartnerId
                ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: sent.created_at, lastMessageFromMe: true }
                : c
            ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
          }
          return prev
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleStartChat = async (member: RecommendedMember) => {
    setStartingChat(member.id)
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: member.id, message: "Hi! 👋" }),
      })
      if (response.ok) {
        toast({ title: "Message sent!", description: `You started a conversation with ${member.name}` })
        setRecommended(prev => prev.filter(m => m.id !== member.id))
        await fetchInbox()
        setSelectedPartnerId(member.id)
        // Load the thread
        const threadRes = await fetch(`/api/messages/inbox?withUserId=${member.id}`)
        if (threadRes.ok) {
          const data = await threadRes.json()
          setMessages(data.messages)
          setOtherUser(data.otherUser)
        }
      } else {
        const err = await response.json()
        toast({ title: "Error", description: err.error || "Failed to send message", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to start conversation", variant: "destructive" })
    } finally {
      setStartingChat(null)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  // Thread view
  if (selectedPartnerId) {
    return (
      <Card className="border border-border bg-card flex flex-col h-[500px]">
        <CardHeader className="pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground p-1"
              onClick={() => {
                setSelectedPartnerId(null)
                fetchInbox()
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {otherUser && (
              <>
                <button type="button" onClick={() => setProfileModalUser({ id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl, bio: otherUser.bio, age: otherUser.age, city: otherUser.city, isMale: otherUser.isMale })}>
                  <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                    {otherUser.avatarUrl ? (
                      <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                    ) : null}
                    <AvatarFallback className="bg-red-600 text-white text-sm">
                      {otherUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button type="button" onClick={() => setProfileModalUser({ id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl, bio: otherUser.bio, age: otherUser.age, city: otherUser.city, isMale: otherUser.isMale })}>
                  <CardTitle className="text-foreground text-base hover:text-red-500 cursor-pointer transition-colors">{otherUser.name}</CardTitle>
                </button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {threadLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.fromUserId === userId
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isMe
                              ? "bg-red-600 text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isMe ? "text-red-200" : "text-muted-foreground"}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none min-h-[40px] max-h-[100px]"
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="bg-red-600 hover:bg-red-700 text-white self-end"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <ProfileModal
          user={profileModalUser}
          isOpen={!!profileModalUser}
          onClose={() => setProfileModalUser(null)}
        />
      </Card>
    )
  }

  // Inbox view
  return (
    <>
    {/* Recommended members section */}
    {!recommendedLoading && recommended.length > 0 && (
      <Card className="border border-border bg-card mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-sm flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-red-500" />
            Recommended verified members nearby
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommended.map((member) => (
              <div key={member.id} className="flex-shrink-0 w-32 flex flex-col items-center text-center gap-1.5 p-3 rounded-lg border border-border bg-muted/50">
                <button type="button" onClick={() => setProfileModalUser(member)}>
                  <Avatar className="w-14 h-14 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-red-600 text-white text-lg">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button type="button" onClick={() => setProfileModalUser(member)} className="hover:text-red-500 transition-colors">
                  <p className="text-xs font-medium text-foreground truncate w-full">{member.name}</p>
                </button>
                {member.city && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />{member.city}
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={() => handleStartChat(member)}
                  disabled={startingChat === member.id}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3 mt-1"
                >
                  {startingChat === member.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>Say hi 👋</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Messages
          {totalUnread > 0 && (
            <Badge className="ml-2 bg-red-600 text-white text-xs">
              {totalUnread}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground mb-2">No messages yet</p>
            <p className="text-muted-foreground text-sm">
              Start a conversation with one of your matches!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => openConversation(conv.partnerId)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setProfileModalUser({ id: conv.partnerId, name: conv.partnerName, avatarUrl: conv.partnerAvatarUrl, bio: conv.partnerBio, age: conv.partnerAge, city: conv.partnerCity, isMale: conv.partnerIsMale })
                  }}
                  className="flex-shrink-0"
                >
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-red-500 transition-all">
                    {conv.partnerAvatarUrl ? (
                      <AvatarImage src={conv.partnerAvatarUrl} alt={conv.partnerName} />
                    ) : null}
                    <AvatarFallback className="bg-red-600 text-white">
                      {conv.partnerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-foreground"}`}>
                      {conv.partnerName}
                    </h5>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {conv.lastMessageFromMe ? "You: " : ""}{conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="ml-2 bg-red-600 text-white text-xs h-5 min-w-[20px] flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    <ProfileModal
      user={profileModalUser}
      isOpen={!!profileModalUser}
      onClose={() => setProfileModalUser(null)}
    />
    </>
  )
}
