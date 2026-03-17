import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const folder = request.nextUrl.searchParams.get('folder')
  if (!folder || !['male', 'female'].includes(folder)) {
    return NextResponse.json({ error: 'Invalid folder. Must be "male" or "female".' }, { status: 400 })
  }

  try {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase.storage
      .from('ai-photos')
      .list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const images = (data ?? [])
      .filter((f) => f.name && !f.name.startsWith('.'))
      .map((f) => {
        const { data: { publicUrl } } = supabase.storage
          .from('ai-photos')
          .getPublicUrl(`${folder}/${f.name}`)
        return { name: f.name, url: publicUrl }
      })

    return NextResponse.json({ images })
  } catch (err) {
    console.error('Error listing ai-photos bucket:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
