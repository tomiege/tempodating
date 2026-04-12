import { RoundResult } from '@/app/admin/attendance/utils/types'

export interface EventSession {
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

// Shared in-memory store — single instance for the server process lifetime
export const sessions = new Map<string, EventSession>()
