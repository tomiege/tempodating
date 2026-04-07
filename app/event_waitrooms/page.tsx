'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Clock3, Loader2, Shuffle, Video } from 'lucide-react'
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

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

function WaitroomPageInner() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const productType = searchParams.get('productType')

  const [event, setEvent] = useState<EventProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [assignedEmoji, setAssignedEmoji] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [hasAttendance, setHasAttendance] = useState(false)
  const [confirmedName, setConfirmedName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setAssignedEmoji(generateRandomEmoji())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!productId) return

    const existingAttendance = getAttendanceCookie(productId)
    if (existingAttendance?.preferredName) {
      setConfirmedName(existingAttendance.preferredName)
      setHasAttendance(true)
      setSubmitStatus('success')
      if (existingAttendance.gender) setGender(existingAttendance.gender)
      if (existingAttendance.age) setAge(String(existingAttendance.age))
    }
  }, [productId])

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
        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.statusText}`)
        }

        const products = await response.json()
        const foundEvent = products.find((item: EventProduct) => item.productId === Number(productId)) ?? null

        if (!foundEvent) {
          setError(`Event ${productId} was not found.`)
        } else {
          setEvent(foundEvent)
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load event.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [productId, productType])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const startRedirect = useCallback((zoomInvite: string) => {
    if (isRedirecting) return

    setIsRedirecting(true)
    redirectTimerRef.current = setTimeout(() => {
      window.location.assign(zoomInvite)
    }, 1500)
  }, [isRedirecting])

  const eventStartMs = event ? new Date(event.gmtdatetime).getTime() : null
  const hasEventStarted = eventStartMs !== null && now >= eventStartMs
  const countdown = useMemo(
    () => formatCountdown((eventStartMs ?? now) - now),
    [eventStartMs, now]
  )

  useEffect(() => {
    if (!event || !hasAttendance || !hasEventStarted || !event.zoomInvite) return
    startRedirect(event.zoomInvite)
  }, [event, hasAttendance, hasEventStarted, startRedirect])

  const handleSubmit = async () => {
    if (!productId || !event) return
    if (!firstName.trim() || !lastName.trim() || !gender || !age) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const preferredName = `${firstName.trim()} ${lastName.trim()} ${assignedEmoji}`
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendeeName: `anonymous_${Date.now()}@event.local`,
          preferredName,
          productId,
          gender,
          age: parseInt(age, 10),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to record attendance')
      }

      saveAttendanceCookie(productId, {
        preferredName,
        gender,
        age: parseInt(age, 10),
      })

      setConfirmedName(preferredName)
      setHasAttendance(true)
      setSubmitStatus('success')

      if (event.zoomInvite) {
        startRedirect(event.zoomInvite)
      }
    } catch (submitError) {
      console.error('Attendance submission failed:', submitError)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRedirecting && event?.zoomInvite) {
    return (
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] text-slate-900">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-orange-200/70 bg-white/85 p-10 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
              <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900">
              Starting redirect to Zoom...
            </h1>
            <p className="mb-6 text-lg text-slate-600">
              You&apos;re checked in. We&apos;re opening your event room now.
            </p>
            <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-orange-500" />
            </div>
            <p className="mt-6 text-sm text-slate-500">
              If nothing happens, use the button below.
            </p>
            <div className="mt-4">
              <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
                <a href={event.zoomInvite}>Open Zoom Now</a>
              </Button>
            </div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes loading-bar {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(320%);
            }
          }
        `}</style>
      </main>
    )
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
          <h1 className="mb-3 text-3xl font-black text-slate-900">Event waitroom unavailable</h1>
          <p className="text-slate-600">{error || 'The requested event could not be loaded.'}</p>
        </div>
      </main>
    )
  }

  const eventDate = new Date(event.gmtdatetime)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: event.timezone,
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: event.timezone,
    timeZoneName: 'short',
  })

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-orange-200/70 bg-white/85 p-8 shadow-2xl backdrop-blur">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              <Video className="h-4 w-4" />
              Event Waitroom
            </div>

            <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-900">
              {event.title}
            </h1>
            <p className="mb-8 text-lg text-slate-600">
              {event.city}, {event.country}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Date</p>
                <p className="text-lg font-semibold text-slate-900">{formattedDate}</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Time</p>
                <p className="text-lg font-semibold text-slate-900">{formattedTime}</p>
              </div>
            </div>

            {!hasEventStarted ? (
              <div className="mt-8 rounded-[1.75rem] bg-slate-950 p-8 text-white shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <Clock3 className="h-6 w-6 text-orange-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                    Countdown To Start
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Days', value: countdown.days },
                    { label: 'Hours', value: countdown.hours },
                    { label: 'Minutes', value: countdown.minutes },
                    { label: 'Seconds', value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/10 p-4 text-center">
                      <div className="text-4xl font-black">{String(item.value).padStart(2, '0')}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-100">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm text-slate-300">
                  {hasAttendance
                    ? `Attendance already saved for ${confirmedName}. We’ll send you straight into Zoom when the event begins.`
                    : 'Once the event begins, you’ll be asked to complete attendance before entering Zoom.'}
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-[1.75rem] border border-green-200 bg-green-50 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-6 w-6 text-green-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">The event has started</h2>
                    <p className="mt-2 text-slate-600">
                      {hasAttendance
                        ? 'Your attendance is already confirmed. Redirecting you to Zoom now.'
                        : 'Complete the attendance form to unlock the Zoom link.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-orange-200/70 bg-white/85 p-8 shadow-2xl backdrop-blur">
            {!hasEventStarted ? (
              <>
                <h2 className="text-2xl font-black text-slate-900">You&apos;re in the right place</h2>
                <p className="mt-3 text-slate-600">
                  Stay on this page and we&apos;ll handle the next step automatically as soon as the event opens.
                </p>
                <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">What happens next</p>
                  <p className="mt-2">
                    1. Countdown reaches zero.
                  </p>
                  <p>
                    2. You complete attendance if needed.
                  </p>
                  <p>
                    3. We redirect you into Zoom automatically.
                  </p>
                </div>
              </>
            ) : hasAttendance ? (
              <>
                <h2 className="text-2xl font-black text-slate-900">Attendance already confirmed</h2>
                <p className="mt-3 text-slate-600">
                  We found your saved attendance for {confirmedName}. You should be heading into Zoom right away.
                </p>
                <div className="mt-8">
                  <Button
                    className="w-full bg-orange-500 text-white hover:bg-orange-600"
                    onClick={() => startRedirect(event.zoomInvite)}
                  >
                    Open Zoom Now
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Confirm your attendance</h2>
                  <p className="mt-2 text-slate-600">
                    This matches the current attendance flow and saves your check-in for this event on this device.
                  </p>
                </div>

                {submitStatus === 'error' && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    Failed to mark attendance. Please try again.
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving attendance...
                      </>
                    ) : (
                      'Confirm Attendance And Join Zoom'
                    )}
                  </Button>

                  <p className="text-center text-xs text-slate-500">
                    Fallback link:{' '}
                    <Link href={`/attendance?productId=${productId}`} className="font-medium text-orange-600 underline">
                      /attendance?productId={productId}
                    </Link>
                  </p>
                </div>
              </>
            )}
          </section>
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
