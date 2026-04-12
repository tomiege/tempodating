import { NextRequest, NextResponse } from 'next/server'
import { EventSession, sessions } from '../sessions'

export type { EventSession }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const session = sessions.get(productId) ?? null
  return NextResponse.json({ session })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const body = await req.json()
  const session: EventSession = {
    productId,
    phase: 'idle',
    currentRound: 0,
    totalRounds: body.totalRounds ?? 8,
    roundDurationMinutes: body.roundDurationMinutes ?? 5,
    rounds: body.rounds ?? [],
    autoMode: body.autoMode ?? false,
    roundStartTime: null,
    welcomeShown: false,
    goodbyeShown: false,
    isGayEvent: body.isGayEvent ?? false,
    reminder: null,
    reminderUntil: null,
  }
  sessions.set(productId, session)
  return NextResponse.json({ session })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const existing = sessions.get(productId)
  const body = await req.json()
  const base: EventSession = existing ?? {
    productId,
    phase: 'idle',
    currentRound: 0,
    totalRounds: 0,
    roundDurationMinutes: 5,
    rounds: [],
    autoMode: false,
    roundStartTime: null,
    welcomeShown: false,
    goodbyeShown: false,
    isGayEvent: false,
    reminder: null,
    reminderUntil: null,
  }
  const updated: EventSession = { ...base, ...body }
  sessions.set(productId, updated)
  return NextResponse.json({ session: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  sessions.delete(productId)
  return NextResponse.json({ ok: true })
}
