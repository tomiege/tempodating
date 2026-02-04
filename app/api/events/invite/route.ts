import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Supabase auth
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile to get their name
    const serviceSupabase = createServiceSupabaseClient()
    const { data: userProfile } = await serviceSupabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { toEmail, productId, productType, discountAmount, city } = body

    // Validate inputs
    if (!toEmail || !productId || !productType || !discountAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(toEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Use fixed discount code for Valentine's invite
    const discountCode = "VALENTINESINVITE20"

    // Create the invitation record
    const { data: invitation, error: insertError } = await serviceSupabase
      .from('event_invitations')
      .insert({
        from_user_id: user.id,
        to_email: toEmail.toLowerCase(),
        sent_at: new Date().toISOString(),
        discount_amount: parseInt(discountAmount),
        product_id: parseInt(productId),
        product_type: productType,
        discount_code: discountCode,
        used: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating invitation:', insertError)
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      )
    }

    // Send invitation email using Resend
    const senderName = userProfile?.full_name || user.email || "A friend"
    const senderEmail = userProfile?.email || user.email || ""
    const eventCity = city || "your area"
    const inviteUrl = `https://www.tempodating.com/product?productId=${productId}&productType=${productType}${city ? `&city=${encodeURIComponent(city)}` : ''}&src=invite`

    try {
      const { error: emailError } = await resend.emails.send({
        from: 'Tempo Dating <noreply@tempodating.com>',
        to: toEmail,
        subject: `${senderName} invited you to an Online Speed Dating event! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background-color: #fce7f3; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
                  <span style="font-size: 48px;">💌</span>
                </div>
                <h1 style="color: #ec4899; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">You've Been Invited!</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 0;">Join ${senderName} for Online Speed Dating</p>
              </div>

              <!-- Invitation Card -->
              <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  <strong>${senderName}</strong> ${senderEmail ? `(${senderEmail})` : ''} has invited you to an Online Speed Dating event in <strong>${eventCity}</strong>!
                </p>

                <!-- Discount Highlight -->
                <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Special Discount Code</p>
                  <div style="background-color: rgba(255,255,255,0.2); border: 2px dashed #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 8px;">
                    <p style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; font-family: monospace; letter-spacing: 2px;">${discountCode}</p>
                  </div>
                  <p style="color: #fce7f3; font-size: 18px; font-weight: 600; margin: 0;">Get 20% off your ticket!</p>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  Click below to register and use the discount code at checkout to save 20% on your ticket.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center;">
                  <a href="${inviteUrl}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Register Now</a>
                </div>
              </div>

              <!-- What to Expect -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>What to expect:</strong> Meet other singles in a fun, virtual speed dating event. Make meaningful connections from the comfort of your home!
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                <p style="margin: 0 0 8px 0;">Questions? Contact us at support@tempodating.com</p>
                <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      })

      if (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Still return success since invitation was created
      } else {
        console.log('✅ Invitation email sent to:', toEmail)
      }
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr)
      // Still return success since invitation was created
    }
    
    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      discountCode,
      invitationId: invitation.id
    })

  } catch (error) {
    console.error("Error sending invitation:", error)
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve invitations sent by a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceSupabaseClient()
    const { data: invitations, error: fetchError } = await serviceSupabase
      .from('event_invitations')
      .select('*')
      .eq('from_user_id', user.id)
      .order('sent_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching invitations:', fetchError)
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invitations
    })

  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    )
  }
}
