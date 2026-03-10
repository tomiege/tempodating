'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Copy, Loader2, Plus, Gift, Check } from 'lucide-react'

interface OnlineSpeedDatingProduct {
  productId: number
  gmtdatetime: string
  title: string
  city: string
  country: string
  timezone: string
  productType: string
}

interface Redemption {
  id: string
  code: string | null
  product_id: number | null
  product_type: string
  for_gender: 'male' | 'female' | 'both'
  discount_percent: number
  max_uses: number
  used_count: number
  expires_at: string
  note: string | null
  created_at: string
}

export default function AdminRedemptionsPage() {
  const [products, setProducts] = useState<OnlineSpeedDatingProduct[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [cityMap, setCityMap] = useState<Record<string, string>>({})

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [forGender, setForGender] = useState<string>('female')
  const [discountPercent, setDiscountPercent] = useState('100')
  const [maxUses, setMaxUses] = useState('10')
  const [expiryDays, setExpiryDays] = useState('30')
  const [note, setNote] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [city, setCity] = useState('')

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, redemptionsRes] = await Promise.all([
          fetch('/api/products/onlineSpeedDating'),
          fetch('/api/redemptions'),
        ])

        if (productsRes.ok) {
          const allProducts: OnlineSpeedDatingProduct[] = await productsRes.json()
          // Only show upcoming events
          const now = new Date()
          setProducts(allProducts.filter((p) => new Date(p.gmtdatetime) > now))
        }

        if (redemptionsRes.ok) {
          const data = await redemptionsRes.json()
          setRedemptions(data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProductSelect = (value: string) => {
    setSelectedProductId(value)
    if (value === 'all') {
      setCity('')
    } else {
      const product = products.find((p) => String(p.productId) === value)
      if (product) setCity(product.city)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) return

    setCreating(true)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays))

    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId === 'all' ? null : parseInt(selectedProductId),
          productType: 'onlineSpeedDating',
          forGender: forGender,
          discountPercent: parseInt(discountPercent),
          maxUses: parseInt(maxUses),
          expiresAt: expiresAt.toISOString(),
          note: note.trim() || undefined,
          code: customCode.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        setCreating(false)
        return
      }

      const newRedemption = await res.json()
      if (city.trim()) {
        setCityMap((prev) => ({ ...prev, [newRedemption.id]: city.trim() }))
      }
      setRedemptions((prev) => [newRedemption, ...prev])
      toast({ title: 'Redemption created', description: 'Code is ready to share.' })

      // Reset form
      setSelectedProductId('')
      setNote('')
      setCustomCode('')
      setDiscountPercent('100')
      setCity('')
    } catch {
      toast({ title: 'Error', description: 'Failed to create redemption', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const copyRedeemLink = (r: Redemption) => {
    const identifier = r.code || r.id
    const product = products.find((p) => p.productId === r.product_id)
    const linkCity = cityMap[r.id] || product?.city || ''
    const params = new URLSearchParams()
    if (r.product_id) params.set('productId', String(r.product_id))
    params.set('productType', r.product_type)
    if (linkCity) params.set('city', linkCity)
    params.set('redemptionId', identifier)
    const url = `${window.location.origin}/product?${params.toString()}`
    navigator.clipboard.writeText(url)
    setCopiedId(r.id)
    toast({ title: 'Copied', description: `Product link copied${r.code ? ` (code: ${r.code})` : ''}` })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatProduct = (p: OnlineSpeedDatingProduct) => {
    const date = new Date(p.gmtdatetime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${p.city} — ${date} (ID: ${p.productId})`
  }

  const getProductLabel = (productId: number | null): string => {
    if (productId === null) return 'All Events'
    const p = products.find((x) => x.productId === productId)
    if (!p) return `Product #${productId}`
    const date = new Date(p.gmtdatetime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${p.city} — ${date}`
  }

  const getStatus = (r: Redemption) => {
    if (r.used_count >= r.max_uses) return 'used-up'
    if (new Date(r.expires_at) < new Date()) return 'expired'
    return 'active'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center gap-2 py-20">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Redemption Codes</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage discount &amp; free ticket codes for events
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-4 h-4" />
            Create Redemption Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>Event</Label>
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events (wildcard)</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.productId} value={String(p.productId)}>
                      {formatProduct(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>For Gender</Label>
              <Select value={forGender} onValueChange={setForGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Discount %</Label>
              <Select value={discountPercent} onValueChange={setDiscountPercent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100% (Free)</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Code (optional)</Label>
              <Input
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="e.g. TEMPO20"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry (days from now)</Label>
              <Input
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>City (for link)</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Newark"
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Makeup event for March 8"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={creating || !selectedProductId}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Create Code
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing redemptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Codes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {redemptions.length} redemption code{redemptions.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No redemption codes created yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((r) => {
                  const status = getStatus(r)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {getProductLabel(r.product_id)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.code || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {r.discount_percent === 100 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Free</Badge>
                        ) : (
                          <span>{r.discount_percent}% off</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{r.for_gender}</TableCell>
                      <TableCell>
                        {r.used_count} / {r.max_uses}
                      </TableCell>
                      <TableCell>
                        {new Date(r.expires_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {r.note || '—'}
                      </TableCell>
                      <TableCell>
                        {status === 'active' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        )}
                        {status === 'used-up' && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            Used Up
                          </Badge>
                        )}
                        {status === 'expired' && (
                          <Badge variant="secondary" className="bg-red-100 text-red-600">
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyRedeemLink(r)}
                          disabled={status !== 'active'}
                        >
                          {copiedId === r.id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
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
