import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { createClient } from './server';
import { Json } from '@/types_db';

export const getUser = cache(async (supabase: SupabaseClient) => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    console.log('run getUser');
    return user;
  } catch (error) {
    console.error(error);
  }
});
type UserDetails = {
  avatar_url: string | null;
  billing_address: Json | null;
  full_name: string | null;
  id: string;
  payment_method: Json | null;
  user_level?: number; // Add user_level to the type definition
};

export const getUserDetails = cache(
  async (): Promise<UserDetails | null | undefined> => {
    try {
      const supabase = createClient();
      const { data: userDetails } = await supabase
        .from('users')
        .select('*')
        .single();
      console.log('run getUserDetails');
      return userDetails;
    } catch (error) {
      console.error(error);
    }
  }
);

export const updateUserName = cache(
  async (supabase: SupabaseClient, name: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ full_name: name })
      .eq('id', await getUser(supabase).then((user) => user?.id));
    return { data, error };
  }
);

export const updateUserLevel = cache(
  async (supabase: SupabaseClient, user_level: number) => {
    const { data, error } = await supabase
      .from('users')
      .update({ user_level })
      .eq('id', await getUser(supabase).then((user) => user?.id));
    return { data, error };
  }
);

export const fetchHotels = cache(async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.from('hotels').select();
  if (error) {
    console.error(error);
    return [];
  }
  return data;
});
