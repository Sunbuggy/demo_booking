import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { fetchHotels, getUser } from '@/utils/supabase/queries';
import { MiniBajaPage } from '../serve-bookings/mbj';
import { FamilyFunRompPage } from '../serve-bookings/ffr';
import { ValleyOfFirePage } from '../serve-bookings/vof';
import { ATVPage } from '../serve-bookings/atv';
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
  if (viewProp === 'minibaja-chase') return <MiniBajaPage hotels={hotels} />;
  if (viewProp === 'family-fun-romp')
    return <FamilyFunRompPage hotels={hotels} />;
  if (viewProp === 'valley-of-fire')
    return <ValleyOfFirePage hotels={hotels} />;
  if (viewProp === 'atv-tours') return <ATVPage hotels={hotels} />;
}
