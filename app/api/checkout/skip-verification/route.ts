import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

/**
 * API: Skip Email Verification
 * 
 * Called when a user clicks "Skip for now" on the checkout success page.
 * This does the same thing as completing OTP would:
 * 
 * 1. Finds or creates the auth.user by email
 * 2. Creates the public.users record from checkout data
 * 3. Assigns the checkout to the user
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('========================================');
  console.log('⏭️ SKIP VERIFICATION - START');
  console.log('========================================');

  try {
    const { checkoutSessionId, email } = await request.json();

    console.log('📥 Received request:', { checkoutSessionId, email });

    if (!checkoutSessionId) {
      return NextResponse.json({ error: 'Checkout session ID is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    // =========================================================
    // STEP 1: Fetch the checkout record
    // =========================================================
    console.log('📋 STEP 1: Fetching checkout record...');
    
    const { data: checkout, error: fetchError } = await supabase
      .from('checkout')
      .select('*')
      .eq('checkout_session_id', checkoutSessionId)
      .single();

    if (fetchError || !checkout) {
      console.log('❌ Error fetching checkout:', fetchError);
      return NextResponse.json({ error: 'Checkout not found' }, { status: 404 });
    }

    console.log('✅ Checkout found:', {
      checkout_id: checkout.checkout_id,
      email: checkout.email,
      name: checkout.name,
      is_male: checkout.is_male,
      query_city: checkout.query_city,
    });

    // =========================================================
    // STEP 2: Find or create auth.user by email
    // =========================================================
    console.log('👤 STEP 2: Finding or creating auth.user...');

    let authUserId: string | null = null;

    // Try to create the user first — this is the fast path for new users
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
    });

    if (newUser?.user) {
      authUserId = newUser.user.id;
      console.log('✅ Created new auth.user:', authUserId);
    } else if (createError && (createError as any).code === 'email_exists') {
      // User already exists — look them up
      console.log('ℹ️ Auth user already exists, looking up...');
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });

      // listUsers doesn't support email filter, so use a targeted approach
      // Try generating a link which will give us the user id
      const { data: linkCheck } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase(),
      });

      if (linkCheck?.user?.id) {
        authUserId = linkCheck.user.id;
        console.log('✅ Found existing auth.user via generateLink:', authUserId);
      }

      if (!authUserId) {
        console.log('❌ Could not find or create auth.user');
        return NextResponse.json({ error: 'Failed to find or create user account' }, { status: 500 });
      }
    } else if (createError) {
      console.log('❌ Unexpected error creating auth.user:', createError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // =========================================================
    // STEP 3: Create or update public.users record
    // =========================================================
    console.log('📝 STEP 3: Creating/updating public.users record...');

    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (!existingProfile) {
      // Create new public.users record
      const insertData: Record<string, any> = {
        id: authUserId,
        email: email.toLowerCase(),
      };

      if (checkout.name) insertData.full_name = checkout.name;
      if (checkout.is_male !== null) insertData.is_male = checkout.is_male;
      if (checkout.query_city) {
        insertData.city = checkout.query_city;
        insertData.country = checkout.query_city;
      }

      const { error: insertError } = await supabase.from('users').insert(insertData);

      if (insertError) {
        console.log('❌ Error creating public.users:', insertError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      console.log('✅ Created public.users record:', insertData);
    } else {
      // Update existing record with any missing fields
      const updateData: Record<string, any> = {};
      if (checkout.name && !existingProfile.full_name) updateData.full_name = checkout.name;
      if (checkout.is_male !== null && existingProfile.is_male === null) updateData.is_male = checkout.is_male;
      if (checkout.query_city && !existingProfile.city) updateData.city = checkout.query_city;
      if (checkout.query_city && !existingProfile.country) updateData.country = checkout.query_city;

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        await supabase.from('users').update(updateData).eq('id', authUserId);
        console.log('✅ Updated public.users with:', updateData);
      } else {
        console.log('ℹ️ public.users already has all data');
      }
    }

    // =========================================================
    // STEP 4: Assign checkout to user
    // =========================================================
    console.log('🔗 STEP 4: Assigning checkout to user...');

    const { error: updateCheckoutError } = await supabase
      .from('checkout')
      .update({
        user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('checkout_session_id', checkoutSessionId);

    if (updateCheckoutError) {
      console.log('❌ Error assigning checkout:', updateCheckoutError);
      // Non-fatal - user profile was still created
    } else {
      console.log('✅ Checkout assigned to user:', authUserId);
    }

    // =========================================================
    // STEP 5: Generate magic link token for client-side sign-in
    // =========================================================
    console.log('🔑 STEP 5: Generating magic link token...');

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.log('❌ Error generating magic link:', linkError);
      // Non-fatal — user/profile were still created, they just won't be auto-logged in
      return NextResponse.json({
        success: true,
        userId: authUserId,
        tokenHash: null,
      });
    }

    console.log('✅ Magic link token generated');

    console.log('========================================');
    console.log('✅ SKIP VERIFICATION - COMPLETE');
    console.log('========================================');

    return NextResponse.json({
      success: true,
      userId: authUserId,
      tokenHash: linkData.properties.hashed_token,
    });

  } catch (error: any) {
    console.log('❌ FATAL ERROR:', error.message);
    return NextResponse.json(
      { error: 'Server error occurred', details: error.message },
      { status: 500 }
    );
  }
}
