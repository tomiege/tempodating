'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Search,
  Inbox,
  Sparkles,
  User,
  ShoppingCart,
  Reply,
} from 'lucide-react'

interface Ticket {
  id: string
  user_id: string
  user_email: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  last_admin_reply?: boolean
}

interface Message {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_admin: boolean
  created_at: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  age: number | null
  city: string | null
  country: string | null
  bio: string | null
  contact_info: string | null
  is_male: boolean | null
  avatar_url: string | null
  personality_quiz_result: Record<string, unknown> | null
  created_at: string
}

interface Checkout {
  checkout_id: number
  product_type: string
  product_id: number
  product_description: string | null
  total_order: number
  checkout_time: string
  email: string
  name: string | null
  is_male: boolean | null
  query_city: string | null
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  open: { label: 'Open', variant: 'default', icon: <CircleDot className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
  resolved: { label: 'Resolved', variant: 'outline', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: 'Closed', variant: 'outline', icon: <AlertCircle className="w-3 h-3" /> },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  normal: { label: 'Normal', color: 'text-foreground' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600 font-semibold' },
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export default function AdminSupportPage() {
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [persistentPrompt, setPersistentPrompt] = useState('')
  const [ticketPrompt, setTicketPrompt] = useState('')
  const [showPrompts, setShowPrompts] = useState(false)

  // Load persistent prompt from cookie on mount
  useEffect(() => {
    setPersistentPrompt(getCookie('support_persistent_prompt'))
  }, [])

  // Load ticket-specific prompt when ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setTicketPrompt(getCookie(`support_ticket_prompt_${selectedTicket.id}`))
    } else {
      setTicketPrompt('')
    }
  }, [selectedTicket?.id])

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ all: 'true' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/support?${params}`)
      if (res.ok) {
        setTickets(await res.json())
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch tickets', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setMessagesLoading(true)
    setUserProfile(null)
    setCheckouts([])
    try {
      const res = await fetch(`/api/support/${ticket.id}?admin=true`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        setSelectedTicket(data.ticket)
        if (data.profile) setUserProfile(data.profile)
        if (data.checkouts) setCheckouts(data.checkouts)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load ticket', variant: 'destructive' })
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim(), isAdmin: true }),
      })
      if (res.ok) {
        setReply('')
        // Refresh
        const detailRes = await fetch(`/api/support/${selectedTicket.id}?admin=true`)
        if (detailRes.ok) {
          const data = await detailRes.json()
          setMessages(data.messages)
          setSelectedTicket(data.ticket)
        }
        fetchTickets()
      } else {
        toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const suggestReply = async () => {
    if (!selectedTicket || messages.length === 0) return
    setSuggesting(true)
    try {
      const res = await fetch('/api/support/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedTicket.subject,
          messages: messages.map(m => ({ is_admin: m.is_admin, message: m.message })),
          profile: userProfile ? {
            name: userProfile.full_name,
            email: userProfile.email,
            age: userProfile.age,
            city: userProfile.city,
            country: userProfile.country,
            gender: userProfile.is_male === true ? 'male' : userProfile.is_male === false ? 'female' : null,
            memberSince: userProfile.created_at,
          } : null,
          checkouts: checkouts.map(c => ({
            product: c.product_description || c.product_type,
            amount: c.total_order,
            date: c.checkout_time,
          })),
          persistentPrompt: persistentPrompt.trim() || undefined,
          ticketPrompt: ticketPrompt.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setReply(data.suggestion)
      } else {
        toast({ title: 'Error', description: 'Failed to generate suggestion', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'AI service unavailable', variant: 'destructive' })
    } finally {
      setSuggesting(false)
    }
  }

  const updateTicket = async (field: 'status' | 'priority', value: string) => {
    if (!selectedTicket) return
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSelectedTicket(updated)
        fetchTickets()
        toast({ title: 'Updated', description: `Ticket ${field} set to ${value.replace('_', ' ')}` })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' })
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'needs_reply') {
      if (t.status === 'closed' || t.status === 'resolved') return false
      if (t.last_admin_reply) return false
    } else if (statusFilter && statusFilter !== 'all') {
      if (t.status !== statusFilter) return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.subject.toLowerCase().includes(q) ||
      t.user_email.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    )
  })

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    needs_reply: tickets.filter(t => !t.last_admin_reply && t.status !== 'closed' && t.status !== 'resolved').length,
  }

  // Detail view
  if (selectedTicket) {
    return (
      <div className="container mx-auto py-10 max-w-4xl space-y-4">
        <Button variant="ghost" onClick={() => { setSelectedTicket(null); setMessages([]); setUserProfile(null); setCheckouts([]) }}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to tickets
        </Button>

        {/* Ticket header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl mb-1">{selectedTicket.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  From <span className="font-medium text-foreground">{selectedTicket.user_email}</span>
                  {' · '}
                  {new Date(selectedTicket.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {selectedTicket.id}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={selectedTicket.status} onValueChange={v => updateTicket('status', v)}>
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <Select value={selectedTicket.priority} onValueChange={v => updateTicket('priority', v)}>
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User Profile & Checkouts */}
        {(userProfile || checkouts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile */}
            {userProfile && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  {userProfile.full_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{userProfile.full_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{userProfile.email}</span>
                  </div>
                  {userProfile.age && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age</span>
                      <span>{userProfile.age}</span>
                    </div>
                  )}
                  {userProfile.is_male !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender</span>
                      <span>{userProfile.is_male ? 'Male' : 'Female'}</span>
                    </div>
                  )}
                  {(userProfile.city || userProfile.country) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span>{[userProfile.city, userProfile.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {userProfile.contact_info && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact</span>
                      <span>{userProfile.contact_info}</span>
                    </div>
                  )}
                  {userProfile.bio && (
                    <div className="pt-1">
                      <span className="text-muted-foreground">Bio</span>
                      <p className="mt-0.5 text-xs">{userProfile.bio}</p>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-xs">{new Date(userProfile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Checkouts */}
            {checkouts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Purchase History ({checkouts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {checkouts.map(c => (
                      <div key={c.checkout_id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-xs">{c.product_description || c.product_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.checkout_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="text-xs font-medium ml-3 shrink-0">
                          {c.total_order > 0 ? `£${Number(c.total_order).toFixed(2)}` : 'Free'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Messages */}
        <Card>
          <CardContent className="pt-4">
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.is_admin
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className={`text-xs font-medium mb-1 ${msg.is_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {msg.is_admin ? 'You (Admin)' : selectedTicket.user_email}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1.5 ${msg.is_admin ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Reply */}
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {/* Prompt controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={suggestReply}
                  disabled={suggesting || messages.length === 0}
                  className="text-xs"
                >
                  {suggesting ? (
                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-3 h-3 mr-1.5" /> AI Suggest Reply</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="text-xs text-muted-foreground"
                >
                  {showPrompts ? 'Hide' : 'Show'} AI Prompts
                </Button>
                {reply.trim() && (
                  <span className="text-xs text-muted-foreground ml-auto">Edit the suggestion or write your own</span>
                )}
              </div>

              {showPrompts && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground">Persistent Prompt <span className="font-normal">(applies to all tickets)</span></label>
                    </div>
                    <Textarea
                      placeholder="e.g. Always be very concise. Use a warm, friendly tone. Sign off with just your first name."
                      value={persistentPrompt}
                      onChange={e => {
                        setPersistentPrompt(e.target.value)
                        setCookie('support_persistent_prompt', e.target.value)
                      }}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-muted-foreground">Ticket Prompt <span className="font-normal">(this ticket only)</span></label>
                    </div>
                    <Textarea
                      placeholder="e.g. This customer is upset, be extra apologetic. Offer a free event."
                      value={ticketPrompt}
                      onChange={e => {
                        setTicketPrompt(e.target.value)
                        if (selectedTicket) {
                          setCookie(`support_ticket_prompt_${selectedTicket.id}`, e.target.value)
                        }
                      }}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply or use AI suggest..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={3}
                  maxLength={5000}
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} size="icon" className="shrink-0 self-end">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List view
  return (
    <div className="container mx-auto py-10 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage and respond to customer support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{counts.all}</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-primary/30 transition-colors ${statusFilter === 'needs_reply' ? 'border-red-300 bg-red-50/50' : ''}`} onClick={() => setStatusFilter('needs_reply')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1"><Reply className="w-3.5 h-3.5" /> Needs Reply</p>
            <p className="text-2xl font-bold text-red-600">{counts.needs_reply}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('open')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-2xl font-bold text-blue-600">{counts.open}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{counts.in_progress}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('resolved')}>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, email, or ticket ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="needs_reply">Needs Reply</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => {
                  const sc = statusConfig[ticket.status] || statusConfig.open
                  const pc = priorityConfig[ticket.priority] || priorityConfig.normal
                  return (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openTicket(ticket)}
                    >
                      <TableCell className="font-medium max-w-[250px] truncate">
                        <span className="flex items-center gap-2">
                          {ticket.subject}
                          {!ticket.last_admin_reply && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                              Needs reply
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{ticket.user_email}</TableCell>
                      <TableCell>
                        <Badge variant={sc.variant} className="flex items-center gap-1 w-fit">
                          {sc.icon}
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-sm ${pc.color}`}>
                        {pc.label}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {timeAgo(ticket.updated_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
