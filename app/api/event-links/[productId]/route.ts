import { readFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params

  const filePath = path.join(process.cwd(), 'public', 'products', 'events.json')
  const events = JSON.parse(await readFile(filePath, 'utf-8'))
  const event = events.find((e: { productId: number }) => String(e.productId) === productId)

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const base = 'https://www.tempodating.com'

  return NextResponse.json({
    productId: event.productId,
    startDatetime: event.gmtdatetime,
    productType: event.productType,
    zoomLink: event.zoomInvite ?? null,
    participantViewLink: `${base}/auto-host?productId=${productId}`,
    attendanceLink: `${base}/attendance?productId=${productId}`,
  })
}
