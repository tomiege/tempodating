import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/personality-quiz - Get user's quiz result
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get quiz result from users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('personality_quiz_result')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching quiz result:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quiz result' },
        { status: 500 }
      )
    }

    if (!userData?.personality_quiz_result) {
      return NextResponse.json({ completed: false })
    }

    return NextResponse.json({
      completed: true,
      quizResult: userData.personality_quiz_result
    })
  } catch (error) {
    console.error('Personality quiz GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/personality-quiz - Save quiz result
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { quizResult } = body

    if (!quizResult || typeof quizResult !== 'object') {
      return NextResponse.json(
        { error: 'Invalid quiz result data' },
        { status: 400 }
      )
    }

    // Update the user's personality_quiz_result column
    const { data, error } = await supabase
      .from('users')
      .update({
        personality_quiz_result: quizResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error saving quiz result:', error)
      return NextResponse.json(
        { error: 'Failed to save quiz result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz result saved',
      data
    })
  } catch (error) {
    console.error('Personality quiz POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
