'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EventProduct {
  productId: number
  gmtdatetime: string
  title: string
  country: string
  city: string
  timezone: string
  productType: string
  duration_in_minutes: number
  soldOut: boolean
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  onlineSpeedDating: 'Speed Dating',
  onlineSpeedDatingGay: 'Gay Speed Dating',
  onlineSpeedDatingIndian: 'Indian Singles',
  onlineSpeedDatingJewish: 'Jewish Singles',
  onlineSpeedDatingMuslim: 'Muslim Singles',
  workshop: 'Workshop',
}

const SOP_STEPS = [
  'Music On',
  'Focus Mode On',
  'Mute Chat',
  'Mute attendees',
  'OBS banner',
  'Let in the attendees',
  'Immediately Spotlight My video I\'m sharing (Highlight only shows it to myself — Spotlight shows it to everyone and stops people from seeing other attendees)',
  'Remind people multiple times to do attendance form',
]

function getScript(productType: string): string {
  const gayScript = `Hello everyone, and thank you so much for joining us for today's Gay Online Speed Dating event! We're excited to have you all here, and we've got a fantastic session planned for you.

Before we dive in, we need to make sure everyone is accounted for. **I have just posted a link in the chat—please click that now to fill in your attendance.** This is the most important step so we can see exactly who is in the room and get the rotations started.

While you are doing that, I'll explain how the event will work:

- **Breakout Sessions:** You'll be placed into private breakout rooms for one-on-one sessions. Each chat will last about 5 minutes.
- **Guided Prompts:** To keep things moving, we will send out a conversation prompt every 30 seconds. These are just there to spark ideas and help you avoid any awkward silences—so don't feel pressured to answer them perfectly!
- **Rotation & Byes:** After 5 minutes, you'll be moved to your next match. If you don't see your name on a specific pairing, it just means you have a 'BYE' for that round. Take that time to grab a drink, stretch, and relax; your next match will be only a moment away.

Make sure you have a piece of paper handy to jot down the names of the people you enjoyed chatting with. After the event, you'll receive an email to submit your favorites. If the interest is mutual, we'll send over the contact details!

Most importantly: just relax! I know these things can be a little nerve-wracking, but we're all here for the same reason. Just be yourself, have fun, and enjoy the process of meeting someone new.

I'm going to take a moment now to look through the attendees and check the list. While I do that, if you'd like even more tailored matching, **I've posted a second link in the chat for our Personality Quiz.** You don't *have* to do it, but it's very quick—just 10 easy questions—and it really helps our system find the best possible connections for you based on your values and interests.

Give that a quick fill-in now while I go ahead and create the pairings. We'll be starting in just a moment. Enjoy!`

  const jewishScript = `Hello everyone, and thank you so much for joining us for today's Jewish Singles Online Speed Dating event! We're excited to have you all here, and we've got a fantastic session planned for you.

Before we dive in, we need to make sure everyone is accounted for. **I have just posted a link in the chat—please click that now to fill in your attendance.** This is the most important step so we can see exactly who is in the room and get the rotations started.

While you are doing that, I'll explain how the event will work:

- **Breakout Sessions:** You'll be placed into private breakout rooms for one-on-one sessions. Each chat will last about 5 minutes.
- **Guided Prompts:** To keep things moving, we will send out a conversation prompt every 30 seconds. These are just there to spark ideas and help you avoid any awkward silences—so don't feel pressured to answer them perfectly!
- **Rotation & Byes:** After 5 minutes, you'll be moved to your next match. If you don't see your name on a specific pairing, it just means you have a 'BYE' for that round. Take that time to grab a drink, stretch, and relax; your next match will be only a moment away.

Make sure you have a piece of paper handy to jot down the names of the people you enjoyed chatting with. After the event, you'll receive an email to submit your favorites. If the interest is mutual, we'll send over the contact details!

Most importantly: just relax! I know these things can be a little nerve-wracking, but we're all here for the same reason. Just be yourself, have fun, and enjoy the process of meeting someone new.

I'm going to take a moment now to look through the attendees and check the list. While I do that, if you'd like even more tailored matching, **I've posted a second link in the chat for our Personality Quiz.** You don't *have* to do it, but it's very quick—just 10 easy questions—and it really helps our system find the best possible connections for you based on your values and interests.

Give that a quick fill-in now while I go ahead and create the pairings. We'll be starting in just a moment. Enjoy!`

  const muslimScript = `Hello everyone, and thank you so much for joining us for today's Muslim Singles Online Speed Dating event! We're excited to have you all here, and we've got a fantastic session planned for you.

Before we dive in, we need to make sure everyone is accounted for. **I have just posted a link in the chat—please click that now to fill in your attendance.** This is the most important step so we can see exactly who is in the room and get the rotations started.

While you are doing that, I'll explain how the event will work:

- **Breakout Sessions:** You'll be placed into private breakout rooms for one-on-one sessions. Each chat will last about 5 minutes.
- **Guided Prompts:** To keep things moving, we will send out a conversation prompt every 30 seconds. These are just there to spark ideas and help you avoid any awkward silences—so don't feel pressured to answer them perfectly!
- **Rotation & Byes:** After 5 minutes, you'll be moved to your next match. If you don't see your name on a specific pairing, it just means you have a 'BYE' for that round. Take that time to grab a drink, stretch, and relax; your next match will be only a moment away.

Make sure you have a piece of paper handy to jot down the names of the people you enjoyed chatting with. After the event, you'll receive an email to submit your favorites. If the interest is mutual, we'll send over the contact details!

Most importantly: just relax! I know these things can be a little nerve-wracking, but we're all here for the same reason. Just be yourself, have fun, and enjoy the process of meeting someone new.

I'm going to take a moment now to look through the attendees and check the list. While I do that, if you'd like even more tailored matching, **I've posted a second link in the chat for our Personality Quiz.** You don't *have* to do it, but it's very quick—just 10 easy questions—and it really helps our system find the best possible connections for you based on your values and interests.

Give that a quick fill-in now while I go ahead and create the pairings. We'll be starting in just a moment. Enjoy!`

  const indianScript = `Hello everyone, and thank you so much for joining us for today's Indian Singles Online Speed Dating event! We're excited to have you all here, and we've got a fantastic session planned for you.

Before we dive in, we need to make sure everyone is accounted for. **I have just posted a link in the chat—please click that now to fill in your attendance.** This is the most important step so we can see exactly who is in the room and get the rotations started.

While you are doing that, I'll explain how the event will work:

- **Breakout Sessions:** You'll be placed into private breakout rooms for one-on-one sessions. Each chat will last about 5 minutes.
- **Guided Prompts:** To keep things moving, we will send out a conversation prompt every 30 seconds. These are just there to spark ideas and help you avoid any awkward silences—so don't feel pressured to answer them perfectly!
- **Rotation & Byes:** After 5 minutes, you'll be moved to your next match. If you don't see your name on a specific pairing, it just means you have a 'BYE' for that round. Take that time to grab a drink, stretch, and relax; your next match will be only a moment away.

Make sure you have a piece of paper handy to jot down the names of the people you enjoyed chatting with. After the event, you'll receive an email to submit your favorites. If the interest is mutual, we'll send over the contact details!

Most importantly: just relax! I know these things can be a little nerve-wracking, but we're all here for the same reason. Just be yourself, have fun, and enjoy the process of meeting someone new.

I'm going to take a moment now to look through the attendees and check the list. While I do that, if you'd like even more tailored matching, **I've posted a second link in the chat for our Personality Quiz.** You don't *have* to do it, but it's very quick—just 10 easy questions—and it really helps our system find the best possible connections for you based on your values and interests.

Give that a quick fill-in now while I go ahead and create the pairings. We'll be starting in just a moment. Enjoy!`

  const genericScript = `Hello everyone, and thank you so much for joining us for today's Online Speed Dating event! We're excited to have you all here, and we've got a fantastic session planned for you.

Before we dive in, we need to make sure everyone is accounted for. **I have just posted a link in the chat—please click that now to fill in your attendance.** This is the most important step so we can see exactly who is in the room and get the rotations started.

While you are doing that, I'll explain how the event will work:

- **Breakout Sessions:** You'll be placed into private breakout rooms for one-on-one sessions. Each chat will last about 5 minutes.
- **Guided Prompts:** To keep things moving, we will send out a conversation prompt every 30 seconds. These are just there to spark ideas and help you avoid any awkward silences—so don't feel pressured to answer them perfectly!
- **Rotation & Byes:** After 5 minutes, you'll be moved to your next match. If you don't see your name on a specific pairing, it just means you have a 'BYE' for that round. Take that time to grab a drink, stretch, and relax; your next match will be only a moment away.

Make sure you have a piece of paper handy to jot down the names of the people you enjoyed chatting with. After the event, you'll receive an email to submit your favorites. If the interest is mutual, we'll send over the contact details!

Most importantly: just relax! I know these things can be a little nerve-wracking, but we're all here for the same reason. Just be yourself, have fun, and enjoy the process of meeting someone new.

I'm going to take a moment now to look through the attendees and check the list. While I do that, if you'd like even more tailored matching, **I've posted a second link in the chat for our Personality Quiz.** You don't *have* to do it, but it's very quick—just 10 easy questions—and it really helps our system find the best possible connections for you based on your values and interests.

Give that a quick fill-in now while I go ahead and create the pairings. We'll be starting in just a moment. Enjoy!`

  switch (productType) {
    case 'onlineSpeedDatingGay': return gayScript
    case 'onlineSpeedDatingJewish': return jewishScript
    case 'onlineSpeedDatingMuslim': return muslimScript
    case 'onlineSpeedDatingIndian': return indianScript
    default: return genericScript
  }
}

