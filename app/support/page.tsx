'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDot,
} from 'lucide-react'

interface Ticket {
  id: string
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  open: { label: 'Open', variant: 'default', icon: <CircleDot className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
  resolved: { label: 'Resolved', variant: 'outline', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed: { label: 'Closed', variant: 'outline', icon: <AlertCircle className="w-3 h-3" /> },
}

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // New ticket form
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reply
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (user) fetchTickets()
  }, [user])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      if (res.ok) {
        setTickets(await res.json())
      }
    } catch {
      console.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const openTicketDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setView('detail')
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/support/${ticket.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' })
    } finally {
      setMessagesLoading(false)
    }
  }

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })
      if (res.ok) {
        toast({ title: 'Ticket created', description: "We'll get back to you soon." })
        setSubject('')
        setMessage('')
        setView('list')
        fetchTickets()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create ticket', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
      if (res.ok) {
        setReply('')
        // Refresh messages
        const detailRes = await fetch(`/api/support/${selectedTicket.id}`)
        if (detailRes.ok) {
          const data = await detailRes.json()
          setMessages(data.messages)
          setSelectedTicket(data.ticket)
        }
      } else {
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </section>
        <Footer />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Support</h1>
            <p className="text-muted-foreground mb-6">Please log in to access support.</p>
            <Button asChild>
              <a href="/login?redirect=/support">Log In</a>
            </Button>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* List View */}
          {view === 'list' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
                    Support
                  </h1>
                  <p className="text-muted-foreground mt-1">Get help with your account or events</p>
                </div>
                <Button onClick={() => setView('new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </div>

              <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-muted/50 border border-border">
                <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Support is handled via tickets, not live chat. We typically respond within <span className="font-medium text-foreground">24 hours</span>. You'll be able to see our reply here when we respond.</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No support tickets yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setView('new')}>
                      Create your first ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => {
                    const sc = statusConfig[ticket.status] || statusConfig.open
                    return (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => openTicketDetail(ticket)}
                      >
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-sm text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                              </p>
                              {ticket.last_admin_reply ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Staff replied
                                </span>
                              ) : ticket.status === 'open' || ticket.status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  Awaiting reply
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <Badge variant={sc.variant} className="ml-4 flex items-center gap-1">
                            {sc.icon}
                            {sc.label}
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* New Ticket View */}
          {view === 'new' && (
            <>
              <Button variant="ghost" className="mb-4" onClick={() => setView('list')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to tickets
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle>New Support Ticket</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Describe your issue below and our team will get back to you, usually within 24 hours.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createTicket} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                      <Input
                        placeholder="e.g. Issue with my booking"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        maxLength={200}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Describe your issue</label>
                      <Textarea
                        placeholder="Tell us what's going on and how we can help..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={5}
                        maxLength={5000}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                      ) : (
                        'Submit Ticket'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {/* Ticket Detail View */}
          {view === 'detail' && selectedTicket && (
            <>
              <Button variant="ghost" className="mb-4" onClick={() => { setView('list'); setSelectedTicket(null); setMessages([]) }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to tickets
              </Button>

              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <Badge variant={statusConfig[selectedTicket.status]?.variant || 'default'} className="flex items-center gap-1 shrink-0">
                      {statusConfig[selectedTicket.status]?.icon}
                      {statusConfig[selectedTicket.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Opened {new Date(selectedTicket.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </CardHeader>
              </Card>

              {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0" />
                  This is not live chat. Our team typically responds within 24 hours.
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3 mb-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.is_admin
                          ? 'bg-card border border-border'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                        {msg.is_admin && (
                          <p className="text-xs font-medium text-primary mb-1">Tempo Support</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1.5 ${msg.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                          {new Date(msg.created_at).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply box */}
              {selectedTicket.status !== 'closed' && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        rows={2}
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
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
