import { readFile } from 'fs/promises'
import path from 'path'
import ManagementView from '@/app/auto-host/ManagementView'

export interface EventEntry {
  productId: number
  gmtdatetime: string
  timezone: string
  title: string
  city: string
  productType?: string
  duration_in_minutes?: number
  zoomInvite?: string
}

async function getEvents(): Promise<EventEntry[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'products', 'events.json')
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const metadata = { title: 'Auto Host' }

export const dynamic = 'force-dynamic'

export default async function AdminAutoHostPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>
}) {
  const { productId } = await searchParams
  const events = await getEvents()
  return <ManagementView events={events} initialProductId={productId} />
}
