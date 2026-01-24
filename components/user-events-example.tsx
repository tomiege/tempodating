'use client'

import { useSupabaseQuery } from '@/lib/supabase-queries'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Event {
  id: string
  title: string
  description: string
  event_type: string
  starts_at: string
  location: string
  status: string
}

export function UserEventsExample() {
  const { user } = useAuth()
  const { data: events, loading, error } = useSupabaseQuery<Event>(
    'events',
    { user_id: user?.id },
    { realtime: true } // Enable real-time updates
  )

  if (loading) return <div>Loading events...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Events (Real-time)</CardTitle>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="p-3 border rounded">
                <h3 className="font-semibold">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.starts_at).toLocaleDateString()} - {event.location}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No events found</p>
        )}
      </CardContent>
    </Card>
  )
}
