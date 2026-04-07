'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle, Clock3, Loader2, Shuffle, Users, Video } from 'lucide-react'
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

type WaitroomPhase = 'countdown' | 'attendance' | 'holding' | 'redirecting'

const PRODUCT_API_MAP: Record<string, string> = {
  onlineSpeedDating: '/api/products/onlineSpeedDating',
  onlineSpeedDatingGay: '/api/products/onlineSpeedDatingGay',
  onlineSpeedDatingJewish: '/api/products/onlineSpeedDatingJewish',
  onlineSpeedDatingIndian: '/api/products/onlineSpeedDatingIndian',
  onlineSpeedDatingMuslim: '/api/products/onlineSpeedDatingMuslim',
  workshop: '/api/products/workshop',
}

const HOLD_DURATION_MS = 10 * 60 * 1000
const REDIRECT_ANIMATION_MS = 10 * 1000
const PROCESS_SLIDES = [
  {
    src: '/speedDatingProcess/1.png',
    alt: 'Breakout rooms button location',
    caption:
      'WE will be using breakoutrooms, look at the bottom of your screen for the Breakoutrooms button. 1.png shows where to find it.',
  },
  {
    src: '/speedDatingProcess/2.png',
    alt: 'Breakout room join menu',
    caption:
      '2.png shows what the breakoutroom menu looks like after they click breakout rooms. It looks like room1, join, room2 join, room3 join, and so on.',
  },
  {
    src: '/speedDatingProcess/3.png',
    alt: 'Pairings example',
    caption:
      '3.png shows what the pairings look like. For example: Adam and Eve, Room 1. Then go to Room 1.',
  },
] as const

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

function getWaitroomProgressKey(productId: string, isTestMode: boolean) {
  return `event_waitroom_progress_${productId}${isTestMode ? '_testmode' : ''}`
}

