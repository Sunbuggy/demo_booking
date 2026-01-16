'use server';

import { createClient } from '@/utils/supabase/server';

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
  const supabase = await createClient();
  
  try {
    // 1. Check if user exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { userId: existingUser.id, isNewUser: false };
    }

    // 2. Create new user if not found (Silent creation)
    // We intentionally do NOT send a welcome email here.
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        full_name: fullName,
        phone,
        user_level: 1, // Default Customer Level
        created_at: new Date().toISOString()
        // Ensure your database triggers for emails are disabled or check for a flag here
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Silent user creation failed:', createError);
      return { userId: '', isNewUser: false, error: createError.message };
    }

    return { userId: newUser.id, isNewUser: true };

  } catch (err) {
    console.error('Unexpected error in user check:', err);
    return { userId: '', isNewUser: false, error: 'Internal Server Error' };
  }
}