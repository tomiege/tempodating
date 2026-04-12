'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RoundResult } from '@/app/admin/attendance/utils/types'
import { Volume2, VolumeX } from 'lucide-react'

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

const MUSIC_TRACKS = [
  '/auto-host/music/backgroundmusicforvideos-lounge-jazz-elevator-music-425314.mp3',
  '/auto-host/music/ikoliks_aj-lounge-jazz-elevator-music-342629.mp3',
  '/auto-host/music/mfcc-lounge-jazz-elevator-music-372734.mp3',
  '/auto-host/music/tatamusic-lounge-jazz-elevator-music-380054.mp3',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function DisplayView({ productId }: { productId: string }) {
  const [session, setSession] = useState<EventSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [muted, setMuted] = useState(false)
  const [musicUnlocked, setMusicUnlocked] = useState(false)

  const welcomeRef = useRef<HTMLVideoElement>(null)
  const goodbyeRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevPhaseRef = useRef<string | null>(null)
  const playlistRef = useRef<string[]>(shuffle(MUSIC_TRACKS))
  const trackIdxRef = useRef(0)

  // ── Music helpers ────────────────────────────────────────────────────────────
  const playNextTrack = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    trackIdxRef.current = (trackIdxRef.current + 1) % playlistRef.current.length
    // Re-shuffle when we've cycled through all tracks
    if (trackIdxRef.current === 0) playlistRef.current = shuffle(MUSIC_TRACKS)
    audio.src = playlistRef.current[trackIdxRef.current]
    audio.play().catch(() => {})
  }, [])

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(playlistRef.current[0])
    audio.volume = 0.4
    audio.addEventListener('ended', playNextTrack)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeEventListener('ended', playNextTrack)
    }
  }, [playNextTrack])

  // Sync muted state
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  // Try autoplay on mount — browsers may block it until interaction
  useEffect(() => {
    audioRef.current?.play()
      .then(() => setMusicUnlocked(true))
      .catch(() => {
        // Will be unlocked on first user interaction
        const unlock = () => {
          audioRef.current?.play()
            .then(() => { setMusicUnlocked(true); document.removeEventListener('click', unlock) })
            .catch(() => {})
        }
        document.addEventListener('click', unlock)
        return () => document.removeEventListener('click', unlock)
      })
  }, [])

  // Pause/resume music based on phase
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !musicUnlocked) return
    const phase = session?.phase ?? 'idle'
    if (phase === 'welcome' || phase === 'goodbye') {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [session?.phase, musicUnlocked])

  // Clock tick for round timer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Poll session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/auto-host/${productId}`, { cache: 'no-store' })
        const data = await res.json()
        setSession(data.session)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
    const id = setInterval(fetchSession, 2000)
    return () => clearInterval(id)
  }, [productId])

  // Auto-play video when phase changes
  useEffect(() => {
    if (!session) return
    if (session.phase === 'welcome' && prevPhaseRef.current !== 'welcome') {
      welcomeRef.current?.play().catch(() => {})
    }
    if (session.phase === 'goodbye' && prevPhaseRef.current !== 'goodbye') {
      goodbyeRef.current?.play().catch(() => {})
    }
    prevPhaseRef.current = session.phase
  }, [session?.phase])

  // Round countdown
  const roundTimeLeft = (() => {
    if (!session?.roundStartTime || session.phase !== 'round') return null
    const totalMs = session.roundDurationMinutes * 60 * 1000
    const elapsed = now - session.roundStartTime
    const remaining = Math.max(0, totalMs - elapsed)
    return {
      m: Math.floor(remaining / 60000),
      s: Math.floor((remaining % 60000) / 1000),
      pct: Math.min(100, (elapsed / totalMs) * 100),
    }
  })()

  // Reminder overlay — shown on top of any phase for 10 seconds
  const showReminder = session?.reminder === 'registration' &&
    session.reminderUntil != null &&
    now < session.reminderUntil

  const ReminderOverlay = () => showReminder ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl px-12 py-10 max-w-xl w-full mx-6 text-center">
        <div className="text-6xl mb-5">📋</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
          Please fill in the attendance form
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          To be included in tonight's pairings, fill in the attendance form.
        </p>
        <p className="text-lg font-semibold text-orange-600 mt-3">
          The link is posted in this meeting's group chat.
        </p>
      </div>
    </div>
  ) : null

  // Mute toggle button (shown in corner on all phases)
  const MuteBtn = () => (
    <button
      onClick={() => setMuted(v => !v)}
      className="fixed bottom-4 right-4 z-50 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
      title={muted ? 'Unmute music' : 'Mute music'}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  )

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
        <ReminderOverlay />
        <MuteBtn />
      </div>
    )
  }

  // ─── Idle / no session ────────────────────────────────────────────────────────
  if (!session || session.phase === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-orange-800 to-orange-950 flex items-center justify-center">
        <div className="text-center text-white px-6">
          <div className="text-7xl mb-8">💛</div>
          <h1 className="text-5xl font-bold mb-4">Welcome to Speed Dating!</h1>
          <p className="text-xl text-orange-200 mb-10">Get ready — the event is about to begin.</p>
          <div className="flex gap-3 justify-center">
            {[0, 150, 300].map(delay => (
              <div key={delay} className="w-3 h-3 rounded-full bg-orange-300 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        </div>
        <ReminderOverlay />
        <MuteBtn />
      </div>
    )
  }

  // ─── Welcome video ────────────────────────────────────────────────────────────
  if (session.phase === 'welcome') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <video ref={welcomeRef} src="/auto-host/welcome.mp4"
          className="max-h-screen max-w-full w-full" autoPlay playsInline />
        <ReminderOverlay />
        <MuteBtn />
      </div>
    )
  }

  // ─── Goodbye video ────────────────────────────────────────────────────────────
  if (session.phase === 'goodbye') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <video ref={goodbyeRef} src="/auto-host/goodbye.mp4"
          className="max-h-screen max-w-full w-full" autoPlay playsInline />
        <ReminderOverlay />
        <MuteBtn />
      </div>
    )
  }

  // ─── Round pairings ───────────────────────────────────────────────────────────
  if (session.phase === 'round') {
    const roundResult = session.rounds[session.currentRound - 1]
    if (!roundResult) return null

    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-orange-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-800">Round {session.currentRound}</span>
              <span className="text-gray-400 text-sm">of {session.totalRounds}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: session.totalRounds }, (_, i) => i + 1).map(r => (
                <div key={r} className={`rounded-full transition-all ${
                  r < session.currentRound ? 'w-2 h-2 bg-green-500' :
                  r === session.currentRound ? 'w-3 h-3 bg-blue-600' : 'w-2 h-2 bg-gray-300'
                }`} />
              ))}
            </div>
            {roundTimeLeft && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 bg-gray-200 rounded-full h-2 hidden sm:block">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${100 - roundTimeLeft.pct}%` }} />
                </div>
                <span className="font-mono text-sm font-bold text-blue-700">
                  {roundTimeLeft.m}:{String(roundTimeLeft.s).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roundResult.pairings.map((p, i) => (
              <div key={`${p.male_id}-${p.female_id}`} className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm p-4">
                <div className="text-center font-bold text-blue-800 text-base mb-3 bg-blue-50 rounded-xl py-1.5">
                  Room {i + 1}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1 text-center min-w-0">
                    <div className="font-bold text-gray-800 text-lg leading-tight break-words">{p.male_name}</div>
                  </div>
                  <div className="text-3xl shrink-0">💙</div>
                  <div className="flex-1 text-center min-w-0">
                    <div className="font-bold text-gray-800 text-lg leading-tight break-words">{p.female_name}</div>
                  </div>
                </div>
              </div>
            ))}
            {roundResult.byes.map(b => (
              <div key={b.attendee_id} className="bg-yellow-50 rounded-2xl border-2 border-yellow-200 shadow-sm p-4 text-center">
                <div className="text-yellow-700 font-semibold text-base mb-2">Taking a Break ☕</div>
                <div className="font-bold text-yellow-900 text-lg">{b.attendee_name}</div>
              </div>
            ))}
          </div>
        </div>
        <ReminderOverlay />
        <MuteBtn />
      </div>
    )
  }

  return null
}
