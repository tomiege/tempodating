import Link from 'next/link'
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

interface SalesData {
  product_id: number
  male_tickets: number
  female_tickets: number
  total: number
  differential: number
  city: string
}

interface HourlyData {
  hour: string
  count: number
}

async function getSalesData(): Promise<SalesData[]> {
  const supabase = createServiceSupabaseClient()

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
    { seenUsers: Set<string>; male: number; female: number; city: string }
  >()

  checkouts?.forEach((checkout) => {
    const productId = checkout.product_id
    if (!productMap.has(productId)) {
      productMap.set(productId, { seenUsers: new Set(), male: 0, female: 0, city: checkout.query_city || '' })
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
    } else if (checkout.is_male === false) {
      current.female++
    }
  })

  // Convert to array format
  const salesData: SalesData[] = Array.from(productMap.entries()).map(([productId, counts]) => ({
    product_id: productId,
    male_tickets: counts.male,
    female_tickets: counts.female,
    total: counts.male + counts.female,
    differential: counts.male - counts.female,
    city: counts.city,
  }))

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

export default async function SalesPage() {
  const [salesData, hourlyCheckouts, hourlyLeads] = await Promise.all([
    getSalesData(),
    getHourlyCheckouts(),
    getHourlyLeads(),
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
                  <TableHead className="text-right">Male Tickets</TableHead>
                  <TableHead className="text-right">Female Tickets</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Gender Balance</TableHead>
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
                    <TableCell className="text-right">{row.male_tickets}</TableCell>
                    <TableCell className="text-right">{row.female_tickets}</TableCell>
                    <TableCell className="text-right font-semibold">{row.total}</TableCell>
                    <TableCell className={`text-right font-semibold ${getDifferentialColor(row.differential)}`}>
                      {formatDifferential(row.differential)}
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
    </div>
  )
}
