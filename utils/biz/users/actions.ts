'use server';

import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const removeUser = cache(async (userId: string) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data, error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error(error, `removeUser Error! userId: ${userId}`);
    return [];
  }
  return data;
});
