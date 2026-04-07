import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export const maxDuration = 120

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = 'https://www.tempodating.com'

interface RecipientWithCity {
  email: string
  is_male: boolean
  query_city: string | null
}

async function getRecipientsWithCity(productId: number): Promise<{ males: RecipientWithCity[]; females: RecipientWithCity[] }> {
  const supabase = createServiceSupabaseClient()

  const { data: checkouts, error } = await supabase
    .from('checkout')
    .select('is_male, user_id, email, query_city')
    .eq('product_id', productId)
    .eq('confirmation_email_sent', true)

  if (error || !checkouts) {
    console.error('Error fetching recipients:', error)
    return { males: [], females: [] }
  }

  const seen = new Set<string>()
  const males: RecipientWithCity[] = []
  const females: RecipientWithCity[] = []

  for (const c of checkouts) {
    const key = c.user_id || c.email
    if (!key || seen.has(key)) continue
    seen.add(key)
    if (!c.email) continue

    const r: RecipientWithCity = { email: c.email, is_male: c.is_male === true, query_city: c.query_city }
    if (c.is_male === true) males.push(r)
    else if (c.is_male === false) females.push(r)
  }

  return { males, females }
}

function buildInviteHtml(inviteGender: 'male' | 'female', inviteLink: string): string {
  const genderLabel = inviteGender === 'female' ? 'Female' : 'Male'
  const genderPronoun = inviteGender === 'female' ? 'her' : 'him'
  const friendWord = inviteGender === 'female' ? 'female friend' : 'male friend'
  const emoji = inviteGender === 'female' ? '👩' : '👨'

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px;">
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hi there,</p>
          <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for signing up to our upcoming Speed Dating event! 🎉
          </p>
          <div style="background-color: #fdf2f8; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <p style="color: #9d174d; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
              ${emoji} We have 1 spot available for a ${genderLabel}!
            </p>
            <p style="color: #831843; font-size: 15px; line-height: 1.6; margin: 0;">
              If you'd like to invite a <strong>${friendWord}</strong>, share this link with ${genderPronoun} — it's a <strong>free ticket</strong>, on us!
            </p>
          </div>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${inviteLink}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Invite a ${genderLabel} Friend</a>
          </div>
          <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0 0 24px 0; word-break: break-all;">
            <a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a>
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
            Simply forward this email or share the link above with your friend. The spot is first come, first served!
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 24px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
}

async function logCampaign(
  productId: number,
  template: string,
  subject: string,
  recipientEmails: string[],
  audience: string
) {
  const supabase = createServiceSupabaseClient()
  await supabase.from('email_campaigns').insert({
    product_id: productId,
    product_type: 'onlineSpeedDating',
    template,
    subject,
    recipient_emails: recipientEmails,
    recipient_count: recipientEmails.length,
    audience,
    sent_at: new Date().toISOString(),
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function sendBatchEmails(
  batchEmails: { from: string; to: string; subject: string; html: string }[]
): Promise<{ totalSent: number; totalFailed: number }> {
  const validEmails = batchEmails.filter((e) => EMAIL_REGEX.test(e.to?.trim() || ''))
  let totalSent = 0
  let totalFailed = batchEmails.length - validEmails.length
  const BATCH_SIZE = 100

  for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
    const chunk = validEmails.slice(i, i + BATCH_SIZE)
    if (i > 0) await sleep(1500)

    const { data, error } = await resend.batch.send(chunk)
    if (error) {
      console.error('Batch send error:', error)
      if (error.name === 'validation_error') {
        for (const email of chunk) {
          try {
            const { error: singleError } = await resend.emails.send(email)
            if (singleError) totalFailed++
            else totalSent++
          } catch {
            totalFailed++
          }
        }
      } else {
        await sleep(3000)
        const { error: retryError } = await resend.batch.send(chunk)
        if (retryError) totalFailed += chunk.length
        else totalSent += chunk.length
      }
    } else {
      totalSent += data?.data?.length ?? chunk.length
    }
  }

  return { totalSent, totalFailed }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, audience, inviteGender, testEmail } = body as {
      productId: number
      audience: 'males' | 'females' | 'both' | 'test'
      inviteGender: 'male' | 'female'
      testEmail?: string
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    if (!['males', 'females', 'both', 'test'].includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
    }

    if (!['male', 'female'].includes(inviteGender)) {
      return NextResponse.json({ error: 'inviteGender must be male or female' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()
    const { males, females } = await getRecipientsWithCity(productId)

    // Test send
    if (audience === 'test') {
      if (!testEmail) {
        return NextResponse.json({ error: 'testEmail is required' }, { status: 400 })
      }
      const inviteLink = `${BASE_URL}/product?productId=${productId}&productType=onlineSpeedDating&city=TestCity&redemptionId=TEST`
      const html = buildInviteHtml(inviteGender, inviteLink)
      const { error } = await resend.emails.send({
        from: 'Tempo Dating <support@tempodating.com>',
        to: testEmail,
        subject: `Invite a ${inviteGender === 'female' ? 'Female' : 'Male'} Friend to Speed Dating — Free Spot! 🎁`,
        html,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, sent: 1, audience: 'test' })
    }

    // Build recipient list based on audience
    let recipients: RecipientWithCity[] = []
    if (audience === 'males') recipients = males
    else if (audience === 'females') recipients = females
    else if (audience === 'both') recipients = [...males, ...females]

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Create a single redemption code for the chosen invite gender
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        product_id: productId,
        product_type: 'onlineSpeedDating',
        for_gender: inviteGender,
        discount_percent: 100,
        max_uses: recipients.length,
        used_count: 0,
        expires_at: expiresAt.toISOString(),
        note: `Invite-a-friend (${inviteGender}) for product #${productId} — sent to ${audience}`,
      })
      .select()
      .single()

    if (redemptionError || !redemption) {
      console.error('Error creating redemption:', redemptionError)
      return NextResponse.json({ error: 'Failed to create redemption code' }, { status: 500 })
    }

    const subject = `Invite a ${inviteGender === 'female' ? 'Female' : 'Male'} Friend to Speed Dating — Free Spot! 🎁`

    const batchEmails = recipients.map((r) => {
      const city = r.query_city || ''
      const params = new URLSearchParams()
      params.set('productId', String(productId))
      params.set('productType', 'onlineSpeedDating')
      if (city) params.set('city', city)
      params.set('redemptionId', redemption.id)
      const inviteLink = `${BASE_URL}/product?${params.toString()}`

      return {
        from: 'Tempo Dating <support@tempodating.com>' as const,
        to: r.email,
        subject,
        html: buildInviteHtml(inviteGender, inviteLink),
      }
    })

    const result = await sendBatchEmails(batchEmails)

    await logCampaign(
      productId,
      `invite-friend-${inviteGender}`,
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
    console.error('Error in send-invite-email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
