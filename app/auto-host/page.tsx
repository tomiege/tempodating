import { readFile } from 'fs/promises'
import path from 'path'
import ManagementView from './ManagementView'
import DisplayView from './DisplayView'

export interface EventEntry {
  productId: number
  gmtdatetime: string
  timezone: string
  title: string
  city: string
  productType?: string
  duration_in_minutes?: number
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

export const dynamic = 'force-dynamic'

export default async function AutoHostPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>
}) {
  const { productId } = await searchParams

  if (productId) {
    return <DisplayView productId={productId} />
  }

  const events = await getEvents()
  return <ManagementView events={events} />
}
