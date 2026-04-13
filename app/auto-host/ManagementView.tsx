'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Play,
  Eye,
  EyeOff,
  ChevronRight,
  RefreshCw,
  Video,
  StopCircle,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { runSpeedDatingEvent, runGaySpeedDatingEvent } from '@/app/admin/attendance/utils/speedDating'
import { parseNameAndEmoji } from '@/app/admin/attendance/utils/nameParser'
import { Attendee, RoundResult } from '@/app/admin/attendance/utils/types'
import { EventEntry } from './page'

interface EventSession {
  productId: string
  phase: 'idle' | 'welcome' | 'round' | 'goodbye'
  currentRound: number
  totalRounds: number
  roundDurationMinutes: number
  rounds: RoundResult[]
  autoMode: boolean
  roundStartTime: number | null
  welcomeShown: boolean
  goodbyeShown: boolean
  isGayEvent: boolean
  reminder: 'registration' | null
  reminderUntil: number | null
}

interface AttendanceRecord {
  id: string
  attendeeName: string
  preferredName: string | null
  productId: string | null
  gender: string | null
  age: number | null
}

function getGridDimensions(count: number): { cols: number; rows: number } {
  if (count === 0) return { cols: 1, rows: 1 }
  const cols =
    count === 1 ? 1 :
    count <= 4 ? 2 :
    count <= 9 ? 3 :
    count <= 16 ? 4 :
    Math.ceil(Math.sqrt(count * 1.4))
  return { cols, rows: Math.ceil(count / cols) }
}

// Coloured status dot for sidebar
function SessionDot({ session }: { session: EventSession | undefined }) {
  if (!session) return <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0 inline-block" />
  if (session.phase === 'idle') return <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 inline-block" />
  if (session.phase === 'goodbye') return <span className="w-2 h-2 rounded-full bg-pink-400 shrink-0 inline-block" />
  // welcome or round — pulsing green
  return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 inline-block animate-pulse" />
}

