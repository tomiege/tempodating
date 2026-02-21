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
  city: string | null
  gmtdatetime: string | null
}

interface HourlyData {
  hour: string
  count: number
}

async function getSalesData(): Promise<SalesData[]> {
  const supabase = createServiceSupabaseClient()

  // Get all checkouts with non-null user_id
  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('product_id, is_male')
    .not('user_id', 'is', null)
    .eq('confirmation_email_sent', true)

  if (error) {
    console.error('Error fetching checkouts:', error)
    return []
  }

  // Load product data for city and datetime info
  let productMap = new Map<number, { city: string; gmtdatetime: string }>()
  try {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'public', 'products', 'onlineSpeedDating.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const products = JSON.parse(fileContent) as Array<{ productId: number; city: string; gmtdatetime: string }>
    products.forEach(p => productMap.set(p.productId, { city: p.city, gmtdatetime: p.gmtdatetime }))
  } catch (e) {
    console.error('Error loading product data:', e)
  }

  // Group by product_id and count male/female tickets
  const salesMap = new Map<number, { male: number; female: number }>()

  checkouts?.forEach((checkout) => {
    const productId = checkout.product_id
    if (!salesMap.has(productId)) {
      salesMap.set(productId, { male: 0, female: 0 })
    }

    const current = salesMap.get(productId)!
    if (checkout.is_male === true) {
      current.male++
    } else if (checkout.is_male === false) {
      current.female++
    }
  })

  // Convert to array format
  const salesData: SalesData[] = Array.from(salesMap.entries()).map(([productId, counts]) => {
    const product = productMap.get(productId)
    return {
      product_id: productId,
      male_tickets: counts.male,
      female_tickets: counts.female,
      total: counts.male + counts.female,
      differential: counts.male - counts.female,
      city: product?.city || null,
      gmtdatetime: product?.gmtdatetime || null,
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
    .eq('confirmation_email_sent', true)
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
            Checkouts grouped by Product ID (Users only)
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
                  <TableHead>Start Date/Time</TableHead>
                  <TableHead className="text-right">Male Tickets</TableHead>
                  <TableHead className="text-right">Female Tickets</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Gender Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((row) => (
                  <TableRow key={row.product_id}>
                    <TableCell className="font-medium">{row.product_id}</TableCell>
                    <TableCell>{row.city || '—'}</TableCell>
                    <TableCell>
                      {row.gmtdatetime
                        ? new Date(row.gmtdatetime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : '—'}
                    </TableCell>
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
