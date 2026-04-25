import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export const maxDuration = 120

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = 'https://www.tempodating.com'

interface OnlineSpeedDatingEvent {
  productId: number
  zoomInvite: string
  city: string
  gmtdatetime: string
  timezone: string
  region_id: string
  productType: string
}

function getZoomLinkForProduct(productId: number): OnlineSpeedDatingEvent | null {
  return getEventForProduct(productId)
}

interface Recipient {
  email: string
  is_male: boolean
  checkout_session_id: string
  product_type: string
  query_city: string | null
  name: string | null
  phone_number: string | null
}

async function getRecipientsForProduct(productId: number): Promise<{ males: Recipient[]; females: Recipient[] }> {
  const supabase = createServiceSupabaseClient()

  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('is_male, user_id, email, checkout_session_id, product_type, query_city, name, phone_number')
    .eq('product_id', productId)
    .eq('confirmation_email_sent', true)

  if (error || !checkouts) {
    console.error('Error fetching emails for product:', error)
    return { males: [], females: [] }
  }

  // Deduplicate by user_id or email
  const seen = new Set<string>()
  const males: Recipient[] = []
  const females: Recipient[] = []

  for (const c of checkouts) {
    const key = c.user_id || c.email
    if (!key || seen.has(key)) continue
    seen.add(key)

    if (!c.email || !c.checkout_session_id) continue
    const recipient: Recipient = {
      email: c.email,
      is_male: c.is_male === true,
      checkout_session_id: c.checkout_session_id,
      product_type: c.product_type || 'onlineSpeedDating',
      query_city: c.query_city || null,
      name: c.name || null,
      phone_number: c.phone_number || null,
    }
    if (c.is_male === true) males.push(recipient)
    else if (c.is_male === false) females.push(recipient)
  }

  return { males, females }
}

// ─── Leads fetching ────────────────────────────────────────────────

async function getLeadsForProduct(productId: number, productType: string): Promise<{ email: string; name: string | null; city: string | null }[]> {
  const supabase = createServiceSupabaseClient()

  // Get leads for this product
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('email, name, city')
    .eq('product_id', productId)
    .eq('product_type', productType)

  if (leadsError || !leads) {
    console.error('Error fetching leads:', leadsError)
    return []
  }

  // Get paid checkout emails for this product (people who actually paid)
  const { data: paidCheckouts, error: checkoutError } = await supabase
    .from('checkout')
    .select('email')
    .eq('product_id', productId)
    .eq('confirmation_email_sent', true)

  if (checkoutError) {
    console.error('Error fetching paid checkouts:', checkoutError)
    return []
  }

  const paidEmails = new Set((paidCheckouts || []).map((c) => c.email.toLowerCase()))

  // Filter: leads whose email is NOT in paid checkouts, and has a valid email
  const seen = new Set<string>()
  return leads.filter((lead) => {
    if (!lead.email || typeof lead.email !== 'string') return false
    const email = lead.email.trim().toLowerCase()
    if (!email || !email.includes('@')) return false
    if (paidEmails.has(email) || seen.has(email)) return false
    seen.add(email)
    return true
  })
}

// ─── Next event helpers ────────────────────────────────────────────

function findNextEventFromData(
  events: OnlineSpeedDatingEvent[],
  currentProductId: number,
  regionId: string
): OnlineSpeedDatingEvent | null {
  const now = new Date()
  const currentEvent = events.find((e) => e.productId === currentProductId)
  const currentDatetime = currentEvent ? new Date(currentEvent.gmtdatetime) : now

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

  return futureEvents.length > 0 ? futureEvents[0] : null
}

