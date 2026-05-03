import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

interface EventEntry {
  productId: number
  gmtdatetime: string
  city: string
  productType: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const productIdParam = searchParams.get('productId')
  const productType = searchParams.get('productType')

  if (!productIdParam || !productType) {
    return NextResponse.json({ error: 'productId and productType are required' }, { status: 400 })
  }

  const productId = parseInt(productIdParam, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'productId must be a number' }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'public', 'products', 'events.json')
  const raw = await readFile(filePath, 'utf-8')
  const events: EventEntry[] = JSON.parse(raw)

  const currentEvent = events.find((e) => e.productId === productId)
  if (!currentEvent) {
    return NextResponse.json({ nextProductId: null })
  }

  const currentDatetime = new Date(currentEvent.gmtdatetime)

  const nextEvent = events
    .filter(
      (e) =>
        e.productType === productType &&
        e.city === currentEvent.city &&
        new Date(e.gmtdatetime) > currentDatetime
    )
    .sort((a, b) => new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime())[0] ?? null

  return NextResponse.json({ nextProductId: nextEvent?.productId ?? null })
}
