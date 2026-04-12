import { NextResponse } from 'next/server'
import { sessions } from './sessions'

// Returns all active sessions — used by the sidebar to show live status indicators
export async function GET() {
  const all = Object.fromEntries(sessions.entries())
  return NextResponse.json({ sessions: all })
}
