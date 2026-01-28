import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { checkoutSessionId, assignUserId, createUserProfile, profileData } = await request.json();

    if (!checkoutSessionId) {
      return NextResponse.json({ error: 'Checkout session ID is required' }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    // Fetch the checkout record
    const { data: checkout, error: fetchError } = await supabase
      .from('checkout')
      .select('*')
      .eq('checkout_session_id', checkoutSessionId)
      .single();

    if (fetchError || !checkout) {
      console.error('Error fetching checkout:', fetchError);
      return NextResponse.json({ error: 'Checkout not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    let emailSent = false;
    let userProfileCreated = false;

    // Assign user ID if provided and not already assigned
    if (assignUserId && !checkout.user_id) {
      updates.user_id = assignUserId;

      // Create user profile if requested (for new users after OTP verification)
      if (createUserProfile) {
        // Check if user profile already exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', assignUserId)
          .single();

        if (!existingProfile) {
          // Create user profile using checkout data
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: assignUserId,
              email: checkout.email,
              full_name: checkout.name || profileData?.name || null,
              gender: checkout.is_male !== null ? (checkout.is_male ? 'male' : 'female') : null,
              city: checkout.query_city || profileData?.query_city || null,
              country: checkout.query_city || profileData?.query_city || null, // Using city as country fallback
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          } else {
            userProfileCreated = true;
            console.log('✅ User profile created for:', assignUserId);
          }
        }
      }
    }

    // Send confirmation email if not already sent
    if (!checkout.confirmation_email_sent && checkout.email) {
      const origin = request.headers.get('origin') || request.nextUrl.origin;
      const successPageUrl = `${origin}/checkout-success/${checkout.product_type}?checkoutSessionId=${checkoutSessionId}&email=${encodeURIComponent(checkout.email)}`;

      const formatPrice = (cents: number) => {
        return (cents / 100).toFixed(2);
      };

      try {
        const { error: emailError } = await resend.emails.send({
          from: 'Tempo Dating <noreply@tempodating.com>',
          to: checkout.email,
          subject: '✅ Order Confirmed - Tempo Dating',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; background-color: #f9fafb;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Success Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
                    <span style="font-size: 48px;">✅</span>
                  </div>
                  <h1 style="color: #16a34a; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Order Confirmed!</h1>
                  <p style="color: #6b7280; font-size: 16px; margin: 0;">Thank you for your purchase</p>
                </div>

                <!-- Order Details Card -->
                <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px;">
                  <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 24px 0; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">Order Details</h2>
                  
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #6b7280; font-size: 14px;">Order ID</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500;">${checkout.checkout_id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #6b7280; font-size: 14px;">Event</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500;">${checkout.product_description || checkout.product_type}</span>
                    </div>
                    ${checkout.name ? `
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #6b7280; font-size: 14px;">Name</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500;">${checkout.name}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                      <span style="color: #6b7280; font-size: 14px;">Ticket Type</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500;">${checkout.is_male ? 'Male' : 'Female'} Ticket</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Total</span>
                      <span style="color: #16a34a; font-size: 18px; font-weight: 700;">£${formatPrice(checkout.total_order)}</span>
                    </div>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="${successPageUrl}" style="display: inline-block; background-color: #ec4899; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">View Order Details</a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                  <p style="margin: 0 0 8px 0;">Questions? Reply to this email or contact us at support@tempodating.com</p>
                  <p style="margin: 0;">© ${new Date().getFullYear()} Tempo Dating. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
        } else {
          updates.confirmation_email_sent = true;
          emailSent = true;
          console.log('✅ Confirmation email sent to:', checkout.email);
        }
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }
    }

    // Update checkout record if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('checkout')
        .update(updates)
        .eq('checkout_session_id', checkoutSessionId);

      if (updateError) {
        console.error('Error updating checkout:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      checkout: {
        ...checkout,
        ...updates,
      },
      emailSent,
      userProfileCreated,
    });
  } catch (error: any) {
    console.error('Error in checkout confirm:', error);
    return NextResponse.json(
      { error: 'Server error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch checkout details
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutSessionId = searchParams.get('checkoutSessionId');

    if (!checkoutSessionId) {
      return NextResponse.json({ error: 'Checkout session ID is required' }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    const { data: checkout, error } = await supabase
      .from('checkout')
      .select('*')
      .eq('checkout_session_id', checkoutSessionId)
      .single();

    if (error || !checkout) {
      return NextResponse.json({ error: 'Checkout not found' }, { status: 404 });
    }

    return NextResponse.json({ checkout });
  } catch (error: any) {
    console.error('Error fetching checkout:', error);
    return NextResponse.json(
      { error: 'Server error occurred', details: error.message },
      { status: 500 }
    );
  }
}
