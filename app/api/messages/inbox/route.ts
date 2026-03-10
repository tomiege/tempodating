import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/messages/inbox - Get conversations for the authenticated user
// Returns the latest message per conversation partner, plus unread counts
export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('withUserId')

    const serviceSupabase = createServiceSupabaseClient()

    // If withUserId is provided, return the full conversation thread
    if (withUserId) {
      const { data: messages, error } = await serviceSupabase
        .from('messages')
        .select('id, from_user_id, to_user_id, message, is_read, created_at')
        .or(
          `and(from_user_id.eq.${user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200)

      if (error) {
        console.error('Error fetching conversation:', error)
        return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
      }

      // Get the other user's profile
      const { data: otherProfile } = await serviceSupabase
        .from('users')
        .select('id, full_name, avatar_url, bio, age, city, is_male')
        .eq('id', withUserId)
        .single()

      return NextResponse.json({
        messages: messages.map(m => ({
          id: m.id,
          fromUserId: m.from_user_id,
          toUserId: m.to_user_id,
          message: m.message,
          isRead: m.is_read,
          createdAt: m.created_at,
        })),
        otherUser: otherProfile ? {
          id: otherProfile.id,
          name: otherProfile.full_name || 'Unknown',
          avatarUrl: otherProfile.avatar_url,
          bio: otherProfile.bio,
          age: otherProfile.age,
          city: otherProfile.city,
          isMale: otherProfile.is_male,
        } : null,
      })
    }

    // Otherwise, return inbox: list of conversations with last message + unread count
    // Get all messages where user is sender or receiver
    const { data: allMessages, error } = await serviceSupabase
      .from('messages')
      .select('id, from_user_id, to_user_id, message, is_read, created_at')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inbox:', error)
      return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
    }

    // Group by conversation partner
    const conversationMap = new Map<string, {
      partnerId: string
      lastMessage: typeof allMessages[0]
      unreadCount: number
    }>()

    for (const msg of allMessages) {
      const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          lastMessage: msg,
          unreadCount: 0,
        })
      }

      // Count unread messages sent TO current user
      if (msg.to_user_id === user.id && !msg.is_read) {
        const conv = conversationMap.get(partnerId)!
        conv.unreadCount++
      }
    }

    // Fetch partner profiles
    const partnerIds = Array.from(conversationMap.keys())
    
    let partnerProfiles: Record<string, { name: string; avatarUrl: string | null; bio: string | null; age: number | null; city: string | null; isMale: boolean | null }> = {}
    if (partnerIds.length > 0) {
      const { data: profiles } = await serviceSupabase
        .from('users')
        .select('id, full_name, avatar_url, bio, age, city, is_male')
        .in('id', partnerIds)

      if (profiles) {
        for (const p of profiles) {
          partnerProfiles[p.id] = {
            name: p.full_name || 'Unknown',
            avatarUrl: p.avatar_url,
            bio: p.bio,
            age: p.age,
            city: p.city,
            isMale: p.is_male,
          }
        }
      }
    }

    // Build the response
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())
      .map(conv => ({
        partnerId: conv.partnerId,
        partnerName: partnerProfiles[conv.partnerId]?.name || 'Unknown',
        partnerAvatarUrl: partnerProfiles[conv.partnerId]?.avatarUrl || null,
        partnerBio: partnerProfiles[conv.partnerId]?.bio || null,
        partnerAge: partnerProfiles[conv.partnerId]?.age || null,
        partnerCity: partnerProfiles[conv.partnerId]?.city || null,
        partnerIsMale: partnerProfiles[conv.partnerId]?.isMale ?? null,
        lastMessage: conv.lastMessage.message,
        lastMessageAt: conv.lastMessage.created_at,
        lastMessageFromMe: conv.lastMessage.from_user_id === user.id,
        unreadCount: conv.unreadCount,
      }))

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Inbox GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