export default function ManagementView({ events }: { events: EventEntry[] }) {
  const [selectedEvent, setSelectedEvent] = useState<EventEntry | null>(null)
  const [now, setNow] = useState(Date.now())

  // All sessions (for sidebar status dots)
  const [allSessions, setAllSessions] = useState<Record<string, EventSession>>({})

  // Config
  const [numRounds, setNumRounds] = useState(8)
  const [roundDuration, setRoundDuration] = useState(5)
  const [autoMode, setAutoMode] = useState(true)
  const [isGayEvent, setIsGayEvent] = useState(false)

  // Attendees + pairings
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [excludedAttendees, setExcludedAttendees] = useState<Set<string>>(new Set())
  const [pairings, setPairings] = useState<RoundResult[] | null>(null)
  const [generatingPairings, setGeneratingPairings] = useState(false)

  // Selected event session
  const [session, setSession] = useState<EventSession | null>(null)
  const [startingSession, setStartingSession] = useState(false)

  // UI
  const [previewRound, setPreviewRound] = useState<number | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Pairing visibility
  const [hiddenPairings, setHiddenPairings] = useState<Set<string>>(new Set())
  const [hideByes, setHideByes] = useState(false)

  // Video durations
  const [welcomeDuration, setWelcomeDuration] = useState<number>(180)
  const [goodbyeDuration, setGoodbyeDuration] = useState<number>(60)

  const sessionRef = useRef<EventSession | null>(null)
  sessionRef.current = session

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Load video metadata to refine defaults
  useEffect(() => {
    const load = (src: string, set: (n: number) => void) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.src = src
      v.onloadedmetadata = () => set(v.duration)
    }
    load('/auto-host/welcome.mp4', setWelcomeDuration)
    load('/auto-host/goodbye.mp4', setGoodbyeDuration)
  }, [])

  // Poll all sessions for sidebar status dots
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/auto-host')
        const data = await res.json()
        setAllSessions(data.sessions ?? {})
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  // Load + poll selected event session
  useEffect(() => {
    if (!selectedEvent) return
    loadSession()
    const id = setInterval(loadSession, 3000)
    return () => clearInterval(id)
  }, [selectedEvent?.productId])

  // Set gay mode from product type
  useEffect(() => {
    if (selectedEvent) setIsGayEvent(selectedEvent.productType === 'onlineSpeedDatingGay')
  }, [selectedEvent?.productId])

  // Round timer + auto-advance
  useEffect(() => {
    if (!session || session.phase !== 'round' || !session.roundStartTime) {
      setTimeLeft(null); return
    }
    const tick = () => {
      const s = sessionRef.current
      if (!s || s.phase !== 'round' || !s.roundStartTime) { setTimeLeft(null); return }
      const elapsed = Date.now() - s.roundStartTime
      const totalMs = s.roundDurationMinutes * 60 * 1000
      const remaining = Math.max(0, totalMs - elapsed)
      setTimeLeft(remaining)
      if (remaining === 0 && s.autoMode) autoAdvance(s)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session?.currentRound, session?.roundStartTime, session?.phase])

  const loadSession = async () => {
    if (!selectedEvent) return
    try {
      const res = await fetch(`/api/auto-host/${selectedEvent.productId}`)
      const data = await res.json()
      setSession(data.session)
      if (data.session && previewRound === null) {
        const next = data.session.phase === 'round' ? data.session.currentRound + 1 : 1
        if (next <= data.session.totalRounds) setPreviewRound(next)
      }
    } catch (e) { console.error(e) }
  }

  const loadAttendees = async (productId: number) => {
    setLoadingAttendees(true)
    try {
      const res = await fetch('/api/attendance')
      const data = await res.json()
      setAttendees((data.attendances || []).filter(
        (a: AttendanceRecord) => String(a.productId) === String(productId)
      ))
    } catch (e) { console.error(e) }
    finally { setLoadingAttendees(false) }
  }

  const generatePairings = () => {
    if (!attendees.length) return
    setGeneratingPairings(true)
    try {
      const parsed: Attendee[] = attendees
        .filter(a => a.gender && a.age && !excludedAttendees.has(a.id))
        .map(a => {
          const { name, emoji } = parseNameAndEmoji(a.preferredName)
          const displayName = a.preferredName
            ? emoji ? `${emoji} ${name || a.attendeeName}` : (name || a.attendeeName)
            : a.attendeeName
          return { id: a.id, name: displayName, age: a.age!, gender: a.gender === 'male' ? 'M' : 'F' }
        })
      const rounds = isGayEvent
        ? runGaySpeedDatingEvent(parsed.filter(a => a.gender === 'M'), numRounds).rounds
        : runSpeedDatingEvent(parsed, numRounds).rounds
      setPairings(rounds)
      setPreviewRound(1)
      setHiddenPairings(new Set())
      setHideByes(false)
    } catch (e) { console.error(e) }
    finally { setGeneratingPairings(false) }
  }

  const patchSession = useCallback(async (updates: Partial<EventSession>): Promise<EventSession | null> => {
    if (!selectedEvent) return null
    try {
      const res = await fetch(`/api/auto-host/${selectedEvent.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      setSession(data.session)
      return data.session
    } catch (e) { console.error(e); return null }
  }, [selectedEvent?.productId])

  const autoAdvance = useCallback(async (s: EventSession) => {
    const next = s.currentRound + 1
    if (next > s.totalRounds) {
      await patchSession({ phase: 'goodbye', goodbyeShown: true })
    } else {
      await patchSession({ phase: 'round', currentRound: next, roundStartTime: Date.now() })
      setPreviewRound(Math.min(next + 1, s.totalRounds))
    }
  }, [patchSession])

  const startSession = async () => {
    if (!selectedEvent || !pairings) return
    setStartingSession(true)
    try {
      const filteredRounds = pairings.map(round => ({
        ...round,
        pairings: round.pairings.filter(p => !hiddenPairings.has(`${round.round}|${p.male_id}|${p.female_id}`)),
        byes: hideByes ? [] : round.byes,
      }))
      const res = await fetch(`/api/auto-host/${selectedEvent.productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalRounds: numRounds, roundDurationMinutes: roundDuration, autoMode, isGayEvent, rounds: filteredRounds }),
      })
      const data = await res.json()
      setSession(data.session)
      setPreviewRound(1)
    } finally { setStartingSession(false) }
  }

  const stopSession = async () => {
    if (!selectedEvent) return
    await fetch(`/api/auto-host/${selectedEvent.productId}`, { method: 'DELETE' })
    setSession(null); setPairings(null); setPreviewRound(null)
    setHiddenPairings(new Set()); setHideByes(false); setExcludedAttendees(new Set())
  }

  const togglePairing = (roundNum: number, maleId: string, femaleId: string) => {
    const key = `${roundNum}|${maleId}|${femaleId}`
    setHiddenPairings(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const showWelcomeVideo = () => patchSession({ phase: 'welcome', welcomeShown: true })
  const broadcastRound = (roundNum: number) => {
    setPreviewRound(Math.min(roundNum + 1, session?.totalRounds ?? roundNum))
    return patchSession({ phase: 'round', currentRound: roundNum, roundStartTime: Date.now() })
  }
  const showGoodbyeVideo = () => patchSession({ phase: 'goodbye', goodbyeShown: true })

  const formatCountdown = (gmtdatetime: string): string => {
    const diff = new Date(gmtdatetime).getTime() - now
    if (diff < 0) return 'ended'
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const formatStartTime = (gmtdatetime: string, timezone: string): string => {
    const date = new Date(gmtdatetime)
    return date.toLocaleString('en-US', {
      timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  const roundMatchCounts = (allRounds: RoundResult[], beforeIdx: number) => {
    const counts = new Map<string, number>()
    for (let i = 0; i < beforeIdx; i++) {
      allRounds[i].pairings.forEach(p => {
        counts.set(p.male_id, (counts.get(p.male_id) || 0) + 1)
        counts.set(p.female_id, (counts.get(p.female_id) || 0) + 1)
      })
    }
    return counts
  }

  const timerDisplay = timeLeft !== null && session ? {
    m: Math.floor(timeLeft / 60000),
    s: Math.floor((timeLeft % 60000) / 1000),
    pct: Math.min(100, ((session.roundDurationMinutes * 60000 - timeLeft) / (session.roundDurationMinutes * 60000)) * 100),
  } : null

  const sorted = [...events].sort((a, b) => new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime())
  const roundsSource = session?.rounds ?? pairings ?? []
  const nextRound = session
    ? (session.phase === 'idle' || session.phase === 'welcome') ? 1 : session.currentRound + 1
    : 1

  // ─── Full layout ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-white via-orange-50 to-orange-100">

      {/* ── Sidebar ── */}
      <div className="w-56 shrink-0 border-r border-orange-200 bg-white/70 flex flex-col">
        <div className="p-3 border-b border-orange-200">
          <h1 className="font-bold text-gray-800 text-base">Auto Host</h1>
          <p className="text-xs text-gray-400 mt-0.5">Select an event</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sorted.map(event => {
            const isPast = new Date(event.gmtdatetime).getTime() < now
            const sesh = allSessions[String(event.productId)]
            const isSelected = selectedEvent?.productId === event.productId
            return (
              <button
                key={event.productId}
                onClick={() => {
                  if (isSelected) return
                  setSelectedEvent(event)
                  setSession(null); setPairings(null); setPreviewRound(null)
                  setHiddenPairings(new Set()); setHideByes(false); setExcludedAttendees(new Set())
                  loadAttendees(event.productId)
                }}
                className={`w-full text-left rounded-lg px-2 py-2 flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-orange-100 border border-orange-300'
                    : 'hover:bg-orange-50 border border-transparent'
                } ${isPast && !sesh ? 'opacity-40' : ''}`}
              >
                <SessionDot session={sesh} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
                    {event.city}
                  </div>
                  <div className="text-xs text-gray-400 truncate leading-tight" suppressHydrationWarning>
                    {sesh
                      ? sesh.phase === 'round' ? `R${sesh.currentRound}/${sesh.totalRounds}` :
                        sesh.phase === 'welcome' ? 'Welcome' :
                        sesh.phase === 'goodbye' ? 'Goodbye' : 'Idle'
                      : isPast ? 'ended' : formatCountdown(event.gmtdatetime)
                    }
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main area ── */}
      {!selectedEvent ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Select an event from the sidebar
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex flex-col p-4 gap-3 overflow-hidden">

          {/* Event header */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-800 truncate">
                {selectedEvent.title} — {selectedEvent.city}
              </h2>
              <div className="text-xs text-gray-500">
                {formatStartTime(selectedEvent.gmtdatetime, selectedEvent.timezone)} · ID: {selectedEvent.productId} ·{' '}
                <span className="font-mono text-orange-600" suppressHydrationWarning>{formatCountdown(selectedEvent.gmtdatetime)}</span>
              </div>
            </div>
            <a
              href={`/auto-host?productId=${selectedEvent.productId}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
            >
              <ExternalLink className="w-3 h-3" /> Participant view
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://tempodating.com/attendance?productId=${selectedEvent.productId}`)
              }}
              className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded px-2 py-1 shrink-0 transition-colors"
              title="Copy attendance link"
            >
              <Copy className="w-3 h-3" /> Copy attendance link
            </button>
          </div>

          {/* Controls + preview */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">

            {/* ── Controls column ── */}
            <div className="overflow-y-auto space-y-3 pr-1">

              {/* Setup */}
              {!session && (
                <Card className="p-4 bg-white/80 border-orange-100">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Session Setup</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-24">Rounds</label>
                      <Input type="number" min={1} max={20} value={numRounds}
                        onChange={e => setNumRounds(parseInt(e.target.value) || 8)} className="w-20 h-8 text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-24">Duration (min)</label>
                      <Input type="number" min={1} max={30} value={roundDuration}
                        onChange={e => setRoundDuration(parseInt(e.target.value) || 5)} className="w-20 h-8 text-sm" />
                    </div>
                    {/* ETA */}
                    {(() => {
                      const total = Math.round((welcomeDuration + numRounds * roundDuration * 60 + goodbyeDuration) / 60)
                      const h = Math.floor(total / 60), m = total % 60
                      return (
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-gray-600 w-24 pt-0.5">ETA</span>
                          <div>
                            <span className="text-sm font-semibold text-orange-700">
                              ~{h > 0 ? `${h}h ${m}m` : `${m}m`}
                            </span>
                            <div className="text-xs text-gray-400">
                              {Math.round(welcomeDuration / 60)}m + {numRounds}×{roundDuration}m + {Math.round(goodbyeDuration / 60)}m
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-24">Auto mode</label>
                      <button onClick={() => setAutoMode(v => !v)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${autoMode ? 'bg-green-100 border-green-400 text-green-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                        {autoMode ? '✓ Auto' : 'Manual'}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-24">Mode</label>
                      <button onClick={() => setIsGayEvent(v => !v)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${isGayEvent ? 'bg-purple-100 border-purple-400 text-purple-800' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                        {isGayEvent ? '🏳️‍🌈 Gay' : '👥 Mixed'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {loadingAttendees ? '...' : (
                          <>
                            {attendees.filter(a => a.gender && a.age && !excludedAttendees.has(a.id)).length} active
                            {excludedAttendees.size > 0 && <span className="text-red-500"> · {excludedAttendees.size} excluded</span>}
                            {' / '}{attendees.length} total
                          </>
                        )}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => loadAttendees(selectedEvent.productId)} disabled={loadingAttendees}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Reload
                      </Button>
                    </div>

                    {/* Attendee list with exclude toggles */}
                    {attendees.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1.5 bg-gray-50">
                        {[...attendees].sort((a, b) => {
                          const nameA = (parseNameAndEmoji(a.preferredName).name || a.attendeeName).toLowerCase()
                          const nameB = (parseNameAndEmoji(b.preferredName).name || b.attendeeName).toLowerCase()
                          return nameA.localeCompare(nameB) || (a.age ?? 0) - (b.age ?? 0)
                        }).map(a => {
                          const { name, emoji } = parseNameAndEmoji(a.preferredName)
                          const displayName = a.preferredName
                            ? (name || a.attendeeName)
                            : a.attendeeName
                          const excluded = excludedAttendees.has(a.id)
                          const invalid = !a.gender || !a.age
                          return (
                            <div
                              key={a.id}
                              className={`flex items-center justify-between gap-2 px-2 py-1 rounded text-xs ${
                                excluded ? 'bg-red-50 border border-red-200' :
                                invalid ? 'bg-gray-100 border border-gray-200 opacity-50' :
                                'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {emoji && <span>{emoji}</span>}
                                <span className={`font-medium truncate ${excluded ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {displayName}
                                </span>
                                <span className="text-gray-400 shrink-0">
                                  {a.gender === 'male' ? '♂' : a.gender === 'female' ? '♀' : '?'}
                                  {a.age ? ` ${a.age}` : ''}
                                </span>
                              </div>
                              <button
                                onClick={() => setExcludedAttendees(prev => {
                                  const next = new Set(prev)
                                  if (next.has(a.id)) { next.delete(a.id) } else { next.add(a.id) }
                                  return next
                                })}
                                className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-medium transition-colors ${
                                  excluded
                                    ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                                }`}
                              >
                                {excluded ? 'restore' : 'exclude'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <Button className="w-full bg-purple-500 hover:bg-purple-600 h-8 text-xs" onClick={generatePairings}
                      disabled={generatingPairings || attendees.filter(a => a.gender && a.age && !excludedAttendees.has(a.id)).length < 2}>
                      {generatingPairings ? 'Generating...' : `Generate ${numRounds} Rounds`}
                    </Button>
                    {pairings && (
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 h-8 text-xs" onClick={startSession} disabled={startingSession}>
                        <Play className="w-3 h-3 mr-1" />
                        {startingSession ? 'Starting...' : 'Start Session'}
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Session controls */}
              {session && (
                <Card className="p-3 bg-white/80 border-orange-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-700 text-sm">Controls</h3>
                    <Badge variant={session.phase === 'round' ? 'default' : session.phase === 'idle' ? 'secondary' : 'outline'} className="text-xs">
                      {session.phase === 'idle' ? 'Idle' :
                       session.phase === 'welcome' ? 'Welcome' :
                       session.phase === 'round' ? `R${session.currentRound}/${session.totalRounds}` : 'Goodbye'}
                    </Badge>
                  </div>

                  {/* Phase status */}
                  <div className="flex flex-wrap gap-1 mb-3 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${session.welcomeShown ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {session.welcomeShown ? '✅' : '⬜'} W
                    </span>
                    {Array.from({ length: session.totalRounds }, (_, i) => i + 1).map(r => (
                      <span key={r} className={`px-1.5 py-0.5 rounded ${
                        r < session.currentRound && session.phase !== 'idle' ? 'bg-green-100 text-green-800' :
                        r === session.currentRound && session.phase === 'round' ? 'bg-blue-200 text-blue-900 font-bold' :
                        'bg-gray-100 text-gray-500'}`}>
                        {r < session.currentRound && session.phase !== 'idle' ? '✅' :
                         r === session.currentRound && session.phase === 'round' ? '▶' : r}
                      </span>
                    ))}
                    <span className={`px-1.5 py-0.5 rounded ${session.goodbyeShown ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {session.goodbyeShown ? '✅' : '⬜'} G
                    </span>
                  </div>

                  {/* Auto timer */}
                  {timerDisplay && session.autoMode && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-700">Next round in</span>
                        <span className="font-mono font-bold text-blue-800">
                          {timerDisplay.m}:{String(timerDisplay.s).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${timerDisplay.pct}%` }} />
                      </div>
                      <button
                        onClick={() => session && autoAdvance(session)}
                        className="mt-1.5 w-full text-xs text-blue-700 hover:text-blue-900 hover:underline text-center"
                      >
                        Skip to next round →
                      </button>
                    </div>
                  )}

                  {/* Manual controls */}
                  {!session.autoMode && (
                    <div className="space-y-1.5 mb-3">
                      {!session.welcomeShown && (
                        <Button className="w-full bg-blue-500 hover:bg-blue-600 h-8 text-xs" onClick={showWelcomeVideo}>
                          <Video className="w-3 h-3 mr-1" /> Welcome Video
                        </Button>
                      )}
                      {nextRound <= session.totalRounds && (
                        <>
                          <Button variant="outline" className="w-full h-8 text-xs border-gray-300"
                            onClick={() => setPreviewRound(nextRound)} disabled={previewRound === nextRound}>
                            <Eye className="w-3 h-3 mr-1" /> Preview R{nextRound}
                          </Button>
                          <Button className="w-full bg-purple-500 hover:bg-purple-600 h-8 text-xs" onClick={() => broadcastRound(nextRound)}>
                            <ChevronRight className="w-3 h-3 mr-1" /> Broadcast R{nextRound}
                          </Button>
                        </>
                      )}
                      {nextRound > session.totalRounds && !session.goodbyeShown && (
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 h-8 text-xs" onClick={showGoodbyeVideo}>
                          <Video className="w-3 h-3 mr-1" /> Goodbye Video
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Auto triggers */}
                  {session.autoMode && (
                    <div className="space-y-1.5 mb-3">
                      {session.phase === 'idle' && !session.welcomeShown && (
                        <Button className="w-full bg-blue-500 hover:bg-blue-600 h-8 text-xs" onClick={showWelcomeVideo}>
                          <Video className="w-3 h-3 mr-1" /> Welcome Video
                        </Button>
                      )}
                      {session.phase === 'welcome' && (
                        <Button className="w-full bg-purple-500 hover:bg-purple-600 h-8 text-xs" onClick={() => broadcastRound(1)}>
                          <ChevronRight className="w-3 h-3 mr-1" /> Start R1
                        </Button>
                      )}
                      {session.phase === 'round' && session.currentRound === session.totalRounds && !session.goodbyeShown && (
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 h-8 text-xs" onClick={showGoodbyeVideo}>
                          <Video className="w-3 h-3 mr-1" /> Goodbye Video
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Manual timer */}
                  {!session.autoMode && timerDisplay && (
                    <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">R{session.currentRound} elapsed</span>
                        <span className="font-mono font-bold text-blue-700">
                          {timerDisplay.m}:{String(timerDisplay.s).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${timerDisplay.pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setShowStats(v => !v)}>
                      {showStats ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      Stats
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={stopSession}>
                      <StopCircle className="w-3 h-3 mr-1" /> Stop
                    </Button>
                  </div>
                </Card>
              )}

              {/* Always-visible video buttons */}
              <Card className="p-3 bg-white/80 border-orange-100">
                <h3 className="font-semibold text-gray-700 text-xs mb-2 uppercase tracking-wide">Videos</h3>
                <div className="space-y-1.5">
                  <Button
                    className="w-full bg-blue-500 hover:bg-blue-600 h-8 text-xs"
                    onClick={showWelcomeVideo}
                  >
                    <Video className="w-3 h-3 mr-1" /> Welcome Video
                  </Button>
                  <Button
                    className="w-full bg-pink-500 hover:bg-pink-600 h-8 text-xs"
                    onClick={showGoodbyeVideo}
                  >
                    <Video className="w-3 h-3 mr-1" /> Goodbye Video
                  </Button>
                </div>
              </Card>

              {/* Reminder screens */}
              <Card className="p-3 bg-white/80 border-orange-100">
                <h3 className="font-semibold text-gray-700 text-xs mb-2 uppercase tracking-wide">Reminder Screens</h3>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 h-8 text-xs"
                  onClick={() => patchSession({ reminder: 'registration', reminderUntil: Date.now() + 10000 })}
                >
                  📋 Remind Registration
                </Button>
              </Card>
            </div>

            {/* ── Preview pane ── */}
            <div className="min-h-0 flex flex-col">
              {roundsSource.length > 0 && previewRound !== null ? (() => {
                const roundResult = roundsSource[previewRound - 1]
                if (!roundResult) return null
                const counts = roundMatchCounts(roundsSource, previewRound - 1)
                const visiblePairings = roundResult.pairings
                const visibleByes = hideByes ? [] : roundResult.byes
                const { cols, rows } = getGridDimensions(visiblePairings.length + visibleByes.length)

                return (
                  <Card className="p-3 bg-white/80 border-orange-100 flex flex-col h-full min-h-0">
                    <div className="flex items-center justify-between mb-2 shrink-0 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {session && previewRound === session.currentRound && session.phase === 'round' ? '▶ Live — ' : '👁 '}
                          Round {previewRound}
                          {session && previewRound !== session.currentRound && session.phase === 'round' && (
                            <span className="text-xs text-orange-500 ml-1 font-normal">not broadcast</span>
                          )}
                        </h3>
                        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none">
                          <input type="checkbox" checked={hideByes} onChange={e => setHideByes(e.target.checked)} className="rounded" />
                          Hide byes
                        </label>
                        {hiddenPairings.size > 0 && (
                          <button onClick={() => setHiddenPairings(new Set())} className="text-xs text-blue-600 hover:underline">
                            Show all ({hiddenPairings.size} hidden)
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: roundsSource.length }, (_, i) => i + 1).map(r => (
                          <button key={r} onClick={() => setPreviewRound(r)}
                            className={`w-6 h-6 text-xs rounded font-medium border transition-colors ${
                              r === previewRound ? 'bg-blue-600 text-white border-blue-600' :
                              session && r < session.currentRound && session.phase !== 'idle' ? 'bg-green-100 text-green-800 border-green-300' :
                              'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}>
                            {session && r < session.currentRound && session.phase !== 'idle' ? '✓' : r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0" style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                      gridTemplateRows: `repeat(${rows}, 1fr)`,
                      gap: '6px',
                    }}>
                      {visiblePairings.map((p, i) => {
                        const key = `${previewRound}|${p.male_id}|${p.female_id}`
                        const hidden = hiddenPairings.has(key)
                        return (
                          <div key={key} onClick={() => togglePairing(previewRound, p.male_id, p.female_id)}
                            className={`p-1.5 bg-blue-50 rounded border border-blue-200 cursor-pointer hover:border-blue-400 transition-opacity flex flex-col justify-center overflow-hidden ${hidden ? 'opacity-25' : ''}`}>
                            <div className="text-center font-bold text-blue-800 text-xs bg-blue-100 rounded py-0.5 mb-1 truncate">
                              Room {i + 1}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-center">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 text-xs leading-tight truncate">
                                  {p.male_name}{showStats && <span className="text-gray-400 font-normal"> ({counts.get(p.male_id) || 0})</span>}
                                </div>
                                {showStats && <div className="text-xs text-gray-500 truncate">{p.male_age}</div>}
                              </div>
                              <div className="text-blue-500 text-xs shrink-0">💙</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-800 text-xs leading-tight truncate">
                                  {p.female_name}{showStats && <span className="text-gray-400 font-normal"> ({counts.get(p.female_id) || 0})</span>}
                                </div>
                                {showStats && <div className="text-xs text-gray-500 truncate">{p.female_age}</div>}
                              </div>
                            </div>
                            {showStats && (
                              <div className="text-xs text-gray-400 mt-0.5 pt-0.5 border-t border-blue-200 text-center truncate">
                                Gap: {p.age_diff} | Cost: {p.cost.toFixed(0)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {visibleByes.map(b => (
                        <div key={b.attendee_id}
                          className="p-1.5 bg-yellow-50 rounded border border-yellow-200 flex flex-col justify-center text-center overflow-hidden">
                          <div className="text-xs font-bold text-yellow-800 truncate">Sitting Out</div>
                          <div className="font-semibold text-yellow-900 text-xs truncate">
                            {b.attendee_name}{showStats && <span className="text-yellow-600 font-normal"> ({counts.get(b.attendee_id) || 0})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })() : (
                <div className="flex items-center justify-center h-full rounded-xl border-2 border-dashed border-orange-200 text-gray-400 text-sm">
                  {session ? 'Select a round number above' : 'Generate pairings to preview rounds'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
