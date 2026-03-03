import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = 'https://www.tempodating.com'

interface OnlineSpeedDatingEvent {
  productId: number
  zoomInvite: string
  city: string
  gmtdatetime: string
  timezone: string
}

function getZoomLinkForProduct(productId: number): OnlineSpeedDatingEvent | null {
  const filePath = path.join(process.cwd(), 'public', 'products', 'onlineSpeedDating.json')
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const events: OnlineSpeedDatingEvent[] = JSON.parse(fileContent)
  return events.find((e) => e.productId === productId) || null
}

interface Recipient {
  email: string
  is_male: boolean
  checkout_session_id: string
  product_type: string
}

async function getRecipientsForProduct(productId: number): Promise<{ males: Recipient[]; females: Recipient[] }> {
  const supabase = createServiceSupabaseClient()

  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('is_male, user_id, email, checkout_session_id, product_type')
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
    }
    if (c.is_male === true) males.push(recipient)
    else if (c.is_male === false) females.push(recipient)
  }

  return { males, females }
}

// ─── Email Templates ───────────────────────────────────────────────

export type TemplateId = 'pre-event' | 'post-event'

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

const TEMPLATE_SUBJECTS: Record<TemplateId, string> = {
  'pre-event': 'Your online Speed Dating event is starting soon!',
  'post-event': 'Thank you for attending! Select your matches 💕',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, audience, testEmail, template = 'pre-event' } = body as {
      productId: number
      audience: 'males' | 'females' | 'all' | 'test'
      testEmail?: string
      template?: TemplateId
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const subject = TEMPLATE_SUBJECTS[template]

    // For pre-event, we need the zoom link
    let zoomLink: string | null = null
    if (template === 'pre-event') {
      const event = getZoomLinkForProduct(productId)
      if (!event) {
        return NextResponse.json({ error: 'No zoom link found for this product' }, { status: 404 })
      }
      zoomLink = event.zoomInvite
    }

    // Test send — single email
    if (audience === 'test') {
      if (!testEmail) {
        return NextResponse.json({ error: 'testEmail is required for test sends' }, { status: 400 })
      }

      const { testCheckoutSessionId } = body as { testCheckoutSessionId?: string }

      let html: string
      if (template === 'post-event') {
        // Look up the real checkout to build a working link
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
      } else {
        html = buildPreEventHtml(zoomLink!)
      }

      const { error } = await resend.emails.send({
        from: 'Tempo Dating <noreply@tempodating.com>',
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

    // Fetch recipients from DB server-side
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

    // Build per-recipient emails (post-event gets personalized links)
    const batchEmails = recipients.map((r) => {
      let html: string
      if (template === 'post-event') {
        html = buildPostEventHtml(buildCheckoutSuccessUrl(r))
      } else {
        html = buildPreEventHtml(zoomLink!)
      }
      return {
        from: 'Tempo Dating <noreply@tempodating.com>',
        to: r.email,
        subject,
        html,
      }
    })

    // Resend batch supports up to 100 emails per call, chunk if needed
    let totalSent = 0
    let totalFailed = 0
    const BATCH_SIZE = 100

    for (let i = 0; i < batchEmails.length; i += BATCH_SIZE) {
      const chunk = batchEmails.slice(i, i + BATCH_SIZE)
      const { data, error } = await resend.batch.send(chunk)

      if (error) {
        console.error(`Batch send error (chunk ${i / BATCH_SIZE + 1}):`, error)
        totalFailed += chunk.length
      } else {
        totalSent += data?.data?.length ?? chunk.length
        console.log(`Batch chunk ${i / BATCH_SIZE + 1} sent:`, data?.data?.length ?? chunk.length)
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
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
