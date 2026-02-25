import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic'

interface TicketCounts {
  maleTickets: number
  femaleTickets: number
  total: number
}

interface PricingResult {
  maleTickets: number
  femaleTickets: number
  total: number
  adjustedMalePrice: number
  adjustedFemalePrice: number
  maleSoldOut: boolean
  femaleSoldOut: boolean
  nextEvent: {
    productId: number
    city: string
    gmtdatetime: string
    regionId: string
  } | null
}

// Calculate ticket counts for a product (deduplicated by user)
async function getTicketCounts(productId: number): Promise<TicketCounts> {
  const supabase = createServiceSupabaseClient()

  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('product_id, is_male, user_id, email')
    .eq('product_id', productId)
    .eq('confirmation_email_sent', true)

  if (error) {
    Sentry.captureException(error, {
      tags: { feature: 'dynamic-ticket-pricing' },
      extra: { productId },
    })
    console.error('Error fetching checkouts for pricing:', error)
    return { maleTickets: 0, femaleTickets: 0, total: 0 }
  }

  // Deduplicate by user (user_id first, then email)
  const seenUsers = new Set<string>()
  let maleTickets = 0
  let femaleTickets = 0

  checkouts?.forEach((checkout) => {
    const userKey = checkout.user_id || checkout.email
    if (seenUsers.has(userKey)) return
    seenUsers.add(userKey)

    if (checkout.is_male === true) {
      maleTickets++
    } else if (checkout.is_male === false) {
      femaleTickets++
    }
  })

  return { maleTickets, femaleTickets, total: maleTickets + femaleTickets }
}

// Calculate adjusted price based on tickets sold for that gender
// Prices are in cents
function calculateAdjustedPrice(basePrice: number, ticketsSold: number): { price: number; soldOut: boolean } {
  if (ticketsSold > 50) {
    return { price: basePrice, soldOut: true }
  }

  if (ticketsSold >= 40) {
    // 50% increase on base price
    const increased = Math.round(basePrice * 1.5)
    return { price: increased, soldOut: false }
  }

  if (ticketsSold >= 30) {
    // 30% increase on base price, rounded down to nearest dollar (100 cents)
    const increased = Math.floor(basePrice * 1.3 / 100) * 100
    return { price: increased, soldOut: false }
  }

  // 0-29: normal price
  return { price: basePrice, soldOut: false }
}

// Find next event with same region_id
async function findNextEvent(
  productId: number,
  regionId: string
): Promise<PricingResult['nextEvent']> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/products/onlineSpeedDating.json`
    )

    if (!response.ok) {
      // Fallback: read from filesystem
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', 'products', 'onlineSpeedDating.json')
      const fileData = fs.readFileSync(filePath, 'utf-8')
      const events = JSON.parse(fileData)
      return findNextEventFromData(events, productId, regionId)
    }

    const events = await response.json()
    return findNextEventFromData(events, productId, regionId)
  } catch (error) {
    // Fallback: read from filesystem directly
    try {
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', 'products', 'onlineSpeedDating.json')
      const fileData = fs.readFileSync(filePath, 'utf-8')
      const events = JSON.parse(fileData)
      return findNextEventFromData(events, productId, regionId)
    } catch (fsError) {
      Sentry.captureException(fsError, {
        tags: { feature: 'dynamic-ticket-pricing' },
        extra: { productId, regionId },
      })
      console.error('Error reading events data:', fsError)
      return null
    }
  }
}

function findNextEventFromData(
  events: Array<{
    productId: number
    gmtdatetime: string
    city: string
    region_id: string
  }>,
  currentProductId: number,
  regionId: string
): PricingResult['nextEvent'] {
  const now = new Date()

  // Find the current event to get its datetime
  const currentEvent = events.find((e) => e.productId === currentProductId)
  const currentDatetime = currentEvent ? new Date(currentEvent.gmtdatetime) : now

  // Find future events with same region_id, excluding current product
  const futureEvents = events
    .filter(
      (e) =>
        e.region_id === regionId &&
        e.productId !== currentProductId &&
        new Date(e.gmtdatetime) > currentDatetime
    )
    .sort(
      (a, b) =>
        new Date(a.gmtdatetime).getTime() - new Date(b.gmtdatetime).getTime()
    )

  if (futureEvents.length > 0) {
    const next = futureEvents[0]
    return {
      productId: next.productId,
      city: next.city,
      gmtdatetime: next.gmtdatetime,
      regionId: next.region_id,
    }
  }

  return null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return Sentry.withServerActionInstrumentation(
    'calculate-ticket-price',
    {},
    async () => {
      try {
        const { searchParams } = new URL(request.url)
        const productIdStr = searchParams.get('productId')
        const malePriceStr = searchParams.get('malePrice')
        const femalePriceStr = searchParams.get('femalePrice')
        const regionId = searchParams.get('regionId')

        if (!productIdStr) {
          return NextResponse.json(
            { error: 'productId is required' },
            { status: 400 }
          )
        }

        const productId = parseInt(productIdStr, 10)
        const baseMalePrice = malePriceStr ? parseInt(malePriceStr, 10) : 0
        const baseFemalePrice = femalePriceStr ? parseInt(femalePriceStr, 10) : 0

        // Get ticket counts
        const counts = await getTicketCounts(productId)

        // // TODO: Remove test override - hardcoded for testing dynamic pricing
        // counts.maleTickets = 55
        // counts.femaleTickets = 55
        // counts.total = 110

        console.log(
          `🎟️ Ticket counts for product ${productId}: Male=${counts.maleTickets}, Female=${counts.femaleTickets}, Total=${counts.total}`
        )

        // Calculate adjusted prices
        const maleResult = calculateAdjustedPrice(baseMalePrice, counts.maleTickets)
        const femaleResult = calculateAdjustedPrice(baseFemalePrice, counts.femaleTickets)

        console.log(
          `💰 Adjusted prices for product ${productId}: Male=${maleResult.price} (soldOut=${maleResult.soldOut}), Female=${femaleResult.price} (soldOut=${femaleResult.soldOut})`
        )

        // If sold out, look for next event
        let nextEvent: PricingResult['nextEvent'] = null
        if ((maleResult.soldOut || femaleResult.soldOut) && regionId) {
          nextEvent = await findNextEvent(productId, regionId)
          console.log(
            `🔄 Next event lookup for region ${regionId}:`,
            nextEvent
              ? `Found product ${nextEvent.productId} in ${nextEvent.city}`
              : 'No future event found'
          )
        }

        const result: PricingResult = {
          maleTickets: counts.maleTickets,
          femaleTickets: counts.femaleTickets,
          total: counts.total,
          adjustedMalePrice: maleResult.price,
          adjustedFemalePrice: femaleResult.price,
          maleSoldOut: maleResult.soldOut,
          femaleSoldOut: femaleResult.soldOut,
          nextEvent,
        }

        return NextResponse.json(result)
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: 'dynamic-ticket-pricing' },
        })
        console.error('Error calculating ticket price:', error)
        return NextResponse.json(
          { error: 'Failed to calculate ticket price' },
          { status: 500 }
        )
      }
    }
  )
}
