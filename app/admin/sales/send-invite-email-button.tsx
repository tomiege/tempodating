'use client'

import { useState } from 'react'
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
import { Gift, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface SendInviteEmailButtonProps {
  productId: number
  maleEmails: string[]
  femaleEmails: string[]
}

type SendStatus = {
  type: 'idle' | 'loading' | 'success' | 'error'
  message: string
}

export function SendInviteEmailButton({ productId, maleEmails, femaleEmails }: SendInviteEmailButtonProps) {
  const [open, setOpen] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [status, setStatus] = useState<SendStatus>({ type: 'idle', message: '' })
  const [inviteGender, setInviteGender] = useState<'female' | 'male'>('female')

  const totalEmails = maleEmails.length + femaleEmails.length
  const genderLabel = inviteGender === 'female' ? 'Female' : 'Male'

  async function sendInviteEmails(audience: 'males' | 'females' | 'both' | 'test') {
    setStatus({ type: 'loading', message: 'Creating redemption code & sending emails...' })

    try {
      const body: Record<string, unknown> = { productId, audience, inviteGender }
      if (audience === 'test') {
        if (!testEmail) {
          setStatus({ type: 'error', message: 'Please enter a test email' })
          return
        }
        body.testEmail = testEmail
      }

      const res = await fetch('/api/send-invite-email', {
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
        setStatus({ type: 'success', message: `Test invite email sent to ${testEmail}` })
      } else {
        setStatus({
          type: 'success',
          message: `Sent ${data.sent}/${data.total} invite emails${data.failed ? ` (${data.failed} failed)` : ''}. Redemption code created for ${genderLabel}.`,
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
          title="Send invite-a-friend email"
        >
          <Gift className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite-a-Friend Email</DialogTitle>
          <DialogDescription>
            Product #{productId} — {maleEmails.length}M / {femaleEmails.length}F ({totalEmails} total)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1: Pick the invite gender (who the free ticket is for) */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Free ticket is for:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setInviteGender('female'); setStatus({ type: 'idle', message: '' }) }}
                className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  inviteGender === 'female'
                    ? 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                👩 Female Friend
              </button>
              <button
                onClick={() => { setInviteGender('male'); setStatus({ type: 'idle', message: '' }) }}
                className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  inviteGender === 'male'
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                👨 Male Friend
              </button>
            </div>
          </div>

          {/* Email preview */}
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/50">
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="text-sm font-medium">Invite a {genderLabel} Friend to Speed Dating — Free Spot! 🎁</p>
            </div>
            <div className="px-3 py-3 text-xs leading-relaxed text-muted-foreground font-sans space-y-2">
              <p>Hi there,</p>
              <p>Thank you for signing up to our upcoming Speed Dating event! 🎉</p>
              <div className={`rounded-md p-2 text-center ${inviteGender === 'female' ? 'bg-pink-50 border border-pink-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`font-bold ${inviteGender === 'female' ? 'text-pink-700' : 'text-blue-700'}`}>
                  {inviteGender === 'female' ? '👩' : '👨'} We have 1 spot available for a {genderLabel}!
                </p>
                <p className={inviteGender === 'female' ? 'text-pink-600' : 'text-blue-600'}>
                  If you&apos;d like to invite a <strong>{inviteGender} friend</strong>, share this link with {inviteGender === 'female' ? 'her' : 'him'} — it&apos;s a <strong>free ticket</strong>, on us!
                </p>
              </div>
              <p className="text-center">[Invite a {genderLabel} Friend]</p>
              <p>Simply forward this email or share the link with your friend. First come, first served!</p>
            </div>
          </div>

          {/* Step 2: Pick who to send it to */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Send to:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => sendInviteEmails('males')}
                disabled={status.type === 'loading' || maleEmails.length === 0}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Males ({maleEmails.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => sendInviteEmails('females')}
                disabled={status.type === 'loading' || femaleEmails.length === 0}
                className="text-pink-600 border-pink-200 hover:bg-pink-50"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Females ({femaleEmails.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => sendInviteEmails('both')}
                disabled={status.type === 'loading' || totalEmails === 0}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Both ({totalEmails})
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Everyone who receives the email gets a link for a free <strong>{genderLabel}</strong> ticket to share.
            </p>
          </div>

          {/* Test send */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Test send</p>
            <div className="flex gap-2">
              <Input
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendInviteEmails('test')}
                disabled={status.type === 'loading' || !testEmail}
              >
                Test
              </Button>
            </div>
          </div>

          {/* Status */}
          {status.type !== 'idle' && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              status.type === 'loading' ? 'bg-muted/50' :
              status.type === 'success' ? 'bg-green-50 text-green-700' :
              'bg-red-50 text-red-700'
            }`}>
              {status.type === 'loading' && <Loader2 className="h-4 w-4 animate-spin mt-0.5 flex-shrink-0" />}
              {status.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              {status.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
