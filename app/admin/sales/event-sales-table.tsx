'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Mail, X } from 'lucide-react'
import { CopyEmailsButton } from './copy-emails-button'
import { SendZoomEmailButton } from './send-zoom-email-button'
import { SendInviteEmailButton } from './send-invite-email-button'
import { BulkEmailDialog, type BulkSelectedProduct } from './bulk-email-dialog'

export interface EventSalesRow {
  product_id: number
  product_type: string
  city: string
  event_datetime: string | null
  visitors: number
  male_tickets: number
  female_tickets: number
  total: number
  differential: number
  male_emails: string[]
  female_emails: string[]
}

interface EventSalesTableProps {
  rows: EventSalesRow[]
  nextEventMap: Record<number, number>
  campaignsByProduct: Record<number, string[]>
}

const NEXT_EVENT_TYPES = new Set(['onlineSpeedDating', 'onlineSpeedDatingGay'])

const TEMPLATE_DOTS: { id: string; color: string; label: string }[] = [
  { id: 'pre-event', color: 'bg-blue-500', label: 'Pre-event (Zoom link) sent' },
  { id: 'post-event', color: 'bg-pink-500', label: 'Post-event (select matches) sent' },
  { id: 'leads-reminder', color: 'bg-orange-500', label: 'Leads reminder sent' },
  { id: 'next-event', color: 'bg-purple-500', label: 'Next event email sent' },
  { id: 'complimentary-ticket', color: 'bg-emerald-500', label: 'Complimentary ticket sent' },
  { id: 'invite-friend-male', color: 'bg-sky-400', label: 'Invite-a-friend (male) sent' },
  { id: 'invite-friend-female', color: 'bg-rose-400', label: 'Invite-a-friend (female) sent' },
]

function formatEventDatetime(gmtdatetime: string): string {
  const date = new Date(gmtdatetime)
  return (
    date.toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' GMT'
  )
}

function isEventFinished(gmtdatetime: string): boolean {
  return new Date(gmtdatetime) < new Date()
}

function getDifferentialColor(diff: number): string {
  if (Math.abs(diff) <= 4) return 'text-green-600'
  if (diff > 0) return 'text-blue-600'
  return 'text-pink-600'
}

function formatDifferential(diff: number): string {
  if (Math.abs(diff) <= 4) return 'Balanced'
  if (diff > 0) return `+${diff} M`
  return `+${Math.abs(diff)} F`
}

function EmailStatusDots({ sentTemplates }: { sentTemplates: string[] }) {
  const set = new Set(sentTemplates)
  const sent = TEMPLATE_DOTS.filter((t) => set.has(t.id))
  if (sent.length === 0) return null
  return (
    <div className="flex flex-wrap gap-0.5 justify-end mt-1">
      {sent.map((t) => (
        <span key={t.id} title={t.label} className={`inline-block w-2 h-2 rounded-full ${t.color}`} />
      ))}
    </div>
  )
}

export function EventSalesTable({ rows, nextEventMap, campaignsByProduct }: EventSalesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const allSelected = rows.length > 0 && selectedIds.size === rows.length

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.product_id))))
  }

  function toggleOne(productId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const selectedProducts: BulkSelectedProduct[] = useMemo(
    () =>
      rows
        .filter((r) => selectedIds.has(r.product_id))
        .map((r) => ({
          productId: r.product_id,
          city: r.city,
          maleCount: r.male_tickets,
          femaleCount: r.female_tickets,
          total: r.total,
        })),
    [rows, selectedIds],
  )

  if (rows.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No event sales data available</p>
  }

  return (
    <>
      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex items-center gap-3 rounded-lg border bg-background/95 px-4 py-2.5 shadow-sm backdrop-blur">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" onClick={() => setBulkOpen(true)}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Send bulk email
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all events" />
            </TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead>Product Type</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Event Date</TableHead>
            <TableHead className="text-right">Visitors</TableHead>
            <TableHead className="text-right">Male Tickets</TableHead>
            <TableHead className="text-right">Female Tickets</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Gender Balance</TableHead>
            <TableHead className="text-right">Next Event</TableHead>
            <TableHead className="text-right w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isSelected = selectedIds.has(row.product_id)
            return (
              <TableRow key={row.product_id} data-state={isSelected ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(row.product_id)}
                    aria-label={`Select product ${row.product_id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/sales/customers?product_id=${row.product_id}`} className="text-blue-600 hover:underline">
                    {row.product_id}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.product_type}</TableCell>
                <TableCell>{row.city || '—'}</TableCell>
                <TableCell>
                  {row.event_datetime ? (
                    <span className={`font-medium ${isEventFinished(row.event_datetime) ? 'text-green-600' : 'text-blue-600'}`}>
                      {formatEventDatetime(row.event_datetime)}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{row.visitors}</TableCell>
                <TableCell className="text-right">
                  {row.male_tickets}
                  <CopyEmailsButton emails={row.male_emails} />
                </TableCell>
                <TableCell className="text-right">
                  {row.female_tickets}
                  <CopyEmailsButton emails={row.female_emails} />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {row.total}
                  {row.visitors > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">({((row.total / row.visitors) * 100).toFixed(1)}%)</span>
                  )}
                  <CopyEmailsButton emails={[...row.male_emails, ...row.female_emails]} />
                </TableCell>
                <TableCell className={`text-right font-semibold ${getDifferentialColor(row.differential)}`}>
                  {formatDifferential(row.differential)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {NEXT_EVENT_TYPES.has(row.product_type) ? (
                    nextEventMap[row.product_id] ? (
                      <Link href={`/admin/sales/customers?product_id=${nextEventMap[row.product_id]}`} className="text-blue-600 hover:underline">
                        {nextEventMap[row.product_id]}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <SendInviteEmailButton productId={row.product_id} maleEmails={row.male_emails} femaleEmails={row.female_emails} />
                    <SendZoomEmailButton productId={row.product_id} maleEmails={row.male_emails} femaleEmails={row.female_emails} />
                  </div>
                  <EmailStatusDots sentTemplates={campaignsByProduct[row.product_id] ?? []} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <BulkEmailDialog open={bulkOpen} onOpenChange={setBulkOpen} selected={selectedProducts} />
    </>
  )
}
