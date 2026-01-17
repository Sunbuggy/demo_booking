/**
 * @file app/actions/user-check.ts
 * @description Server Action to silently verify or create a user during booking.
 * FIX: Forces update of Name/Email/Phone when recovering from a Database Trigger race condition.
 */
'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface UserCheckResult {
  userId: string;
  isNewUser: boolean;
  error?: string;
}

export async function checkOrCreateUserSilent(
  email: string, 
  fullName: string, 
  phone: string
): Promise<UserCheckResult> {
  const cleanEmail = email.trim().toLowerCase();

  // Basic validation
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { userId: '', isNewUser: false, error: 'Invalid Email' };
  }
  
  try {
    // 1. Check if user exists in PUBLIC table first
    const { data: existingPublicUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingPublicUser) {
      return { userId: existingPublicUser.id, isNewUser: false };
    }

    // 2. Create "Shadow Account" in Auth System
    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: phone },
      password: `SunBuggy${Math.random().toString(36).slice(-8)}!`
    });

    if (authError) {
      if (authError.message?.includes('already registered') || authError.status === 422) {
         // Recovery: User exists in Auth, fetch their ID
        const { data: retry } = await supabaseAdmin.from('users').select('id').eq('email', cleanEmail).single();
        if (retry) return { userId: retry.id, isNewUser: false };
        return { userId: '', isNewUser: false, error: 'User exists in Auth but not Public DB.' };
      }
      return { userId: '', isNewUser: false, error: authError.message };
    }

    if (!newAuthUser.user) return { userId: '', isNewUser: false, error: 'Failed to mint Auth ID' };

    const newUserId = newAuthUser.user.id;

    // 3. FORCE PROSPECT LEVEL (Insert or Update)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUserId,
        email: cleanEmail,
        full_name: fullName,
        phone: phone,
        user_level: 50,
      });

    if (insertError) {
      // ⚠️ RACE CONDITION HANDLER
      // If error is "Duplicate Key" (Trigger won the race), the row exists but might be empty (NULLs).
      // We must UPDATE all fields to ensure data integrity.
      if (insertError.code === '23505') {
         await supabaseAdmin
           .from('users')
           .update({ 
             user_level: 50,      // Force Level
             email: cleanEmail,   // Force Email (Fixes NULL)
             full_name: fullName, // Force Name (Fixes NULL)
             phone: phone         // Force Phone (Fixes NULL)
           })
           .eq('id', newUserId);
           
         console.log(`✅ Fixed Skeleton Row: Updated ${cleanEmail} with full details.`);
      } else {
         console.error('Public Profile Sync Failed:', insertError);
      }
    }

    return { userId: newUserId, isNewUser: true };

  } catch (err: any) {
    console.error('Unexpected error:', err);
    return { userId: '', isNewUser: false, error: err.message };
  }
}