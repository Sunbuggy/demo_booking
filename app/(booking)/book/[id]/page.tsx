import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { fetchHotels, getUser } from '@/utils/supabase/queries';
import { MiniBajaPage } from '../serve-bookings/mbj';
import { FamilyFunRompPage } from '../serve-bookings/ffr';
export default async function Bookings({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: {};
}) {
  const supabase = createClient();
  const [user, hotels] = await Promise.all([
    getUser(supabase),
    fetchHotels(supabase)
  ]);
  const viewProp = params.id;
  if (viewProp === 'minibajachase') return <MiniBajaPage hotels={hotels} />;
  if (viewProp === 'familyfunromp')
    return <FamilyFunRompPage hotels={hotels} />;
}
