'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
const formatPhone = (phone: string) => {
  const formatted = phone.replace(/\D/g, '');
  return formatted.length === 10 ? `+1${formatted}` : formatted;
};
export async function updateSSTClaimed(
  sstId: string,
  userId: string,
  userPhone: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('vehicle_locations')
    .update({
      claimed_by: userId,
      dispatch_status: 'claimed',
      claimed_at: new Date().toISOString()
    })
    .eq('id', sstId);

  if (error) {
    throw new Error('Failed to update SST');
  }

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      infer_country_code: false,
      user_id: userId,
      text: `Congrats!, You have successfully claimed this SST, You can close the  SST here: ${process.env.NEXT_PUBLIC_SITE_URL}/biz/sst/cases/claimed/${sstId}`,
      to_numbers: formatPhone(userPhone)
    })
  };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/send-sms`,
      options
    );
    if (!res.ok) throw new Error('Failed to send SMS');
  } catch (err) {
    console.error(err);
  }

  revalidatePath('/cases');
}

export async function fetchCasesData() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'User not authenticated' };
  }

  const [ssts, vehicles, users] = await Promise.all([
    supabase
      .from('vehicle_locations')
      .select('*')
      //   .eq('dispatch_status', 'open')
      .gte('dispatched_at', new Date().toISOString().split('T')[0]),
    supabase.from('vehicles').select('id, name'),
    supabase.from('users').select('id, full_name, phone')
  ]);

  if (ssts.error || vehicles.error || users.error) {
    throw new Error('Failed to fetch data');
  }

  const vehicleMap = new Map(
    vehicles.data.map((vehicle) => [vehicle.id, vehicle.name])
  );
  const userMap = new Map(users.data.map((user) => [user.id, user.full_name]));
  const userPhone = users.data.filter((usr) => usr.id === user.id)[0].phone;

  return {
    ssts: ssts.data,
    vehicleMap,
    userMap,
    userId: user.id,
    userPhone: userPhone
  };
}