function getWaitroomSessionKey(productId: string, isTestMode: boolean) {
  return `event_waitroom_session_${productId}${isTestMode ? '_testmode' : ''}`
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

function getOrCreateSessionId(productId: string, isTestMode: boolean) {
  const storageKey = getWaitroomSessionKey(productId, isTestMode)
  const existing = window.sessionStorage.getItem(storageKey)
  if (existing) return existing

  const nextId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`

  window.sessionStorage.setItem(storageKey, nextId)
  return nextId
}

function WaitroomPageInner() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const productType = searchParams.get('productType')
  const isTestMode = searchParams.get('testmode') === 'true'

  const [event, setEvent] = useState<EventProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [countdownStartMs, setCountdownStartMs] = useState<number | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [assignedEmoji, setAssignedEmoji] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [hasAttendance, setHasAttendance] = useState(false)
  const [confirmedName, setConfirmedName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [holdStartedAt, setHoldStartedAt] = useState<number | null>(null)
  const [activePeopleCount, setActivePeopleCount] = useState(1)
  const [localTimeLabel, setLocalTimeLabel] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const redirectTriggeredRef = useRef(false)

  useEffect(() => {
    setAssignedEmoji(generateRandomEmoji())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!productId) return

    if (isTestMode) {
      setCountdownStartMs(Date.now() + 60 * 1000)
      setHasAttendance(false)
      setConfirmedName('')
      setSubmitStatus('idle')
      return
    }

    const existingAttendance = getAttendanceCookie(productId)
    if (existingAttendance?.preferredName) {
      setConfirmedName(existingAttendance.preferredName)
      setHasAttendance(true)
      setSubmitStatus('success')
      if (existingAttendance.gender) setGender(existingAttendance.gender)
      if (existingAttendance.age) setAge(String(existingAttendance.age))
    }
  }, [productId, isTestMode])

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
          return
        }

        setEvent(foundEvent)
        if (!isTestMode) {
          setCountdownStartMs(new Date(foundEvent.gmtdatetime).getTime())
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load event.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [productId, productType, isTestMode])

  useEffect(() => {
    if (!event) return

    setLocalTimeLabel(
      new Date(event.gmtdatetime).toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    )
  }, [event])

  useEffect(() => {
    if (!productId) return

    const progressKey = getWaitroomProgressKey(productId, isTestMode)
    try {
      const raw = window.localStorage.getItem(progressKey)
      if (!raw) return

      const progress = JSON.parse(raw) as {
        confirmedName?: string
        gender?: string
        age?: number
        holdStartedAt?: number
      }

      if (progress.confirmedName) {
        setConfirmedName(progress.confirmedName)
        setHasAttendance(true)
        setSubmitStatus('success')
      }
      if (progress.gender) setGender(progress.gender)
      if (progress.age) setAge(String(progress.age))
      if (progress.holdStartedAt) setHoldStartedAt(progress.holdStartedAt)
    } catch {
      // Ignore invalid local progress
    }
  }, [productId, isTestMode])

  const persistProgress = useCallback((progress: {
    confirmedName?: string
    gender?: string
    age?: number
    holdStartedAt?: number
  }) => {
    if (!productId) return

    const progressKey = getWaitroomProgressKey(productId, isTestMode)
    try {
      const existing = window.localStorage.getItem(progressKey)
      const parsed = existing ? JSON.parse(existing) as Record<string, unknown> : {}
      window.localStorage.setItem(progressKey, JSON.stringify({ ...parsed, ...progress }))
    } catch {
      // Ignore storage failures
    }
  }, [productId, isTestMode])

  const eventStartMs = countdownStartMs
  const hasEventStarted = eventStartMs !== null && now >= eventStartMs
  const preEventCountdown = useMemo(
    () => formatCountdown((eventStartMs ?? now) - now),
    [eventStartMs, now]
  )

  useEffect(() => {
    if (!hasAttendance || holdStartedAt || !hasEventStarted) return

    const startedAt = Date.now()
    setHoldStartedAt(startedAt)
    persistProgress({ holdStartedAt: startedAt })
  }, [hasAttendance, holdStartedAt, hasEventStarted, persistProgress])

  const holdEndsAt = holdStartedAt ? holdStartedAt + HOLD_DURATION_MS : null
  const holdRemainingMs = holdEndsAt ? Math.max(0, holdEndsAt - now) : HOLD_DURATION_MS
  const holdCountdown = useMemo(() => formatCountdown(holdRemainingMs), [holdRemainingMs])

  const phase: WaitroomPhase = useMemo(() => {
    if (!hasEventStarted) return 'countdown'
    if (!hasAttendance) return 'attendance'
    if (holdRemainingMs <= REDIRECT_ANIMATION_MS) return 'redirecting'
    return 'holding'
  }, [hasAttendance, hasEventStarted, holdRemainingMs])

  useEffect(() => {
    if (phase !== 'holding') return

    const interval = setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % PROCESS_SLIDES.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 'redirecting' || !event?.zoomInvite || redirectTriggeredRef.current) return
    if (holdRemainingMs > 0) return

    redirectTriggeredRef.current = true
    window.location.assign(event.zoomInvite)
  }, [event, phase, holdRemainingMs])

  useEffect(() => {
    if (!productId || !productType) return
    if (phase !== 'holding' && phase !== 'redirecting') return

    const sessionId = getOrCreateSessionId(productId, isTestMode)

    let cancelled = false
    const sendHeartbeat = async () => {
      try {
        const response = await fetch('/api/event-waitroom-heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            productId,
            productType,
            testMode: isTestMode,
          }),
        })

        if (!response.ok || cancelled) return
        const data = await response.json()
        if (!cancelled && typeof data.activePeopleCount === 'number') {
          setActivePeopleCount(data.activePeopleCount)
        }
      } catch {
        if (!cancelled) {
          setActivePeopleCount(1)
        }
      }
    }

    void sendHeartbeat()
    const interval = setInterval(() => {
      void sendHeartbeat()
    }, 8000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [phase, productId, productType, isTestMode])

  const handleSubmit = async () => {
    if (!productId || !event) return
    if (!firstName.trim() || !lastName.trim() || !gender || !age) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const preferredName = `${firstName.trim()} ${lastName.trim()} ${assignedEmoji}`
      const parsedAge = parseInt(age, 10)

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
          age: parsedAge,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to record attendance')
      }

      saveAttendanceCookie(productId, {
        preferredName,
        gender,
        age: parsedAge,
      })

      const startedAt = Date.now()
      setConfirmedName(preferredName)
      setHasAttendance(true)
      setSubmitStatus('success')
      setHoldStartedAt(startedAt)
      persistProgress({
        confirmedName: preferredName,
        gender,
        age: parsedAge,
        holdStartedAt: startedAt,
      })
    } catch (submitError) {
      console.error('Attendance submission failed:', submitError)
      setSubmitStatus('error')
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

  if (error || !productId || !productType || !event || eventStartMs === null) {
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

  if (phase === 'redirecting') {
    return (
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] text-slate-900">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-orange-200/70 bg-white/85 p-10 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
              <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900">
              You are being directed to the Zoom Event
            </h1>
            <p className="mb-6 text-lg text-slate-600">
              Hold tight. You&apos;ll be directed to Zoom in {Math.max(0, Math.ceil(holdRemainingMs / 1000))} seconds.
            </p>
            <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-orange-100">
              <div className="h-full w-1/3 animate-[loading-bar_0.9s_ease-in-out_infinite] rounded-full bg-orange-500" />
            </div>
            <p className="mt-6 text-sm text-slate-500">
              If redirect doesn&apos;t work, click below.
            </p>
            <div className="mt-4">
              <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
                <a href={event.zoomInvite}>Click here to open Zoom</a>
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

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fdba74_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-orange-200/70 bg-white/85 p-8 shadow-2xl backdrop-blur">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
              <Video className="h-4 w-4" />
              Event Waitroom {isTestMode ? '· Test Mode' : ''}
            </div>

            <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-900">
              {event.title}
            </h1>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Your Local Date & Time</p>
                <p className="text-lg font-semibold text-slate-900">{localTimeLabel}</p>
                <p className="mt-2 text-xs text-slate-500">
                  This is shown in your computer&apos;s local date and time.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Status</p>
                <p className="text-lg font-semibold text-slate-900">
                  {phase === 'countdown' && 'Counting down to attendance'}
                  {phase === 'attendance' && 'Attendance form is open'}
                  {phase === 'holding' && 'Waiting room is live'}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {isTestMode ? 'Test mode uses a 1-minute event countdown from page load.' : 'Normal mode uses the real event start time.'}
                </p>
              </div>
            </div>

            {phase === 'countdown' && (
              <div className="mt-8 rounded-[1.75rem] bg-slate-950 p-8 text-white shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <Clock3 className="h-6 w-6 text-orange-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                    Countdown To Attendance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Days', value: preEventCountdown.days },
                    { label: 'Hours', value: preEventCountdown.hours },
                    { label: 'Minutes', value: preEventCountdown.minutes },
                    { label: 'Seconds', value: preEventCountdown.seconds },
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
                  When this reaches zero, attendees will fill the attendance form before entering the pre-Zoom waiting room.
                </p>
              </div>
            )}

            {phase === 'attendance' && (
              <div className="mt-8 rounded-[1.75rem] border border-green-200 bg-green-50 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-6 w-6 text-green-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Attendance is now open</h2>
                    <p className="mt-2 text-slate-600">
                      Complete the form, then you&apos;ll enter a 10-minute waiting room before Zoom opens.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {phase === 'holding' && (
              <div className="mt-8 rounded-[1.75rem] bg-slate-950 p-8 text-white shadow-xl">
                <div className="mb-5 flex items-center gap-3">
                  <Users className="h-6 w-6 text-orange-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                    Waiting Room
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-100">People Here Now</p>
                    <p className="mt-2 text-4xl font-black">{activePeopleCount}</p>
                    <p className="mt-2 text-sm text-slate-300">Tracked with a live heartbeat from everyone in this wait room.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-100">Zoom Opens In</p>
                    <p className="mt-2 text-4xl font-black">
                      {String(holdCountdown.minutes).padStart(2, '0')}:
                      {String(holdCountdown.seconds).padStart(2, '0')}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">At 10 seconds to go, we&apos;ll show the redirect countdown and your backup Zoom link.</p>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                  <div className="relative aspect-[16/10] w-full bg-black/10">
                    <Image
                      src={PROCESS_SLIDES[activeSlideIndex].src}
                      alt={PROCESS_SLIDES[activeSlideIndex].alt}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="border-t border-white/10 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-100">
                      How This Works
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {PROCESS_SLIDES[activeSlideIndex].caption}
                    </p>
                    <div className="mt-4 flex gap-2">
                      {PROCESS_SLIDES.map((slide, index) => (
                        <button
                          key={slide.src}
                          type="button"
                          aria-label={`Show instruction slide ${index + 1}`}
                          className={`h-2.5 flex-1 rounded-full transition ${
                            index === activeSlideIndex ? 'bg-orange-400' : 'bg-white/20'
                          }`}
                          onClick={() => setActiveSlideIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm text-slate-300">
                  Attendance confirmed for {confirmedName || 'you'}. Stay here and we&apos;ll send you into Zoom automatically.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-orange-200/70 bg-white/85 p-8 shadow-2xl backdrop-blur">
            {phase === 'countdown' && (
              <>
                <h2 className="text-2xl font-black text-slate-900">You&apos;re in the right place</h2>
                <p className="mt-3 text-slate-600">
                  This page is using your local device time for display. Once the countdown ends, the attendance form will appear here.
                </p>
                <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">What happens next</p>
                  <p className="mt-2">1. Countdown reaches zero.</p>
                  <p>2. Attendance form appears.</p>
                  <p>3. You enter the waiting room for 10 minutes.</p>
                  <p>4. You are automatically directed to Zoom.</p>
                </div>
              </>
            )}

            {phase === 'attendance' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Confirm your attendance</h2>
                  <p className="mt-2 text-slate-600">
                    We&apos;ll save this on the device so returning visitors can skip re-entering their details in normal mode.
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
                      'Confirm Attendance'
                    )}
                  </Button>
                </div>
              </>
            )}

            {phase === 'holding' && (
              <>
                <h2 className="text-2xl font-black text-slate-900">You&apos;re checked in</h2>
                <p className="mt-3 text-slate-600">
                  We&apos;ll keep updating the live room count while you wait. The images rotate to show you how breakout rooms and pairings will look.
                </p>
                <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Current room snapshot</p>
                  <p className="mt-2">Name on file: {confirmedName}</p>
                  <p>People currently waiting: {activePeopleCount}</p>
                  <p>Auto-redirect countdown begins 10 seconds before Zoom opens.</p>
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
