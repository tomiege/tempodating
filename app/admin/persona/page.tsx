'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Trash2,
  Loader2,
  Heart,
  Send,
  MessageCircle,
  User,
  ArrowLeft,
  Upload,
  Check,
  X,
  Users,
  Calendar,
  Edit2,
  Save,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface EventInfo {
  productId: number
  productType: string
}

interface Persona {
  id: string
  email: string
  full_name: string
  age: number | null
  bio: string | null
  avatar_url: string | null
  is_male: boolean | null
  city: string | null
  events: EventInfo[]
}

interface EventData {
  productId: number
  gmtdatetime: string
  title: string
  country: string
  city: string
  timezone: string
  productType: string
}

interface Participant {
  id: string
  name: string
  bio: string
  age?: number
  city?: string
  avatarUrl?: string
  isMale?: boolean
  email?: string
  isLiked: boolean
  hasMessaged: boolean
}

// ─── Main Page ───────────────────────────────────────────

export default function AdminPersonaPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  // Active persona + event selection for matching view
  const [activePersona, setActivePersona] = useState<Persona | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedProductType, setSelectedProductType] = useState<string>('onlineSpeedDating')

  const { toast } = useToast()

  // ─── Data fetching ────────────────────────────────────

  const fetchPersonas = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/persona')
      if (res.ok) {
        setPersonas(await res.json())
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load personas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/products/events.json')
      if (res.ok) {
        const data: EventData[] = await res.json()
        // Sort by date, show future first
        data.sort((a, b) => new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime())
        setEvents(data)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchPersonas()
    fetchEvents()
  }, [fetchPersonas, fetchEvents])

  // ─── Persona CRUD ─────────────────────────────────────

  const deletePersona = async (id: string) => {
    if (!confirm('Delete this persona and all their matches/messages?')) return
    try {
      const res = await fetch(`/api/admin/persona?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPersonas(prev => prev.filter(p => p.id !== id))
        if (activePersona?.id === id) setActivePersona(null)
        toast({ title: 'Deleted' })
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  // ─── Render ───────────────────────────────────────────

  // If we have an active persona + event, show the matching view
  if (activePersona && selectedProductId) {
    return (
      <MatchingView
        persona={activePersona}
        productId={selectedProductId}
        productType={selectedProductType}
        events={events}
        onBack={() => {
          setSelectedProductId(null)
          setActivePersona(null)
        }}
        onChangeEvent={(id, type) => {
          setSelectedProductId(id)
          setSelectedProductType(type)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Persona Manager</h1>
          <p className="text-gray-400 text-sm">Create fake accounts, add to events, like &amp; message real attendees</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="w-4 h-4 mr-2" /> New Persona
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
      ) : personas.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No personas yet</p>
          <p className="text-gray-500 text-sm mt-1">Create one to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              events={events}
              onDelete={() => deletePersona(persona.id)}
              onSelect={(productId, productType) => {
                setActivePersona(persona)
                setSelectedProductId(productId)
                setSelectedProductType(productType)
              }}
              onUpdate={fetchPersonas}
            />
          ))}
        </div>
      )}

      <CreatePersonaDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(p) => {
          setPersonas(prev => [p, ...prev])
          setShowCreate(false)
        }}
      />
    </div>
  )
}

// ─── Persona Card ────────────────────────────────────────

function PersonaCard({
  persona,
  events,
  onDelete,
  onSelect,
  onUpdate,
}: {
  persona: Persona
  events: EventData[]
  onDelete: () => void
  onSelect: (productId: number, productType: string) => void
  onUpdate: () => void
}) {
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)
  const [addingAll, setAddingAll] = useState(false)
  const [editing, setEditing] = useState(false)
  const { toast } = useToast()

  const addToEvent = async (productId: number, productType: string) => {
    setAddingEvent(true)
    try {
      const res = await fetch('/api/admin/persona/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: persona.id, productId, productType }),
      })
      if (res.ok) {
        toast({ title: 'Added to event' })
        onUpdate()
        setShowEventPicker(false)
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add to event', variant: 'destructive' })
    } finally {
      setAddingEvent(false)
    }
  }

  const addToAllEvents = async (eventsList: { productId: number; productType: string }[]) => {
    if (!confirm(`Add ${persona.full_name} to all ${eventsList.length} events?`)) return
    setAddingAll(true)
    let added = 0
    for (const ev of eventsList) {
      try {
        const res = await fetch('/api/admin/persona/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId: persona.id, productId: ev.productId, productType: ev.productType }),
        })
        if (res.ok) added++
      } catch {
        // continue with rest
      }
    }
    toast({ title: `Added to ${added}/${eventsList.length} events` })
    onUpdate()
    setShowEventPicker(false)
    setAddingAll(false)
  }

  const removeFromEvent = async (productId: number, productType: string) => {
    try {
      const res = await fetch(
        `/api/admin/persona/events?personaId=${persona.id}&productId=${productId}&productType=${productType}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        toast({ title: 'Removed from event' })
        onUpdate()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove', variant: 'destructive' })
    }
  }

  const getEventLabel = (ev: EventInfo) => {
    const full = events.find(e => e.productId === ev.productId)
    if (full) {
      const d = new Date(full.gmtdatetime)
      return `${full.city} ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (#${ev.productId})`
    }
    return `#${ev.productId}`
  }

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-14 h-14 flex-shrink-0">
            {persona.avatar_url ? <AvatarImage src={persona.avatar_url} /> : null}
            <AvatarFallback className="bg-gray-700 text-white text-lg">
              {persona.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">{persona.full_name}</h3>
              {persona.is_male !== null && (
                <Badge className={persona.is_male ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'}>
                  {persona.is_male ? 'M' : 'F'}
                </Badge>
              )}
              {persona.age && <span className="text-gray-400 text-sm">{persona.age}</span>}
            </div>
            {persona.bio && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{persona.bio}</p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-8 w-8 p-0" onClick={() => setEditing(true)}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-8 w-8 p-0" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Events this persona is in */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Events</span>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-pink-400 hover:text-pink-300 h-6 px-2"
              onClick={() => setShowEventPicker(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          {persona.events.length === 0 ? (
            <p className="text-gray-600 text-xs">Not in any events</p>
          ) : (
            <div className="space-y-1">
              {persona.events.map(ev => (
                <div key={ev.productId} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5">
                  <button
                    className="text-xs text-gray-300 hover:text-white transition-colors text-left flex-1 truncate"
                    onClick={() => onSelect(ev.productId, ev.productType)}
                  >
                    <Users className="w-3 h-3 inline mr-1" />
                    {getEventLabel(ev)}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      className="text-xs bg-pink-600 hover:bg-pink-700 h-6 px-2"
                      onClick={() => onSelect(ev.productId, ev.productType)}
                    >
                      Match
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-500 hover:text-red-400 h-6 w-6 p-0"
                      onClick={() => removeFromEvent(ev.productId, ev.productType)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Event picker dialog */}
      <EventPickerDialog
        open={showEventPicker}
        onClose={() => setShowEventPicker(false)}
        events={events}
        existingEventIds={persona.events.map(e => e.productId)}
        onPick={(productId, productType) => addToEvent(productId, productType)}
        onPickAll={addToAllEvents}
        adding={addingEvent}
        addingAll={addingAll}
      />

      {/* Edit persona dialog */}
      <EditPersonaDialog
        open={editing}
        onClose={() => setEditing(false)}
        persona={persona}
        onUpdated={onUpdate}
      />
    </>
  )
}

// ─── Create Persona Dialog ───────────────────────────────

function CreatePersonaDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (p: Persona) => void
}) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [isMale, setIsMale] = useState<boolean | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      // Upload via a direct Supabase storage upload through our proxy
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/persona/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.url)
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          age: age ? parseInt(age) : null,
          bio: bio.trim() || null,
          isMale,
          avatarUrl: avatarUrl || null,
        }),
      })
      if (res.ok) {
        const persona = await res.json()
        onCreated(persona)
        toast({ title: `Created ${name}` })
        // Reset form
        setName('')
        setAge('')
        setBio('')
        setIsMale(null)
        setAvatarUrl('')
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error creating persona', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create Persona</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a fake profile that can be added to events
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback className="bg-gray-700 text-gray-400">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-gray-300">Profile photo</p>
              <p className="text-xs text-gray-500">Click avatar or paste image URL</p>
              <Input
                placeholder="Or paste image URL..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-700 text-white text-xs h-8"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleImageUpload(f)
              }}
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Name *</label>
            <Input
              placeholder="e.g. Sarah Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Gender</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isMale === false ? 'default' : 'outline'}
                className={isMale === false ? 'bg-pink-600 hover:bg-pink-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
                onClick={() => setIsMale(false)}
              >
                Female
              </Button>
              <Button
                size="sm"
                variant={isMale === true ? 'default' : 'outline'}
                className={isMale === true ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
                onClick={() => setIsMale(true)}
              >
                Male
              </Button>
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Age</label>
            <Input
              type="number"
              placeholder="e.g. 28"
              value={age}
              onChange={e => setAge(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white w-24"
              min={18}
              max={100}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-300 block mb-1">Bio</label>
            <Textarea
              placeholder="A short bio for the profile..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white resize-none"
              rows={3}
            />
          </div>

          <Button
            className="w-full bg-pink-600 hover:bg-pink-700"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Persona
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Persona Dialog ─────────────────────────────────

function EditPersonaDialog({
  open,
  onClose,
  persona,
  onUpdated,
}: {
  open: boolean
  onClose: () => void
  persona: Persona
  onUpdated: () => void
}) {
  const [name, setName] = useState(persona.full_name)
  const [age, setAge] = useState(persona.age?.toString() || '')
  const [bio, setBio] = useState(persona.bio || '')
  const [isMale, setIsMale] = useState<boolean | null>(persona.is_male)
  const [avatarUrl, setAvatarUrl] = useState(persona.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setName(persona.full_name)
    setAge(persona.age?.toString() || '')
    setBio(persona.bio || '')
    setIsMale(persona.is_male)
    setAvatarUrl(persona.avatar_url || '')
  }, [persona])

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/persona/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.url)
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/persona', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: persona.id,
          name: name.trim(),
          age: age ? parseInt(age) : null,
          bio: bio.trim() || null,
          isMale,
          avatarUrl: avatarUrl || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Saved' })
        onUpdated()
        onClose()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Persona</DialogTitle>
          <DialogDescription className="text-gray-400">Update persona profile</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
              <AvatarFallback className="bg-gray-700 text-gray-400">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Image URL..."
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white text-xs flex-1"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleImageUpload(f)
              }}
            />
          </div>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="bg-gray-800 border-gray-700 text-white" />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isMale === false ? 'default' : 'outline'}
              className={isMale === false ? 'bg-pink-600 hover:bg-pink-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
              onClick={() => setIsMale(false)}
            >Female</Button>
            <Button
              size="sm"
              variant={isMale === true ? 'default' : 'outline'}
              className={isMale === true ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
              onClick={() => setIsMale(true)}
            >Male</Button>
          </div>
          <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" className="bg-gray-800 border-gray-700 text-white w-24" min={18} max={100} />
          <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio..." className="bg-gray-800 border-gray-700 text-white resize-none" rows={3} />
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Event Picker Dialog ─────────────────────────────────

function EventPickerDialog({
  open,
  onClose,
  events,
  existingEventIds,
  onPick,
  onPickAll,
  adding,
  addingAll,
}: {
  open: boolean
  onClose: () => void
  events: EventData[]
  existingEventIds: number[]
  onPick: (productId: number, productType: string) => void
  onPickAll: (events: { productId: number; productType: string }[]) => void
  adding: boolean
  addingAll: boolean
}) {
  const [search, setSearch] = useState('')

  const available = events.filter(e => !existingEventIds.includes(e.productId))

  const filtered = available.filter(e => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      e.city.toLowerCase().includes(q) ||
      e.country.toLowerCase().includes(q) ||
      e.productType.toLowerCase().includes(q) ||
      e.productId.toString().includes(q)
    )
  })

  // Group by future vs past
  const now = new Date()
  const future = filtered.filter(e => new Date(e.gmtdatetime) >= now)
  const past = filtered.filter(e => new Date(e.gmtdatetime) < now)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Add to Event</DialogTitle>
          <DialogDescription className="text-gray-400">Pick an event to register this persona in</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search city, country, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white flex-1"
          />
          <Button
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 whitespace-nowrap"
            disabled={available.length === 0 || addingAll}
            onClick={() => onPickAll(available.map(e => ({ productId: e.productId, productType: e.productType })))}
          >
            {addingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
            Add All ({available.length})
          </Button>
        </div>
        <ScrollArea className="h-[400px]">
          {future.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2">Upcoming ({future.length})</h4>
              <EventList events={future} onPick={onPick} adding={adding} />
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Past ({past.length})</h4>
              <EventList events={past} onPick={onPick} adding={adding} />
            </div>
          )}
          {filtered.length === 0 && (
            <p className="text-gray-500 text-center py-8">No events found</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function EventList({
  events,
  onPick,
  adding,
}: {
  events: EventData[]
  onPick: (productId: number, productType: string) => void
  adding: boolean
}) {
  return (
    <div className="space-y-1">
      {events.map(ev => {
        const d = new Date(ev.gmtdatetime)
        return (
          <button
            key={ev.productId}
            className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-750 rounded px-3 py-2 text-left transition-colors disabled:opacity-50"
            onClick={() => onPick(ev.productId, ev.productType)}
            disabled={adding}
          >
            <div>
              <span className="text-sm text-white">{ev.city}, {ev.country}</span>
              <span className="text-xs text-gray-400 ml-2">
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                {ev.productType === 'onlineSpeedDating' ? 'Speed Dating' : ev.productType}
              </span>
            </div>
            <span className="text-xs text-gray-500">#{ev.productId}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Matching View (the main feature!) ───────────────────

function MatchingView({
  persona,
  productId,
  productType,
  events,
  onBack,
  onChangeEvent,
}: {
  persona: Persona
  productId: number
  productType: string
  events: EventData[]
  onBack: () => void
  onChangeEvent: (id: number, type: string) => void
}) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [likingUser, setLikingUser] = useState<string | null>(null)
  const [messagingUser, setMessagingUser] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [postLikeMessageUser, setPostLikeMessageUser] = useState<string | null>(null)
  const [profileModalUser, setProfileModalUser] = useState<Participant | null>(null)
  const { toast } = useToast()

  const eventData = events.find(e => e.productId === productId)
  const eventLabel = eventData
    ? `${eventData.city} · ${new Date(eventData.gmtdatetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : `Event #${productId}`

  const fetchParticipants = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/persona/participants?personaId=${persona.id}&productId=${productId}&productType=${productType}`
      )
      if (res.ok) {
        setParticipants(await res.json())
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load participants', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [persona.id, productId, productType, toast])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  const handleLike = async (participantId: string) => {
    setLikingUser(participantId)
    try {
      const res = await fetch('/api/admin/persona/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: persona.id,
          likedUserId: participantId,
          productId,
          productType,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isLiked: true } : p))
        if (data.isMutualMatch) {
          toast({ title: '🎉 Mutual Match!' })
        } else {
          toast({ title: 'Liked!' })
        }
        // Prompt message if not already messaged
        const target = participants.find(p => p.id === participantId)
        if (target && !target.hasMessaged) {
          setPostLikeMessageUser(participantId)
          setMessageText('')
        }
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to like', variant: 'destructive' })
    } finally {
      setLikingUser(null)
    }
  }

  const handleUnlike = async (participantId: string) => {
    setLikingUser(participantId)
    try {
      const res = await fetch(
        `/api/admin/persona/like?personaId=${persona.id}&likedUserId=${participantId}&productId=${productId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isLiked: false } : p))
        toast({ title: 'Unliked' })
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setLikingUser(null)
    }
  }

  const handleSendMessage = async (toUserId: string) => {
    if (!messageText.trim() || sendingMessage) return
    setSendingMessage(true)
    try {
      const res = await fetch('/api/admin/persona/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: persona.id,
          toUserId,
          message: messageText.trim(),
        }),
      })
      if (res.ok) {
        toast({ title: 'Message sent!' })
        setMessageText('')
        setMessagingUser(null)
        setPostLikeMessageUser(null)
        setParticipants(prev => prev.map(p => p.id === toUserId ? { ...p, hasMessaged: true } : p))
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error sending message', variant: 'destructive' })
    } finally {
      setSendingMessage(false)
    }
  }

  // Like all participants at once
  const handleLikeAll = async () => {
    const unliked = participants.filter(p => !p.isLiked)
    if (unliked.length === 0) return
    if (!confirm(`Like all ${unliked.length} participants?`)) return
    for (const p of unliked) {
      await handleLike(p.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Personas
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            {persona.avatar_url ? <AvatarImage src={persona.avatar_url} /> : null}
            <AvatarFallback className="bg-gray-700 text-white">{persona.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {persona.full_name}
              {persona.is_male !== null && (
                <Badge className={persona.is_male ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'}>
                  {persona.is_male ? 'M' : 'F'}
                </Badge>
              )}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{eventLabel}</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">{productType}</span>
            </div>
          </div>
        </div>

        {/* Quick event switcher */}
        {persona.events.length > 1 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {persona.events.map(ev => {
              const evData = events.find(e => e.productId === ev.productId)
              const label = evData
                ? `${evData.city} #${ev.productId}`
                : `#${ev.productId}`
              return (
                <Button
                  key={ev.productId}
                  size="sm"
                  variant={ev.productId === productId ? 'default' : 'outline'}
                  className={ev.productId === productId
                    ? 'bg-pink-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:bg-gray-800'}
                  onClick={() => onChangeEvent(ev.productId, ev.productType)}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Participants ({participants.length})
        </h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={fetchParticipants}>
            Refresh
          </Button>
          <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={handleLikeAll}>
            <Heart className="w-3.5 h-3.5 mr-1" /> Like All
          </Button>
        </div>
      </div>

      {/* Participants list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
      ) : participants.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No participants found</p>
          <p className="text-gray-500 text-sm">No other attendees in this event yet, or gender filtering yielded zero results.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {participants.map(participant => (
            <Card key={participant.id} className="bg-gray-900 border-gray-800 p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <button type="button" onClick={() => setProfileModalUser(participant)} className="flex-shrink-0">
                  <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all">
                    {participant.avatarUrl ? <AvatarImage src={participant.avatarUrl} /> : null}
                    <AvatarFallback className="bg-gray-700 text-white">{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setProfileModalUser(participant)} className="text-left">
                      <h4 className="font-medium text-white hover:text-pink-400 transition-colors cursor-pointer truncate">
                        {participant.name}
                      </h4>
                    </button>
                    {participant.isMale !== undefined && participant.isMale !== null && (
                      <Badge className={participant.isMale ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'}>
                        {participant.isMale ? 'M' : 'F'}
                      </Badge>
                    )}
                    {participant.age && <span className="text-gray-500 text-sm">{participant.age}</span>}
                    {participant.email && (
                      <span className="text-gray-600 text-xs truncate">{participant.email}</span>
                    )}
                  </div>
                  {participant.bio && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{participant.bio}</p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {participant.isLiked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-pink-600 text-pink-400 hover:bg-pink-600 hover:text-white"
                        onClick={() => { handleUnlike(participant.id); setPostLikeMessageUser(null) }}
                        disabled={likingUser === participant.id}
                      >
                        {likingUser === participant.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Heart className="w-3 h-3 mr-1 fill-current" />
                        )}
                        Liked
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs bg-pink-600 hover:bg-pink-700"
                        onClick={() => handleLike(participant.id)}
                        disabled={likingUser === participant.id}
                      >
                        {likingUser === participant.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Heart className="w-3 h-3 mr-1" />
                        )}
                        Like
                      </Button>
                    )}

                    {/* Message button */}
                    {messagingUser !== participant.id && postLikeMessageUser !== participant.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
                        onClick={() => { setMessagingUser(participant.id); setMessageText('') }}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    )}

                    {participant.hasMessaged && (
                      <span className="text-xs text-gray-500 flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Messaged
                      </span>
                    )}
                  </div>

                  {/* Post-like message prompt */}
                  {postLikeMessageUser === participant.id && !participant.hasMessaged && (
                    <MessageBox
                      participantName={participant.name}
                      messageText={messageText}
                      setMessageText={setMessageText}
                      sendingMessage={sendingMessage}
                      onSend={() => handleSendMessage(participant.id)}
                      onSkip={() => { setPostLikeMessageUser(null); setMessageText('') }}
                    />
                  )}

                  {/* Direct message box */}
                  {messagingUser === participant.id && postLikeMessageUser !== participant.id && (
                    <MessageBox
                      participantName={participant.name}
                      messageText={messageText}
                      setMessageText={setMessageText}
                      sendingMessage={sendingMessage}
                      onSend={() => handleSendMessage(participant.id)}
                      onSkip={() => { setMessagingUser(null); setMessageText('') }}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Modal */}
      {profileModalUser && (
        <Dialog open={!!profileModalUser} onOpenChange={() => setProfileModalUser(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
            <DialogHeader>
              <DialogTitle className="sr-only">Profile</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center text-center pt-2">
              <Avatar className="w-32 h-32 mb-4">
                {profileModalUser.avatarUrl ? <AvatarImage src={profileModalUser.avatarUrl} /> : null}
                <AvatarFallback className="bg-gray-700 text-white text-3xl">
                  {profileModalUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold text-white">{profileModalUser.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {profileModalUser.isMale !== undefined && profileModalUser.isMale !== null && (
                  <Badge className={profileModalUser.isMale ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'}>
                    {profileModalUser.isMale ? 'M' : 'F'}
                  </Badge>
                )}
                {profileModalUser.age && <span className="text-gray-400">{profileModalUser.age}</span>}
              </div>
              {profileModalUser.bio && (
                <p className="text-gray-300 mt-3">{profileModalUser.bio}</p>
              )}
              {profileModalUser.email && (
                <p className="text-gray-500 text-sm mt-2">{profileModalUser.email}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Reusable Message Box ────────────────────────────────

function MessageBox({
  participantName,
  messageText,
  setMessageText,
  sendingMessage,
  onSend,
  onSkip,
}: {
  participantName: string
  messageText: string
  setMessageText: (v: string) => void
  sendingMessage: boolean
  onSend: () => void
  onSkip: () => void
}) {
  return (
    <div className="mt-3 space-y-2 bg-gray-800/50 rounded-lg p-3">
      <p className="text-xs text-gray-300">
        <MessageCircle className="w-3 h-3 inline mr-1" />
        Message {participantName}
      </p>
      <Textarea
        placeholder={`Write a message to ${participantName}...`}
        value={messageText}
        onChange={e => setMessageText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none text-sm min-h-[60px]"
        rows={2}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" className="text-xs text-gray-400" onClick={onSkip}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="text-xs bg-pink-600 hover:bg-pink-700"
          onClick={onSend}
          disabled={!messageText.trim() || sendingMessage}
        >
          {sendingMessage ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
          Send
        </Button>
      </div>
    </div>
  )
}
