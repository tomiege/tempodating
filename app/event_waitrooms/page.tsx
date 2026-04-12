'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, Shuffle, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EventProduct {
  productId: number
  gmtdatetime: string
  title: string
  country: string
  city: string
  timezone: string
  productType: string
  zoomInvite: string
}

const PRODUCT_API_MAP: Record<string, string> = {
  onlineSpeedDating: '/api/products/onlineSpeedDating',
  onlineSpeedDatingGay: '/api/products/onlineSpeedDatingGay',
  onlineSpeedDatingJewish: '/api/products/onlineSpeedDatingJewish',
  onlineSpeedDatingIndian: '/api/products/onlineSpeedDatingIndian',
  onlineSpeedDatingMuslim: '/api/products/onlineSpeedDatingMuslim',
  workshop: '/api/products/workshop',
}

function generateRandomEmoji(): string {
  const emojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣',
    '🦆', '🦅', '🦉', '🐺', '🐴', '🦄', '🐝', '🦋', '🐢', '🐙',
    '🐠', '🐬', '🦈', '🐳', '🐊', '🐆', '🦌', '🐘', '🦛', '🐎',
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭',
    '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🌽', '🥕', '🫒', '🥐',
    '🥯', '🍞', '🥨', '🧀', '🥚', '🍳', '🥞', '🧇', '🥓', '🍕',
  ]
  return emojis[Math.floor(Math.random() * emojis.length)]
}

function getAttendanceCookieKey(productId: string) {
  return `attendance_${productId}`
}

function getAttendanceCookie(productId: string) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${getAttendanceCookieKey(productId)}=`))

  if (!cookie) return null

  try {
    return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))) as {
      preferredName?: string
      gender?: string
      age?: number
    }
  } catch {
    return null
  }
}

function saveAttendanceCookie(productId: string, value: { preferredName: string; gender: string; age: number }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${getAttendanceCookieKey(productId)}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/`
}

function WaitroomPageInner() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const productType = searchParams.get('productType')

  const [event, setEvent] = useState<EventProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localTimeLabel, setLocalTimeLabel] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [assignedEmoji, setAssignedEmoji] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [hasAttendance, setHasAttendance] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setAssignedEmoji(generateRandomEmoji())
  }, [])

  useEffect(() => {
    async function fetchEvent() {
      if (!productId || !productType) {
        setError('Missing productId or productType in URL.')
        setLoading(false)
        return
      }

      const apiUrl = PRODUCT_API_MAP[productType]
      if (!apiUrl) {
        setError(`Unsupported product type: ${productType}`)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error(`Failed to fetch event: ${response.statusText}`)

        const products = await response.json()
        const foundEvent = products.find((item: EventProduct) => item.productId === Number(productId)) ?? null

        if (!foundEvent) {
          setError(`Event ${productId} was not found.`)
          return
        }

        setEvent(foundEvent)
        setLocalTimeLabel(
          new Date(foundEvent.gmtdatetime).toLocaleString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          })
        )
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load event.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [productId, productType])

  useEffect(() => {
    if (!productId) return
    const existing = getAttendanceCookie(productId)
    if (existing?.preferredName) {
      setHasAttendance(true)
    }
  }, [productId])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setHasAttendance(true)
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSubmit = async () => {
    if (!productId || !event) return
    if (!firstName.trim() || !lastName.trim() || !gender || !age) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const preferredName = `${firstName.trim()} ${lastName.trim()} ${assignedEmoji}`
      const parsedAge = parseInt(age, 10)

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: `anonymous_${Date.now()}@event.local`,
          preferredName,
          productId,
          gender,
          age: parsedAge,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to record attendance')

      saveAttendanceCookie(productId, { preferredName, gender, age: parsedAge })
      setCountdown(10)
    } catch (err) {
      console.error('Attendance submission failed:', err)
      setSubmitError('Failed to mark attendance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] px-6">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </main>
    )
  }

  if (error || !productId || !productType || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] px-6">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-200 bg-white/90 p-10 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-3 text-3xl font-black text-slate-900">Event unavailable</h1>
          <p className="text-slate-600">{error || 'The requested event could not be loaded.'}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-10">
        <div className="rounded-[2rem] border border-orange-200/70 bg-white/85 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
            <Video className="h-4 w-4" />
            Event Registration
          </div>

          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">{event.title}</h1>
          <p className="mb-8 text-slate-500">{localTimeLabel}</p>

          {countdown !== null && !hasAttendance ? (
            <div className="text-center">
              <p className="mb-4 text-slate-600">Attendance confirmed! Preparing your link&hellip;</p>
              <p className="text-8xl font-black text-orange-500">{countdown}</p>
            </div>
          ) : !hasAttendance ? (
            <>
              <h2 className="mb-1 text-xl font-bold text-slate-900">Confirm your attendance</h2>
              <p className="mb-6 text-sm text-slate-500">
                Fill in your details below to get access to the Zoom link.
              </p>

              {submitError && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {submitError}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-700">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="h-12 rounded-xl border-orange-200"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-700">
                    Last Name
                  </label>
                  <div className="flex gap-3">
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="h-12 rounded-xl border-orange-200"
                    />
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-2xl">
                      {assignedEmoji}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl border-orange-200"
                      onClick={() => setAssignedEmoji(generateRandomEmoji())}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={gender === 'male' ? 'default' : 'outline'}
                      className={gender === 'male' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'border-orange-200'}
                      onClick={() => setGender('male')}
                    >
                      Male
                    </Button>
                    <Button
                      type="button"
                      variant={gender === 'female' ? 'default' : 'outline'}
                      className={gender === 'female' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'border-orange-200'}
                      onClick={() => setGender('female')}
                    >
                      Female
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="age" className="mb-2 block text-sm font-medium text-slate-700">
                    Age
                  </label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="99"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter your age"
                    className="h-12 rounded-xl border-orange-200"
                  />
                </div>

                <Button
                  className="h-12 w-full rounded-xl bg-orange-500 text-base font-semibold text-white hover:bg-orange-600"
                  disabled={isSubmitting || !firstName.trim() || !lastName.trim() || !gender || !age}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving attendance...
                    </>
                  ) : (
                    'Confirm Attendance'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <Video className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-black text-slate-900">You&apos;re registered!</h2>
              <p className="mb-8 text-slate-500">
                Click the button below to join the Zoom event.
              </p>
              <Button
                asChild
                className="h-14 w-full rounded-xl bg-orange-500 text-lg font-semibold text-white hover:bg-orange-600"
              >
                <a href={event.zoomInvite} target="_blank" rel="noopener noreferrer">
                  Join Zoom Meeting
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function EventWaitroomsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] px-6">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </main>
      }
    >
      <WaitroomPageInner />
    </Suspense>
  )
}
