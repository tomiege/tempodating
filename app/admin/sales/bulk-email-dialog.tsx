'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react'
import { EMAIL_TEMPLATES, type TemplateId } from './send-zoom-email-button'

export interface BulkSelectedProduct {
  productId: number
  city: string
  maleCount: number
  femaleCount: number
  total: number
}

type Audience = 'males' | 'females' | 'all' | 'leads'

type RowStatus = 'pending' | 'sending' | 'success' | 'error'

interface BulkEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selected: BulkSelectedProduct[]
}

export function BulkEmailDialog({ open, onOpenChange, selected }: BulkEmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('event-postponed')
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<Record<number, { status: RowStatus; message: string }>>({})

  const currentTemplate = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate)!

  const totalMales = selected.reduce((sum, p) => sum + p.maleCount, 0)
  const totalFemales = selected.reduce((sum, p) => sum + p.femaleCount, 0)
  const totalAll = selected.reduce((sum, p) => sum + p.total, 0)

  function resetResults() {
    setResults({})
  }

  async function sendBulk(audience: Audience) {
    setSending(true)
    // Seed every selected product as pending so the user sees the full queue.
    setResults(Object.fromEntries(selected.map((p) => [p.productId, { status: 'pending' as RowStatus, message: 'Queued' }])))

    for (const p of selected) {
      setResults((prev) => ({ ...prev, [p.productId]: { status: 'sending', message: 'Sending…' } }))
      try {
        const res = await fetch('/api/send-zoom-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: p.productId, audience, template: selectedTemplate }),
        })
        const data = await res.json()
        if (!res.ok) {
          setResults((prev) => ({ ...prev, [p.productId]: { status: 'error', message: data.error || 'Failed to send' } }))
        } else {
          setResults((prev) => ({
            ...prev,
            [p.productId]: {
              status: 'success',
              message: `Sent ${data.sent}/${data.total}${data.failed ? ` (${data.failed} failed)` : ''}`,
            },
          }))
        }
      } catch {
        setResults((prev) => ({ ...prev, [p.productId]: { status: 'error', message: 'Network error' } }))
      }
    }

    setSending(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) resetResults()
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Email — {selected.length} event{selected.length === 1 ? '' : 's'}</DialogTitle>
          <DialogDescription>
            Sends the selected template to every chosen product in one go. Each product&apos;s recipients and
            city are resolved server-side (city in emails uses the buyer&apos;s query city).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Selected products summary */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Selected products ({totalAll} attendees total)</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((p) => (
                <span key={p.productId} className="inline-flex items-center gap-1 rounded-md bg-background border px-2 py-0.5 text-xs">
                  <span className="font-medium">#{p.productId}</span>
                  {p.city && <span className="text-muted-foreground">{p.city}</span>}
                  <span className="text-muted-foreground">({p.total})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Template selector */}
          <div className="grid grid-cols-2 gap-2">
            {EMAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => { setSelectedTemplate(tpl.id); resetResults() }}
                disabled={sending}
                className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-50 ${
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
            <pre className="px-3 py-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground font-sans max-h-40 overflow-y-auto">
              {currentTemplate.previewBody}
            </pre>
          </div>

          {/* Send buttons (audience depends on template) */}
          {selectedTemplate === 'leads-reminder' ? (
            <Button
              variant="outline"
              onClick={() => sendBulk('leads')}
              disabled={sending}
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Send to Unpaid Leads of {selected.length} event{selected.length === 1 ? '' : 's'}
            </Button>
          ) : selectedTemplate === 'next-event' || selectedTemplate === 'complimentary-ticket' ? (
            <Button
              variant="outline"
              onClick={() => sendBulk('all')}
              disabled={sending || totalAll === 0}
              className="w-full"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Send to All Attendees ({totalAll}) across {selected.length} event{selected.length === 1 ? '' : 's'}
            </Button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => sendBulk('males')}
                disabled={sending || totalMales === 0}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Males ({totalMales})
              </Button>
              <Button
                variant="outline"
                onClick={() => sendBulk('females')}
                disabled={sending || totalFemales === 0}
                className="text-pink-600 border-pink-200 hover:bg-pink-50"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Females ({totalFemales})
              </Button>
              <Button
                variant="outline"
                onClick={() => sendBulk('all')}
                disabled={sending || totalAll === 0}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                ALL ({totalAll})
              </Button>
            </div>
          )}

          {sending && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              Sending to each event in sequence… keep this dialog open.
            </div>
          )}

          {/* Per-product results */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-1.5">
              {selected.map((p) => {
                const r = results[p.productId]
                if (!r) return null
                return (
                  <div
                    key={p.productId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs border ${
                      r.status === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : r.status === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-muted/40 text-muted-foreground border-transparent'
                    }`}
                  >
                    {r.status === 'success' ? (
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : r.status === 'error' ? (
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : r.status === 'sending' ? (
                      <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className="font-medium">#{p.productId}</span>
                    {p.city && <span className="opacity-70">{p.city}</span>}
                    <span className="ml-auto text-right">{r.message}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
