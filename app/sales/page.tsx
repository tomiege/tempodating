import Link from 'next/link'
import { readFile } from 'fs/promises'
import path from 'path'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HourlyCheckoutsChart, HourlyLeadsChart } from './charts'
import { CopyEmailsButton } from './copy-emails-button'
import { SendZoomEmailButton } from './send-zoom-email-button'
import { Star } from 'lucide-react'

interface EventEntry {
  productId: number
  gmtdatetime: string
  timezone: string
  title: string
  city: string
}

interface SalesData {
  product_id: number
  male_tickets: number
  female_tickets: number
  total: number
  differential: number
  city: string
  male_emails: string[]
  female_emails: string[]
  event_datetime: string | null
  event_timezone: string | null
}

interface HourlyData {
  hour: string
  count: number
}

async function getEventsMap(): Promise<Map<number, EventEntry>> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'events.json')
    const raw = await readFile(filePath, 'utf-8')
    const events: EventEntry[] = JSON.parse(raw)
    const map = new Map<number, EventEntry>()
    events.forEach((e) => map.set(e.productId, e))
    return map
  } catch {
    console.error('Error loading events.json')
    return new Map()
  }
}

function formatEventDatetime(gmtdatetime: string, timezone: string): string {
  const date = new Date(gmtdatetime)
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function isEventFinished(gmtdatetime: string): boolean {
  return new Date(gmtdatetime) < new Date()
}

async function getSalesData(): Promise<SalesData[]> {
  const supabase = createServiceSupabaseClient()
  const eventsMap = await getEventsMap()

  // Get only PAID checkouts (confirmation_email_sent = true)
  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('product_id, is_male, user_id, email, query_city')
    .eq('confirmation_email_sent', true)

  if (error) {
    console.error('Error fetching checkouts:', error)
    return []
  }

  // Group by product_id, deduplicate by user (user_id or email) within each product
  const productMap = new Map<
    number,
    { seenUsers: Set<string>; male: number; female: number; city: string; male_emails: string[]; female_emails: string[] }
  >()

  checkouts?.forEach((checkout) => {
    const productId = checkout.product_id
    if (!productMap.has(productId)) {
      productMap.set(productId, { seenUsers: new Set(), male: 0, female: 0, city: checkout.query_city || '', male_emails: [], female_emails: [] })
    }

    const current = productMap.get(productId)!

    // Deduplicate by user_id first, then email
    const userKey = checkout.user_id || checkout.email
    if (current.seenUsers.has(userKey)) return
    current.seenUsers.add(userKey)

    // Set city if not yet set
    if (!current.city && checkout.query_city) {
      current.city = checkout.query_city
    }

    if (checkout.is_male === true) {
      current.male++
      if (checkout.email) current.male_emails.push(checkout.email)
    } else if (checkout.is_male === false) {
      current.female++
      if (checkout.email) current.female_emails.push(checkout.email)
    }
  })

  // Convert to array format
  const salesData: SalesData[] = Array.from(productMap.entries()).map(([productId, counts]) => {
    const event = eventsMap.get(productId)
    return {
      product_id: productId,
      male_tickets: counts.male,
      female_tickets: counts.female,
      total: counts.male + counts.female,
      differential: counts.male - counts.female,
      city: counts.city,
      male_emails: counts.male_emails,
      female_emails: counts.female_emails,
      event_datetime: event?.gmtdatetime ?? null,
      event_timezone: event?.timezone ?? null,
    }
  })

  // Sort by product_id
  return salesData.sort((a, b) => a.product_id - b.product_id)
}

async function getHourlyCheckouts(): Promise<HourlyData[]> {
  const supabase = createServiceSupabaseClient()

  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('checkout_time')
    .not('user_id', 'is', null)
    .order('checkout_time', { ascending: true })

  if (error || !checkouts) {
    console.error('Error fetching hourly checkouts:', error)
    return []
  }

  // Group by hour
  const hourlyMap = new Map<string, number>()

  checkouts.forEach((checkout) => {
    if (checkout.checkout_time) {
      const date = new Date(checkout.checkout_time)
      const hour = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
    }
  })

  return Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

async function getHourlyLeads(): Promise<HourlyData[]> {
  const supabase = createServiceSupabaseClient()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error || !leads) {
    console.error('Error fetching hourly leads:', error)
    return []
  }

  // Group by hour
  const hourlyMap = new Map<string, number>()

  leads.forEach((lead) => {
    if (lead.created_at) {
      const date = new Date(lead.created_at)
      const hour = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
    }
  })

  return Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

interface FeedbackData {
  id: number
  user_name: string | null
  rating: number
  message: string
  product_id: number | null
  product_type: string | null
  created_at: string
}

function getDifferentialColor(diff: number): string {
  if (Math.abs(diff) <= 4) return 'text-green-600'
  if (diff > 0) return 'text-blue-600' // More males
  return 'text-pink-600' // More females
}

function formatDifferential(diff: number): string {
  if (Math.abs(diff) <= 4) return 'Balanced'
  if (diff > 0) return `+${diff} M`
  return `+${Math.abs(diff)} F`
}

async function getRecentFeedback(): Promise<FeedbackData[]> {
  const supabase = createServiceSupabaseClient()

  const { data: feedback, error } = await supabase
    .from('feedback')
    .select('id, user_name, rating, message, product_id, product_type, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching feedback:', error)
    return []
  }

  return feedback || []
}

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default async function SalesPage() {
  const [salesData, hourlyCheckouts, hourlyLeads, recentFeedback] = await Promise.all([
    getSalesData(),
    getHourlyCheckouts(),
    getHourlyLeads(),
    getRecentFeedback(),
  ])

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paid checkouts grouped by Product ID (deduplicated by user)
          </p>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sales data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead className="text-right">Male Tickets</TableHead>
                  <TableHead className="text-right">Female Tickets</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Gender Balance</TableHead>
                  <TableHead className="text-right w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((row) => (
                  <TableRow key={row.product_id}>
                    <TableCell className="font-medium">
                      <Link href={`/sales/customers?product_id=${row.product_id}`} className="text-blue-600 hover:underline">
                        {row.product_id}
                      </Link>
                    </TableCell>
                    <TableCell>{row.city || '—'}</TableCell>
                    <TableCell>
                      {row.event_datetime ? (
                        <span className={`font-medium ${
                          isEventFinished(row.event_datetime)
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}>
                          {formatEventDatetime(row.event_datetime, row.event_timezone || 'UTC')}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
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
                      <CopyEmailsButton emails={[...row.male_emails, ...row.female_emails]} />
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${getDifferentialColor(row.differential)}`}>
                      {formatDifferential(row.differential)}
                    </TableCell>
                    <TableCell className="text-right">
                      <SendZoomEmailButton
                        productId={row.product_id}
                        maleEmails={row.male_emails}
                        femaleEmails={row.female_emails}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyCheckoutsChart data={hourlyCheckouts} />
        <HourlyLeadsChart data={hourlyLeads} />
      </div>

      {/* Recent Feedback Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            {recentFeedback.length} feedback entries from users
          </p>
        </CardHeader>
        <CardContent>
          {recentFeedback.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No feedback yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {fb.user_name || 'Anonymous'}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= fb.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(fb.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{fb.message}</p>
                  {(fb.product_type || fb.product_id) && (
                    <p className="text-xs text-muted-foreground">
                      {fb.product_type}{fb.product_id ? ` #${fb.product_id}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
