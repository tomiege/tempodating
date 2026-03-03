'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface SendZoomEmailButtonProps {
  productId: number
  maleEmails: string[]
  femaleEmails: string[]
}

type SendStatus = {
  type: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

type TemplateId = 'pre-event' | 'post-event'

interface EmailTemplate {
  id: TemplateId
  label: string
  subject: string
  previewBody: string
}

const DASHBOARD_URL = 'https://www.tempodating.com/dashboard'

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'pre-event',
    label: '📹 Pre-Event (Zoom Link)',
    subject: 'Your online Speed Dating event is starting soon!',
    previewBody: `Hi there,

Your online Speed Dating event is starting shortly!

If you haven't already, please click here to get your Zoom Link to join the event!

[Join Zoom Meeting]

We look forward to seeing you!`,
  },
  {
    id: 'post-event',
    label: '💕 Post-Event (Select Matches)',
    subject: 'Thank you for attending! Select your matches 💕',
    previewBody: `Hi there,

Thank you for attending the event! We hope you had a great time.

Please select your matches on your User Dashboard — it's quick and easy!

[Go to Dashboard — ${DASHBOARD_URL}]

While you're there:
Please make sure to fill in your profile including your profile picture, bio, and contact details to share a little more about yourself with your matches.

Good luck! 🤞`,
  },
]

interface CheckoutSession {
  checkout_session_id: string
  email: string
  is_male: boolean | null
}

export function SendZoomEmailButton({ productId, maleEmails, femaleEmails }: SendZoomEmailButtonProps) {
  const [open, setOpen] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [status, setStatus] = useState<SendStatus>({ type: 'idle', message: '' })
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('pre-event')
  const [checkoutSessions, setCheckoutSessions] = useState<CheckoutSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const totalEmails = maleEmails.length + femaleEmails.length
  const currentTemplate = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate)!

  // Fetch checkout sessions when modal opens
  useEffect(() => {
    if (!open) return
    setSessionsLoading(true)
    fetch(`/api/send-zoom-email/sessions?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        const sessions: CheckoutSession[] = data.sessions || []
        setCheckoutSessions(sessions)
        if (sessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(sessions[0].checkout_session_id)
        }
      })
      .catch(() => setCheckoutSessions([]))
      .finally(() => setSessionsLoading(false))
  }, [open, productId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendEmails(audience: 'males' | 'females' | 'all' | 'test') {
    setStatus({ type: 'loading', message: 'Sending...' })

    try {
      const body: Record<string, unknown> = { productId, audience, template: selectedTemplate }

      if (audience === 'test') {
        if (!testEmail) {
          setStatus({ type: 'error', message: 'Please enter a test email' })
          return
        }
        body.testEmail = testEmail
        if (selectedTemplate === 'post-event' && selectedSessionId) {
          body.testCheckoutSessionId = selectedSessionId
        }
      }

      const res = await fetch('/api/send-zoom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to send' })
        return
      }

      if (audience === 'test') {
        setStatus({ type: 'success', message: `Test email sent to ${testEmail}` })
      } else {
        setStatus({
          type: 'success',
          message: `Sent ${data.sent}/${data.total} emails${data.failed ? ` (${data.failed} failed)` : ''}`,
        })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStatus({ type: 'idle', message: '' }) }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          title="Send email to attendees"
        >
          <Mail className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to Attendees</DialogTitle>
          <DialogDescription>
            Product #{productId} — {maleEmails.length}M / {femaleEmails.length}F ({totalEmails} total)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Template selector */}
          <div className="grid grid-cols-2 gap-2">
            {EMAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => { setSelectedTemplate(tpl.id); setStatus({ type: 'idle', message: '' }) }}
                className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  selectedTemplate === tpl.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          {/* Email preview */}
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/50">
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="text-sm font-medium">{currentTemplate.subject}</p>
            </div>
            <pre className="px-3 py-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground font-sans max-h-48 overflow-y-auto">
              {currentTemplate.previewBody}
            </pre>
          </div>

          {/* Send to audience buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => sendEmails('males')}
              disabled={status.type === 'loading' || maleEmails.length === 0}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Males ({maleEmails.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => sendEmails('females')}
              disabled={status.type === 'loading' || femaleEmails.length === 0}
              className="text-pink-600 border-pink-200 hover:bg-pink-50"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Females ({femaleEmails.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => sendEmails('all')}
              disabled={status.type === 'loading' || totalEmails === 0}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              ALL ({totalEmails})
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or send a test</span>
            </div>
          </div>

          {/* Test email */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={status.type === 'loading'}
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={() => sendEmails('test')}
                disabled={status.type === 'loading' || !testEmail || (selectedTemplate === 'post-event' && !selectedSessionId)}
              >
                {status.type === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Send Test'
                )}
              </Button>
            </div>
            {selectedTemplate === 'post-event' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Checkout:</span>
                {sessionsLoading ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                  </div>
                ) : checkoutSessions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No checkouts found</span>
                ) : (
                  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="Select a checkout" />
                    </SelectTrigger>
                    <SelectContent>
                      {checkoutSessions.map((s) => (
                        <SelectItem key={s.checkout_session_id} value={s.checkout_session_id} className="text-xs">
                          {s.email} ({s.is_male ? 'M' : 'F'}) — {s.checkout_session_id.slice(0, 20)}…
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Status message */}
          {status.type !== 'idle' && status.type !== 'loading' && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {status.message}
            </div>
          )}

          {status.type === 'loading' && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              Sending emails...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
