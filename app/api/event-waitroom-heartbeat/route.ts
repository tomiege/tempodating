import { NextRequest, NextResponse } from 'next/server'

type WaitroomStore = Map<string, Map<string, number>>

const ACTIVE_WINDOW_MS = 20 * 1000

function getStore(): WaitroomStore {
  const globalStore = globalThis as typeof globalThis & {
    __eventWaitroomHeartbeatStore?: WaitroomStore
  }

  if (!globalStore.__eventWaitroomHeartbeatStore) {
    globalStore.__eventWaitroomHeartbeatStore = new Map()
  }

  return globalStore.__eventWaitroomHeartbeatStore
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    const productId = typeof body.productId === 'string' || typeof body.productId === 'number'
      ? String(body.productId)
      : ''
    const productType = typeof body.productType === 'string' ? body.productType : ''
    const testMode = body.testMode === true

    if (!sessionId || !productId || !productType) {
      return NextResponse.json(
        { error: 'sessionId, productId, and productType are required' },
        { status: 400 }
      )
    }

    const roomKey = `${productType}:${productId}:${testMode ? 'test' : 'live'}`
    const now = Date.now()
    const store = getStore()
    const room = store.get(roomKey) ?? new Map<string, number>()

    room.set(sessionId, now)

    for (const [id, lastSeenAt] of room.entries()) {
      if (now - lastSeenAt > ACTIVE_WINDOW_MS) {
        room.delete(id)
      }
    }

    store.set(roomKey, room)

    return NextResponse.json({
      activePeopleCount: room.size,
    })
  } catch (error) {
    console.error('Failed to process waitroom heartbeat:', error)
    return NextResponse.json(
      { error: 'Failed to process waitroom heartbeat' },
      { status: 500 }
    )
  }
}
