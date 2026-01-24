'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface FetchOptions {
  realtime?: boolean
}

export function useSupabaseQuery<T>(
  table: string,
  filters?: Record<string, any>,
  options?: FetchOptions
) {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let subscription: RealtimeChannel | null = null

    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*')

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        const { data, error: queryError } = await query

        if (queryError) throw queryError
        setData(data as T[])
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    if (options?.realtime) {
      subscription = supabase
        .channel(`${table}:${JSON.stringify(filters || {})}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          () => {
            fetchData()
          }
        )
        .subscribe()
    }

    return () => {
      subscription?.unsubscribe()
    }
  }, [table, JSON.stringify(filters || {}), options?.realtime])

  return { data, loading, error }
}

export async function createRecord<T>(
  table: string,
  data: Partial<T>
): Promise<{ data?: T; error?: Error }> {
  const supabase = createClient()

  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()

    if (error) throw error
    return { data: result?.[0] as T }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

export async function updateRecord<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<{ data?: T; error?: Error }> {
  const supabase = createClient()

  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()

    if (error) throw error
    return { data: result?.[0] as T }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

export async function deleteRecord(
  table: string,
  id: string
): Promise<{ error?: Error }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}
