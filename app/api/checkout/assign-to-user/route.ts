import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

/**
 * API: Assign Checkout to User
 * 
 * This endpoint does TWO things every time it's called:
 * 
 * 1. ASSIGN CHECKOUT TO USER
 *    - Sets the user_id field on the checkout record
 *    - Links this purchase to the logged-in user's account
 * 
 * 2. TRANSFER CHECKOUT DATA TO USER PROFILE
 *    - Copies: name, is_male, city (from query_city) to public.users
 *    - Only updates fields that are NULL in the user profile
 *    - Preserves any existing user data
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('========================================');
  console.log('🚀 ASSIGN CHECKOUT TO USER - START');
  console.log('========================================');

  try {
    const { checkoutSessionId, userId } = await request.json();

    console.log('📥 Received request:', { checkoutSessionId, userId });

    if (!checkoutSessionId) {
      console.log('❌ Error: Missing checkoutSessionId');
      return NextResponse.json({ error: 'Checkout session ID is required' }, { status: 400 });
    }

    if (!userId) {
      console.log('❌ Error: Missing userId');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    // =========================================================
    // STEP 1: Fetch the checkout record
    // =========================================================
    console.log('');
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
      current_user_id: checkout.user_id,
    });

    // =========================================================
    // STEP 2: Assign user_id to checkout
    // =========================================================
    console.log('');
    console.log('🔗 STEP 2: Assigning user_id to checkout...');
    
    const { error: updateCheckoutError } = await supabase
      .from('checkout')
      .update({ 
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_session_id', checkoutSessionId);

    if (updateCheckoutError) {
      console.log('❌ Error updating checkout:', updateCheckoutError);
      return NextResponse.json({ error: 'Failed to assign checkout to user' }, { status: 500 });
    }

    console.log('✅ Checkout user_id updated to:', userId);

    // =========================================================
    // STEP 3: Transfer checkout data to user profile
    // =========================================================
    console.log('');
    console.log('👤 STEP 3: Transferring checkout data to user profile...');

    // First, fetch the current user profile
    const { data: userProfile, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userFetchError) {
      console.log('⚠️ User profile not found, will create one');
    } else {
      console.log('📄 Current user profile:', {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        is_male: userProfile.is_male,
        city: userProfile.city,
        country: userProfile.country,
      });
    }

    // Prepare the update data - only update NULL fields
    const updateData: Record<string, any> = {};
    
    // Transfer name if checkout has it and user doesn't
    if (checkout.name && (!userProfile || !userProfile.full_name)) {
      updateData.full_name = checkout.name;
      console.log(`  📝 Will set full_name: "${checkout.name}"`);
    } else {
      console.log(`  ⏭️ Skipping full_name (checkout: "${checkout.name}", user: "${userProfile?.full_name}")`);
    }

    // Transfer is_male if checkout has it and user doesn't
    if (checkout.is_male !== null && (!userProfile || userProfile.is_male === null)) {
      updateData.is_male = checkout.is_male;
      console.log(`  📝 Will set is_male: ${checkout.is_male}`);
    } else {
      console.log(`  ⏭️ Skipping is_male (checkout: ${checkout.is_male}, user: ${userProfile?.is_male})`);
    }

    // Transfer city if checkout has it and user doesn't
    if (checkout.query_city && (!userProfile || !userProfile.city)) {
      updateData.city = checkout.query_city;
      console.log(`  📝 Will set city: "${checkout.query_city}"`);
    } else {
      console.log(`  ⏭️ Skipping city (checkout: "${checkout.query_city}", user: "${userProfile?.city}")`);
    }

    // Transfer country (using query_city as fallback) if user doesn't have it
    if (checkout.query_city && (!userProfile || !userProfile.country)) {
      updateData.country = checkout.query_city;
      console.log(`  📝 Will set country: "${checkout.query_city}"`);
    } else {
      console.log(`  ⏭️ Skipping country (checkout: "${checkout.query_city}", user: "${userProfile?.country}")`);
    }

    // Now update or create the user profile
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      if (!userProfile) {
        // Create new user profile
        console.log('');
        console.log('🆕 Creating new user profile with:', updateData);
        
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: checkout.email,
            ...updateData,
          });

        if (insertError) {
          console.log('❌ Error creating user profile:', insertError);
        } else {
          console.log('✅ User profile created successfully!');
        }
      } else {
        // Update existing user profile
        console.log('');
        console.log('📝 Updating user profile with:', updateData);
        
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          console.log('❌ Error updating user profile:', updateError);
        } else {
          console.log('✅ User profile updated successfully!');
        }
      }
    } else {
      console.log('');
      console.log('ℹ️ No fields to update - user profile already has all data');
    }

    // Fetch the updated checkout and user profile
    const { data: updatedCheckout } = await supabase
      .from('checkout')
      .select('*')
      .eq('checkout_session_id', checkoutSessionId)
      .single();

    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('');
    console.log('========================================');
    console.log('✅ ASSIGN CHECKOUT TO USER - COMPLETE');
    console.log('========================================');
    console.log('Final checkout:', {
      checkout_id: updatedCheckout?.checkout_id,
      user_id: updatedCheckout?.user_id,
    });
    console.log('Final user profile:', {
      id: updatedUser?.id,
      full_name: updatedUser?.full_name,
      is_male: updatedUser?.is_male,
      city: updatedUser?.city,
      country: updatedUser?.country,
    });
    console.log('');

    return NextResponse.json({
      success: true,
      checkout: updatedCheckout,
      userProfile: updatedUser,
      fieldsUpdated: Object.keys(updateData).filter(k => k !== 'updated_at'),
    });

  } catch (error: any) {
    console.log('');
    console.log('❌ FATAL ERROR:', error.message);
    console.log('========================================');
    return NextResponse.json(
      { error: 'Server error occurred', details: error.message },
      { status: 500 }
    );
  }
}
