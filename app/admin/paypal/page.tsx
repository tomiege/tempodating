'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Copy, ExternalLink, Loader2, AlertCircle, FlaskConical, Globe, Package } from 'lucide-react'

const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'NZD', 'SGD']

export default function PayPalAdminPage() {
  const [sandbox, setSandbox] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [noShipping, setNoShipping] = useState(true)
  const [returnUrl, setReturnUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url: string; orderId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Read ?status= from URL after PayPal redirect back
  const [redirectStatus, setRedirectStatus] = useState<string | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status) setRedirectStatus(status)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setCopied(false)

    try {
      const res = await fetch('/api/admin/paypal/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price: parseFloat(price), currency, sandbox, noShipping, returnUrl: returnUrl.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create payment link')
        return
      }

      setResult({ url: data.url, orderId: data.orderId })
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result?.url) return
    navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PayPal Payment Link</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Generate a one-off PayPal checkout link</p>
        </div>

        {/* Redirect status banner */}
        {redirectStatus === 'success' && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">Payment completed successfully.</span>
          </div>
        )}
        {redirectStatus === 'cancelled' && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">Payment was cancelled.</span>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex items-center gap-3 p-1 bg-white dark:bg-gray-800 border border-border rounded-xl w-fit shadow-sm">
          <button
            type="button"
            onClick={() => { setSandbox(false); setResult(null); setError(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              !sandbox
                ? 'bg-green-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            Production
          </button>
          <button
            type="button"
            onClick={() => { setSandbox(true); setResult(null); setError(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sandbox
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Sandbox
          </button>
        </div>

        {sandbox && (
          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <FlaskConical className="w-4 h-4 shrink-0" />
            Sandbox mode — using test credentials. Links go to PayPal sandbox.
          </div>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Payment Link</CardTitle>
            <CardDescription>Fill in the details and click Generate to get a PayPal checkout URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. Speed Dating Ticket — Chicago"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Textarea
                  id="description"
                  placeholder="Additional details shown to the buyer on the PayPal page"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Amount <span className="text-red-500">*</span></Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="15.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Currency <span className="text-red-500">*</span></Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-return URL */}
              <div className="space-y-2">
                <Label htmlFor="returnUrl">
                  Auto-return URL <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="returnUrl"
                  type="url"
                  placeholder="https://yourdomain.com/thank-you"
                  value={returnUrl}
                  onChange={e => setReturnUrl(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Customers are automatically redirected here after a successful payment. Must be a public HTTPS URL (localhost is not accepted by PayPal).
                </p>
              </div>

              {/* No shipping toggle */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border cursor-pointer"
                onClick={() => setNoShipping(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">No shipping address</p>
                    <p className="text-xs text-muted-foreground">Hides the shipping step on the PayPal page</p>
                  </div>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${noShipping ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${noShipping ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !title || !price || !currency}
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating…
                  </span>
                ) : (
                  'Generate Payment Link'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                Payment Link Ready
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-400">
                Order ID: <span className="font-mono">{result.orderId}</span>
                {sandbox && <span className="ml-2 text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sandbox</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* URL display */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-green-200 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                  {result.url}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 text-gray-500 hover:text-gray-800 transition-colors"
                  title="Copy link"
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  asChild
                  className="flex-1 gap-2"
                >
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Open Checkout
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              <p className="text-xs text-green-700 dark:text-green-400">
                ⚠️ PayPal order links expire after ~3 hours. Generate a new one if needed.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
