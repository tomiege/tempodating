'use client'

import { createClient } from '@/lib/supabase-client'

interface UserMetadata {
  full_name: string
  gender: string
  age: string
  city: string
  country: string
}

export async function signUp(email: string, password: string, metadata?: UserMetadata) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${location.origin}/api/auth/callback`,
      data: metadata,
      // IMPORTANT: This only works if "Confirm email" is DISABLED in Supabase Dashboard
      // Go to: Authentication → Providers → Email → DISABLE "Confirm email"
    },
  })

  console.log('🔐 signUp complete:', {
    hasSession: !!data?.session,
    hasUser: !!data?.user,
    userId: data?.user?.id,
    requiresEmailConfirmation: !data?.session && !!data?.user
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

// Send OTP to email
export async function sendOTP(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${location.origin}/api/auth/callback`,
    },
  })

  return { data, error }
}

// Verify OTP code
export async function verifyOTP(email: string, token: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  return { data, error }
}

// Update user metadata after OTP login
export async function updateUserMetadata(metadata: UserMetadata) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth/update-password`,
  })

  return { data, error }
}

export async function updatePassword(password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.updateUser({
    password,
  })

  return { data, error }
}

export async function getSession() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()
  return { data, error }
}

export async function getUser() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  return { data, error }
}