function getEventsData(): OnlineSpeedDatingEvent[] {
  const filePath = path.join(process.cwd(), 'public', 'products', 'events.json')
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

function getEventForProduct(productId: number): OnlineSpeedDatingEvent | null {
  const events = getEventsData()
  return events.find((e) => e.productId === productId) || null
}

// ─── Campaign logging ──────────────────────────────────────────────

async function logCampaign(
  productId: number,
  productType: string,
  template: string,
  subject: string,
  recipientEmails: string[],
  audience: string
) {
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase.from('email_campaigns').insert({
    product_id: productId,
    product_type: productType,
    template,
    subject,
    recipient_emails: recipientEmails,
    recipient_count: recipientEmails.length,
    audience,
    sent_at: new Date().toISOString(),
  })
  if (error) {
    console.error('Error logging email campaign:', error)
  }
}

// ─── Email Templates ───────────────────────────────────────────────

export type TemplateId = 'pre-event' | 'post-event' | 'leads-reminder' | 'next-event' | 'complimentary-ticket'

function buildPreEventHtml(zoomLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi there,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Your online Speed Dating event is starting shortly!
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            If you haven't already, please click here to get your Zoom Link to join the event!
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${zoomLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Join Zoom Meeting</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 24px 0; word-break: break-all;">
            <a href="${zoomLink}" style="color: #2563eb;">${zoomLink}</a>
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">
            We look forward to seeing you!
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
}

function buildPostEventHtml(checkoutSuccessUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi there,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for attending the event! We hope you had a great time.
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Please select your matches on your <strong>User Dashboard</strong> — it's quick and easy!
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${checkoutSuccessUrl}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Go to Your Dashboard</a>
          </div>
          <div style="background-color: #fdf2f8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #9d174d; font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">While you're there:</p>
            <p style="color: #831843; font-size: 14px; line-height: 1.6; margin: 0;">
              Please make sure to fill in your profile including your <strong>profile picture</strong>, <strong>bio</strong>, and <strong>contact details</strong> to share a little more about yourself with your matches.
            </p>
          </div>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">
            Good luck! 🤞
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
}

function buildCheckoutSuccessUrl(r: Recipient): string {
  return `${BASE_URL}/checkout-success/${r.product_type}?checkoutSessionId=${r.checkout_session_id}&email=${encodeURIComponent(r.email)}`
}

function buildLeadsReminderHtml(productId: number, productType: string, city: string): string {
  const productUrl = `${BASE_URL}/product?productId=${productId}&productType=${productType}&src=emailCampaign&city=${encodeURIComponent(city)}`
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi there,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            We noticed you were interested in our upcoming Speed Dating event in <strong>${city}</strong> — spots are filling up fast!
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Don't miss out on meeting amazing people. Secure your spot before it's too late!
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${productUrl}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Reserve My Spot</a>
          </div>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">
            See you there! 💕
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
}

function buildNextEventHtml(nextEvent: OnlineSpeedDatingEvent, city: string): string {
  const eventDate = new Date(nextEvent.gmtdatetime)
  const formattedDate = eventDate.toLocaleString('en-US', {
    timeZone: nextEvent.timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const productUrl = `${BASE_URL}/product?productId=${nextEvent.productId}&productType=${nextEvent.productType || 'onlineSpeedDating'}&src=emailCampaign&city=${encodeURIComponent(city)}`
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi there,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            We hope you enjoyed your recent Speed Dating event! 🎉
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Great news — our next event in <strong>${nextEvent.city}</strong> is coming up on <strong>${formattedDate}</strong>.
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            If you had a great time, why not come back for another round? Meet even more amazing people!
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${productUrl}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Book Next Event</a>
          </div>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">
            See you there! 💕
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
}

function buildComplimentaryTicketHtml(city: string, successUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi there,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            We wanted to reach out personally regarding our recent Speed Dating event in <strong>${city}</strong>.
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            We experienced some technical issues during the event, and we sincerely apologize for any inconvenience this may have caused. We are working hard to improve and deliver a much better experience for you.
          </p>
          <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #10b981;">
            <p style="color: #065f46; font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">🎁 A gift from us to you</p>
            <p style="color: #064e3b; font-size: 14px; line-height: 1.6; margin: 0;">
              As a token of our appreciation for your patience and understanding, we'd like to offer you a <strong>complimentary ticket</strong> to our next Speed Dating event in <strong>${city}</strong> — completely free, on us!
            </p>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${successUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Claim Your Free Ticket 🎟️</a>
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0 0 24px 0; word-break: break-all;">
            <a href="${successUrl}" style="color: #10b981;">${successUrl}</a>
          </p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">
            We look forward to seeing you at the next event! 💕<br>
            <span style="color: #6b7280; font-size: 14px;">— The Tempo Dating Team</span>
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
}

const TEMPLATE_SUBJECTS: Record<TemplateId, string> = {
  'pre-event': 'Your online Speed Dating event is starting soon!',
  'post-event': 'Thank you for attending! Select your matches 💕',
  'leads-reminder': 'Don\'t miss out — spots are filling up! 💕',
  'next-event': 'Enjoyed the event? Our next one is coming up! 🎉',
  'complimentary-ticket': 'A free ticket from us — we\'re sorry 💚',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, audience, testEmail, template = 'pre-event' } = body as {
      productId: number
      audience: 'males' | 'females' | 'all' | 'test' | 'leads'
      testEmail?: string
      template?: TemplateId
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const subject = TEMPLATE_SUBJECTS[template]
    const event = getEventForProduct(productId)
    const productType = event?.productType || 'onlineSpeedDating'
    const city = event?.city || ''

    // For pre-event, we need the zoom link
    let zoomLink: string | null = null
    if (template === 'pre-event') {
      if (!event) {
        return NextResponse.json({ error: 'No zoom link found for this product' }, { status: 404 })
      }
      zoomLink = event.zoomInvite
    }

    // For next-event and complimentary-ticket, find the next event in the same region
    let nextEvent: OnlineSpeedDatingEvent | null = null
    if (template === 'next-event' || template === 'complimentary-ticket') {
      if (!event) {
        return NextResponse.json({ error: 'Event not found for this product' }, { status: 404 })
      }
      const events = getEventsData()
      nextEvent = findNextEventFromData(events, productId, event.region_id)
      if (!nextEvent) {
        return NextResponse.json(
          { error: `No upcoming event found for region ${event.region_id} (${event.city}). Cannot send ${template} email.` },
          { status: 400 }
        )
      }
    }

    // Test send — single email
    if (audience === 'test') {
      if (!testEmail) {
        return NextResponse.json({ error: 'testEmail is required for test sends' }, { status: 400 })
      }

      const { testCheckoutSessionId } = body as { testCheckoutSessionId?: string }

      let html: string
      if (template === 'post-event') {
        if (!testCheckoutSessionId) {
          return NextResponse.json({ error: 'Please select a checkout session for post-event test' }, { status: 400 })
        }
        const supabase = createServiceSupabaseClient()
        const { data: checkout } = await supabase
          .from('checkout')
          .select('email, checkout_session_id, product_type')
          .eq('checkout_session_id', testCheckoutSessionId)
          .single()

        if (!checkout) {
          return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
        }
        const url = `${BASE_URL}/checkout-success/${checkout.product_type || 'onlineSpeedDating'}?checkoutSessionId=${checkout.checkout_session_id}&email=${encodeURIComponent(checkout.email)}`
        html = buildPostEventHtml(url)
      } else if (template === 'leads-reminder') {
        html = buildLeadsReminderHtml(productId, productType, city)
      } else if (template === 'next-event') {
        html = buildNextEventHtml(nextEvent!, city)
      } else if (template === 'complimentary-ticket') {
        const supabase = createServiceSupabaseClient()
        const testSessionId = `COMPLIMENTARY_${crypto.randomUUID()}`
        await supabase.from('checkout').insert({
          checkout_session_id: testSessionId,
          user_id: null,
          email: testEmail,
          site_name: 'tempodating',
          total_order: 0,
          customer_id: '',
          product_type: nextEvent!.productType || 'onlineSpeedDating',
          product_id: nextEvent!.productId,
          confirmation_email_sent: true,
          currency: 'usd',
          product_description: `Complimentary ticket - ${nextEvent!.city}`,
          experiment: null,
          checkout_time: new Date().toISOString(),
          name: null,
          phone_number: null,
          is_male: null,
          query_city: city || null,
        })
        const testSuccessUrl = `${BASE_URL}/checkout-success/${nextEvent!.productType || 'onlineSpeedDating'}?checkoutSessionId=${testSessionId}&email=${encodeURIComponent(testEmail)}`
        html = buildComplimentaryTicketHtml(city || nextEvent!.city, testSuccessUrl)
      } else {
        html = buildPreEventHtml(zoomLink!)
      }

      const { error } = await resend.emails.send({
        from: 'Tempo Dating <support@tempodating.com>',
        to: testEmail,
        subject,
        html,
      })

      if (error) {
        console.error('Error sending test email:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, sent: 1, audience: 'test' })
    }

    // ── Leads audience (leads-reminder template) ──────────────
    if (audience === 'leads' || template === 'leads-reminder') {
      const leads = await getLeadsForProduct(productId, productType)

      if (leads.length === 0) {
        return NextResponse.json({ error: 'No unpaid leads found for this product' }, { status: 400 })
      }

      console.log(`Sending leads-reminder email to ${leads.length} leads for product ${productId}`)

      const batchEmails = leads.map((lead) => ({
        from: 'Tempo Dating <support@tempodating.com>' as const,
        to: lead.email,
        subject,
        html: buildLeadsReminderHtml(productId, productType, lead.city || city),
      }))

      const result = await sendBatchEmails(batchEmails)

      // Log the campaign
      await logCampaign(
        productId,
        productType,
        'leads-reminder',
        subject,
        leads.map((l) => l.email),
        'leads'
      )

      return NextResponse.json({
        success: true,
        sent: result.totalSent,
        failed: result.totalFailed,
        total: leads.length,
        audience: 'leads',
      })
    }

    // ── Next-event audience (paid attendees) ──────────────────
    if (template === 'next-event') {
      const { males, females } = await getRecipientsForProduct(productId)
      const recipients = [...males, ...females]

      if (recipients.length === 0) {
        return NextResponse.json({ error: 'No paid attendees found for this product' }, { status: 400 })
      }

      console.log(`Sending next-event email to ${recipients.length} attendees for product ${productId}`)

      const batchEmails = recipients.map((r) => ({
        from: 'Tempo Dating <support@tempodating.com>' as const,
        to: r.email,
        subject,
        html: buildNextEventHtml(nextEvent!, city),
      }))

      const result = await sendBatchEmails(batchEmails)

      await logCampaign(
        productId,
        productType,
        'next-event',
        subject,
        recipients.map((r) => r.email),
        audience
      )

      return NextResponse.json({
        success: true,
        sent: result.totalSent,
        failed: result.totalFailed,
        total: recipients.length,
        audience,
        nextEventProductId: nextEvent!.productId,
        nextEventCity: nextEvent!.city,
      })
    }

    // ── Complimentary ticket (paid attendees of current event) ──
    if (template === 'complimentary-ticket') {
      const { males, females } = await getRecipientsForProduct(productId)
      const recipients = [...males, ...females]

      if (recipients.length === 0) {
        return NextResponse.json({ error: 'No paid attendees found for this product' }, { status: 400 })
      }

      console.log(`Sending complimentary-ticket email to ${recipients.length} attendees for product ${productId}`)

      const supabase = createServiceSupabaseClient()
      const batchEmails: { from: string; to: string; subject: string; html: string }[] = []

      for (const r of recipients) {
        const recipientCity = r.query_city || city
        const sessionId = `COMPLIMENTARY_${crypto.randomUUID()}`

        const { error: insertError } = await supabase.from('checkout').insert({
          checkout_session_id: sessionId,
          user_id: null,
          email: r.email,
          site_name: 'tempodating',
          total_order: 0,
          customer_id: '',
          product_type: nextEvent!.productType || 'onlineSpeedDating',
          product_id: nextEvent!.productId,
          confirmation_email_sent: true,
          currency: 'usd',
          product_description: `Complimentary ticket - ${nextEvent!.city}`,
          experiment: null,
          checkout_time: new Date().toISOString(),
          name: r.name || null,
          phone_number: r.phone_number || null,
          is_male: r.is_male,
          query_city: r.query_city || null,
        })

        if (insertError) {
          console.error(`Failed to create complimentary checkout for ${r.email}:`, insertError)
          continue
        }

        const successUrl = `${BASE_URL}/checkout-success/${nextEvent!.productType || 'onlineSpeedDating'}?checkoutSessionId=${sessionId}&email=${encodeURIComponent(r.email)}`
        batchEmails.push({
          from: 'Tempo Dating <support@tempodating.com>',
          to: r.email,
          subject,
          html: buildComplimentaryTicketHtml(recipientCity, successUrl),
        })
      }

      const result = await sendBatchEmails(batchEmails)

      await logCampaign(
        productId,
        productType,
        'complimentary-ticket',
        subject,
        recipients.map((r) => r.email),
        'all'
      )

      return NextResponse.json({
        success: true,
        sent: result.totalSent,
        failed: result.totalFailed,
        total: recipients.length,
        audience: 'all',
        nextEventProductId: nextEvent!.productId,
        nextEventCity: nextEvent!.city,
      })
    }

    // ── Standard pre-event / post-event audience ─────────────
    const { males, females } = await getRecipientsForProduct(productId)

    let recipients: Recipient[] = []
    if (audience === 'males') {
      recipients = males
    } else if (audience === 'females') {
      recipients = females
    } else if (audience === 'all') {
      recipients = [...males, ...females]
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for this product' }, { status: 400 })
    }

    console.log(`Sending ${template} email to ${recipients.length} recipients for product ${productId} (audience: ${audience})`)

    const batchEmails = recipients.map((r) => {
      let html: string
      if (template === 'post-event') {
        html = buildPostEventHtml(buildCheckoutSuccessUrl(r))
      } else {
        html = buildPreEventHtml(zoomLink!)
      }
      return {
        from: 'Tempo Dating <support@tempodating.com>' as const,
        to: r.email,
        subject,
        html,
      }
    })

    const result = await sendBatchEmails(batchEmails)

    // Log the campaign
    await logCampaign(
      productId,
      productType,
      template,
      subject,
      recipients.map((r) => r.email),
      audience
    )

    return NextResponse.json({
      success: true,
      sent: result.totalSent,
      failed: result.totalFailed,
      total: recipients.length,
      audience,
    })
  } catch (error) {
    console.error('Error in send-zoom-email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── Batch send helper ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

function isValidEmail(email: string | null | undefined): boolean {
  if (typeof email !== 'string') return false
  const trimmed = email.trim()
  // Reject consecutive dots anywhere in the address
  if (trimmed.includes('..')) return false
  return EMAIL_REGEX.test(trimmed)
}

async function sendBatchEmails(
  batchEmails: { from: string; to: string; subject: string; html: string }[]
): Promise<{ totalSent: number; totalFailed: number }> {
  // Filter out invalid emails before sending
  const validEmails = batchEmails.filter((e) => isValidEmail(e.to))
  const invalidEmails = batchEmails.filter((e) => !isValidEmail(e.to))
  const skipped = invalidEmails.length
  if (skipped > 0) {
    console.warn(`Skipped ${skipped} emails with invalid/null addresses:`, invalidEmails.map((e) => e.to))
  }

  let totalSent = 0
  let totalFailed = skipped
  const BATCH_SIZE = 100
  const totalChunks = Math.ceil(validEmails.length / BATCH_SIZE)

  for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
    const chunkIndex = i / BATCH_SIZE + 1
    const chunk = validEmails.slice(i, i + BATCH_SIZE)

    // Add delay between batches to avoid Resend rate limits
    if (i > 0) {
      await sleep(1500)
    }

    const { data, error } = await resend.batch.send(chunk)

    if (error) {
      console.error(`Batch send error (chunk ${chunkIndex}/${totalChunks}):`, error)

      // On validation error, fall back to sending individually
      if (error.name === 'validation_error') {
        console.log(`Falling back to individual sends for chunk ${chunkIndex}/${totalChunks}`)
        for (let j = 0; j < chunk.length; j++) {
          const email = chunk[j]
          // Rate limit: pause every 10 individual sends to avoid Resend throttling
          if (j > 0 && j % 10 === 0) {
            await sleep(1000)
          }
          try {
            const { error: singleError } = await resend.emails.send(email)
            if (singleError) {
              console.error(`Failed to send to ${email.to}:`, singleError.message)
              totalFailed++
            } else {
              totalSent++
            }
          } catch (e) {
            console.error(`Exception sending to ${email.to}:`, e)
            totalFailed++
          }
        }
      } else {
        // Rate limit or transient error — wait and retry once
        await sleep(3000)
        const { data: retryData, error: retryError } = await resend.batch.send(chunk)
        if (retryError) {
          console.error(`Retry failed for chunk ${chunkIndex}/${totalChunks}:`, retryError)
          totalFailed += chunk.length
        } else {
          const count = retryData?.data?.length ?? chunk.length
          totalSent += count
          console.log(`Batch chunk ${chunkIndex}/${totalChunks} sent on retry: ${count} emails`)
        }
      }
    } else {
      const count = data?.data?.length ?? chunk.length
      totalSent += count
      console.log(`Batch chunk ${chunkIndex}/${totalChunks} sent: ${count} emails`)
    }
  }

  return { totalSent, totalFailed }
}
