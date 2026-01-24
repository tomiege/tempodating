# Supabase Integration Guide

This document outlines the Supabase authentication and database implementation for the Tempo Dating App.

## Overview

The application uses Supabase for:
- **Authentication**: User sign-up, sign-in, and session management
- **Database**: PostgreSQL database for storing users, events, tickets, participants, and matches
- **Real-time Features**: Optional real-time subscriptions for live event updates

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project's:
   - URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. Add these to your `.env.local` file

### 2. Initialize Database Schema

1. In the Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL to create all tables, indexes, policies, and triggers

### 3. Enable Authentication Providers

In Supabase Dashboard → Authentication → Providers:

- **Email/Password**: Already enabled by default
- **Google OAuth** (optional):
  1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com)
  2. Add credentials to Supabase Auth settings
  3. Update the login page to include Google sign-in

## File Structure

```
lib/
├── supabase-client.ts          # Browser-side Supabase client
├── supabase-server.ts          # Server-side Supabase client
├── supabase-middleware.ts       # Middleware for session management
└── auth-utils.ts               # Authentication functions

hooks/
└── use-auth.ts                 # React hook for authentication state

app/
├── api/
│   ├── auth/
│   │   ├── callback/route.ts   # OAuth callback handler
│   │   └── logout/route.ts     # Logout endpoint
│   ├── user/route.ts           # Get current user
│   └── events/
│       ├── route.ts            # Create/read events
│       └── [id]/route.ts       # Update/delete individual events
├── login/page.tsx              # Sign-in page
└── register/page.tsx           # Sign-up page

middleware.ts                    # Next.js middleware for session refresh

supabase/
└── schema.sql                  # Database schema and RLS policies
```

## Authentication Flow

### Sign Up
1. User enters email and password on register page
2. `signUp()` function calls Supabase auth
3. Confirmation email sent to user
4. User redirected to login page

### Sign In
1. User enters credentials on login page
2. `signIn()` function authenticates user
3. Session stored in cookies (handled by middleware)
4. User redirected to dashboard

### Session Management
- Middleware automatically refreshes user sessions
- Auth state available via `useAuth()` hook
- Server-side auth via `createServerSupabaseClient()`

## API Routes

### GET `/api/user`
Returns the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "aud": "authenticated"
  }
}
```

### GET `/api/events`
Returns all events created by the current user.

### POST `/api/events`
Create a new event.

**Request Body:**
```json
{
  "title": "Speed Dating Night",
  "description": "An evening of romance",
  "event_type": "speed_dating",
  "starts_at": "2026-02-14T19:00:00Z",
  "ends_at": "2026-02-14T22:00:00Z",
  "location": "Downtown Bar",
  "capacity": 50,
  "price": 25.00,
  "image_url": "https://example.com/image.jpg"
}
```

### GET `/api/events/[id]`
Get a specific event.

### PATCH `/api/events/[id]`
Update a specific event.

### DELETE `/api/events/[id]`
Delete a specific event.

### POST `/api/auth/logout`
Sign out the current user.

## Database Schema

### Users Table
Extends Supabase's auth.users table with profile information.

```sql
id (UUID) - Primary key, references auth.users
email (TEXT) - User email
full_name (TEXT) - User's full name
avatar_url (TEXT) - Profile picture URL
bio (TEXT) - User bio
created_at, updated_at (TIMESTAMP)
```

### Events Table
Stores event information created by users.

```sql
id (UUID) - Primary key
user_id (UUID) - Creator of the event
title (TEXT) - Event title
description (TEXT) - Event description
event_type (TEXT) - speed_dating, workshop, or on_demand
starts_at, ends_at (TIMESTAMP)
location (TEXT)
capacity (INTEGER)
price (DECIMAL)
image_url (TEXT)
status (TEXT) - draft, published, completed, cancelled
created_at, updated_at (TIMESTAMP)
```

### Tickets Table
Records ticket purchases for events.

```sql
id (UUID) - Primary key
event_id (UUID) - References events
user_id (UUID) - Ticket holder
ticket_number (TEXT) - Unique ticket identifier
status (TEXT) - active, used, cancelled
purchased_at (TIMESTAMP)
used_at (TIMESTAMP)
```

### Participants Table
Tracks event participants.

```sql
id (UUID)
event_id (UUID)
user_id (UUID)
status (TEXT) - registered, attended, no_show
registered_at (TIMESTAMP)
checked_in_at (TIMESTAMP)
```

### Matches Table
Records matches in speed dating events.

```sql
id (UUID)
event_id (UUID)
user_a_id, user_b_id (UUID)
user_a_liked, user_b_liked (BOOLEAN)
matched_at (TIMESTAMP)
```

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view/modify their own data
- Published events are visible to all users
- Event organizers can manage participant data
- Users can update their own match preferences

## Usage Examples

### Sign Up
```typescript
import { signUp } from '@/lib/auth-utils'

const { data, error } = await signUp('user@example.com', 'password123')
if (!error) {
  // User registered successfully
}
```

### Sign In
```typescript
import { signIn } from '@/lib/auth-utils'

const { data, error } = await signIn('user@example.com', 'password123')
if (!error) {
  // User authenticated, session established
}
```

### Get Current User (Client)
```typescript
import { useAuth } from '@/hooks/use-auth'

export function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Welcome, {user.email}</div>
}
```

### Get Current User (Server)
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function MyServerComponent() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return <div>Welcome, {user?.email}</div>
}
```

### Create Event
```typescript
async function createEvent() {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Speed Dating',
      event_type: 'speed_dating',
      starts_at: new Date().toISOString(),
    }),
  })
  return response.json()
}
```

### Fetch Events
```typescript
async function getEvents() {
  const response = await fetch('/api/events')
  return response.json()
}
```

## Protected Routes

The application uses middleware to protect routes. To create a protected page:

1. Add the page to the workspace
2. Use `useAuth()` hook to check authentication status
3. Redirect to login if not authenticated

Example:
```typescript
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>

  return <div>Protected content</div>
}
```

## Environment Variables

Ensure your `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

### User not authenticating
1. Check that `.env.local` has correct Supabase credentials
2. Verify email confirmation is enabled (for sign-ups)
3. Check browser console for auth errors

### Database queries failing
1. Verify database schema is initialized (`supabase/schema.sql`)
2. Check RLS policies allow your queries
3. Ensure user has necessary permissions

### Session issues
1. Clear browser cookies
2. Restart development server
3. Check middleware is properly configured

## Next Steps

1. **Email Verification**: Configure email templates in Supabase Dashboard
2. **OAuth Providers**: Add Google/GitHub authentication
3. **Storage**: Set up Supabase Storage for image uploads
4. **Real-time**: Add real-time event updates using `supabase.realtime`
5. **Notifications**: Implement email/push notifications

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