function formatGMT(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' GMT'
}

function formatLocal(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' (local)'
}

function isPast(iso: string): boolean {
  return new Date(iso) < new Date()
}

export default function EventSOP() {
  const [events, setEvents] = useState<EventProduct[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventProduct | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/products/onlineSpeedDating')
      .then(r => r.json())
      .then(data => {
        const all: EventProduct[] = Array.isArray(data) ? data : data.products || []
        // Also fetch other product types
        return Promise.all([
          fetch('/api/products/onlineSpeedDatingGay').then(r => r.json()),
          fetch('/api/products/onlineSpeedDatingJewish').then(r => r.json()),
          fetch('/api/products/onlineSpeedDatingMuslim').then(r => r.json()),
          fetch('/api/products/onlineSpeedDatingIndian').then(r => r.json()),
        ]).then(results => {
          for (const data of results) {
            const items: EventProduct[] = Array.isArray(data) ? data : data.products || []
            all.push(...items)
          }
          // Sort: upcoming first (by date), then past events
          all.sort((a, b) => new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime())
          setEvents(all)
        })
      })
      .catch(err => console.error('Failed to fetch events:', err))
  }, [])

  const copyAttendanceLink = async (productId: number) => {
    const link = `https://tempodating.com/attendance?productId=${productId}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      toast({ title: 'Copied!', description: 'Attendance link copied to clipboard' })
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast({ title: 'Copy failed', description: 'Failed to copy link', variant: 'destructive' })
    }
  }

  const copyScript = async (productType: string) => {
    try {
      await navigator.clipboard.writeText(getScript(productType))
      setCopiedScript(true)
      toast({ title: 'Copied!', description: 'Script copied to clipboard' })
      setTimeout(() => setCopiedScript(false), 2000)
    } catch {
      toast({ title: 'Copy failed', description: 'Failed to copy script', variant: 'destructive' })
    }
  }

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (selectedEvent) {
    const attendanceLink = `https://tempodating.com/attendance?productId=${selectedEvent.productId}`
    const script = getScript(selectedEvent.productType)
    const typeLabel = PRODUCT_TYPE_LABELS[selectedEvent.productType] || selectedEvent.productType

    return (
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{selectedEvent.title} — {selectedEvent.city}</h3>
            <p className="text-sm text-gray-500 mt-1">
              <Badge variant="outline" className="mr-2">{typeLabel}</Badge>
              Product #{selectedEvent.productId}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatGMT(selectedEvent.gmtdatetime)} &nbsp;|&nbsp; {formatLocal(selectedEvent.gmtdatetime)}
            </p>
          </div>
          <Button variant="outline" onClick={() => { setSelectedEvent(null); setCheckedSteps(new Set()) }}>
            Back to Events
          </Button>
        </div>

        {/* Attendance Link */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Attendance Link</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-blue-200 text-blue-900 select-all break-all">
              {attendanceLink}
            </code>
            <Button
              onClick={() => copyAttendanceLink(selectedEvent.productId)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1 shrink-0"
            >
              {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* SOP Checklist */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 text-lg mb-3">SOP Checklist</h4>
          <div className="space-y-2">
            {SOP_STEPS.map((step, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checkedSteps.has(idx)
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedSteps.has(idx)}
                  onChange={() => toggleStep(idx)}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 shrink-0"
                />
                <span className={`text-sm ${checkedSteps.has(idx) ? 'text-green-800 line-through' : 'text-gray-700'}`}>
                  <span className="font-semibold">{idx + 1}.</span> {step}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {checkedSteps.size}/{SOP_STEPS.length} completed
          </p>
        </div>

        {/* Script */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800 text-lg">
              Script <Badge variant="secondary" className="ml-2">{typeLabel}</Badge>
            </h4>
            <Button
              onClick={() => copyScript(selectedEvent.productType)}
              size="sm"
              className="bg-green-500 hover:bg-green-600 flex items-center gap-1"
            >
              {copiedScript ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedScript ? 'Copied!' : 'Copy Script'}
            </Button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {script}
          </div>
        </div>
      </Card>
    )
  }

  // Event list view
  const upcoming = events.filter(e => !isPast(e.gmtdatetime))
  const past = events.filter(e => isPast(e.gmtdatetime))

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Select an Event</h3>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Loading events...</p>
      ) : (
        <div className="space-y-2">
          {[...upcoming, ...past].map(event => {
            const isEventPast = isPast(event.gmtdatetime)
            const typeLabel = PRODUCT_TYPE_LABELS[event.productType] || event.productType
            return (
              <button
                key={event.productId}
                onClick={() => setSelectedEvent(event)}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                  isEventPast
                    ? 'bg-gray-50 border-gray-200 text-gray-400'
                    : 'bg-white border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-gray-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${isEventPast ? 'text-gray-400' : 'text-gray-800'}`}>
                      {event.title}
                    </span>
                    <Badge variant={isEventPast ? 'secondary' : 'outline'} className="text-xs shrink-0">
                      {typeLabel}
                    </Badge>
                    {isEventPast && (
                      <Badge variant="secondary" className="text-xs shrink-0">Past</Badge>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isEventPast ? 'text-gray-400' : 'text-gray-500'}`}>
                    {event.city}, {event.country} &nbsp;·&nbsp; #{event.productId}
                  </p>
                  <p className={`text-xs ${isEventPast ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatGMT(event.gmtdatetime)} &nbsp;|&nbsp; {formatLocal(event.gmtdatetime)}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 ${isEventPast ? 'text-gray-300' : 'text-gray-400'}`} />
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
