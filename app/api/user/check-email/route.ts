import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const supabase = await createServerSupabaseClient();

      // Check if user exists in auth.users via public.users table
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, gender, age')
        .eq('email', normalizedEmail)
        .maybeSingle();

      console.log('📧 Email check for:', normalizedEmail, {
        found: !!data,
        hasProfile: !!(data?.full_name && data?.gender && data?.age),
        userId: data?.id,
        error: error?.message
      });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected for new users
        console.error('Error checking email:', error);
        // Fallback: assume new user on database error
        return NextResponse.json({ 
          exists: false,
          userId: null,
          hasCompleteProfile: false
        }, { status: 200 });
      }

      const hasCompleteProfile = !!(data?.full_name && data?.gender && data?.age);

      return NextResponse.json({ 
        exists: !!data,
        userId: data?.id || null,
        hasCompleteProfile: hasCompleteProfile
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Fallback: treat as new user if database is unreachable
      return NextResponse.json({ 
        exists: false,
        userId: null
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in check-email endpoint:', error);
    // Final fallback: treat as new user
    return NextResponse.json({ 
      exists: false,
      userId: null
    }, { status: 200 });
  }
}
