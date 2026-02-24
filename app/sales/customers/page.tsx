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
import { Badge } from '@/components/ui/badge'

interface Customer {
  name: string
  email: string
  is_male: boolean | null
  query_city: string | null
  checkout_time: string | null
  total_order: number
  user_id: string | null
  avatar_url: string | null
  personality_quiz_result: Record<string, unknown> | null
  user_city: string | null
  email_verified: boolean
}

interface Props {
  searchParams: Promise<{ product_id?: string }>
}

async function getCustomers(productId: number): Promise<Customer[]> {
  const supabase = createServiceSupabaseClient()

  // Get only PAID checkouts for this product
  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('name, email, is_male, query_city, checkout_time, total_order, user_id')
    .eq('product_id', productId)
    .eq('confirmation_email_sent', true)
    .order('checkout_time', { ascending: true })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  // Deduplicate by user_id first, then email
  const seen = new Set<string>()
  const deduplicated: typeof checkouts = []

  checkouts?.forEach((checkout) => {
    const userKey = checkout.user_id || checkout.email
    if (seen.has(userKey)) return
    seen.add(userKey)
    deduplicated.push(checkout)
  })

  // Fetch user profiles for all user_ids
  const userIds = deduplicated
    .map((c) => c.user_id)
    .filter((id): id is string => id !== null)

  let userMap = new Map<string, { avatar_url: string | null; personality_quiz_result: Record<string, unknown> | null; city: string | null }>()
  let authVerifiedMap = new Map<string, boolean>()

  if (userIds.length > 0) {
    // Fetch public.users profiles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, avatar_url, personality_quiz_result, city')
      .in('id', userIds)

    if (!usersError && users) {
      users.forEach((u) => {
        userMap.set(u.id, {
          avatar_url: u.avatar_url,
          personality_quiz_result: u.personality_quiz_result as Record<string, unknown> | null,
          city: u.city,
        })
      })
    }

    // Fetch auth.users email verification status
    // listUsers is paginated, fetch in batches
    const { data: authData } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })
    if (authData?.users) {
      const userIdSet = new Set(userIds)
      authData.users.forEach((u) => {
        if (userIdSet.has(u.id)) {
          authVerifiedMap.set(u.id, !!u.email_confirmed_at)
        }
      })
    }
  }

  return deduplicated.map((checkout) => {
    const profile = checkout.user_id ? userMap.get(checkout.user_id) : null
    return {
      ...checkout,
      avatar_url: profile?.avatar_url ?? null,
      personality_quiz_result: profile?.personality_quiz_result ?? null,
      user_city: profile?.city ?? null,
      email_verified: checkout.user_id ? (authVerifiedMap.get(checkout.user_id) ?? false) : false,
    }
  })
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams
  const productId = params.product_id ? parseInt(params.product_id, 10) : null

  if (!productId || isNaN(productId)) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No product ID specified.{' '}
              <Link href="/sales" className="text-blue-600 hover:underline">
                Go back to Sales
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const customers = await getCustomers(productId)
  const maleCount = customers.filter((c) => c.is_male === true).length
  const femaleCount = customers.filter((c) => c.is_male === false).length

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link href="/sales" className="text-muted-foreground hover:text-foreground text-sm">
              ← Sales
            </Link>
          </div>
          <CardTitle>Customers — Product {productId}</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: <strong>{customers.length}</strong></span>
            <span>Male: <strong className="text-blue-600">{maleCount}</strong></span>
            <span>Female: <strong className="text-pink-600">{femaleCount}</strong></span>
          </div>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No paid customers for this product.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Personality</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Checkout Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={`${customer.email}-${index}`}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      {customer.avatar_url ? (
                        <img
                          src={customer.avatar_url}
                          alt={customer.name || 'Profile'}
                          className="rounded-full object-cover w-10 h-10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          {customer.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{customer.name || '—'}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      {customer.is_male === true ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-300">Male</Badge>
                      ) : customer.is_male === false ? (
                        <Badge variant="outline" className="text-pink-600 border-pink-300">Female</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{customer.user_city || customer.query_city || '—'}</TableCell>
                    <TableCell className="max-w-[200px]">
                      {customer.personality_quiz_result ? (
                        <div className="text-xs space-y-0.5">
                          {Object.entries(customer.personality_quiz_result).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.email_verified ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      £{customer.total_order?.toFixed(2) ?? '0.00'}
                    </TableCell>
                    <TableCell>
                      {customer.checkout_time
                        ? new Date(customer.checkout_time).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
