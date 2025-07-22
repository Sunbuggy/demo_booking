import { createClient } from '@/utils/supabase/server';
import { fetchHotels } from '@/utils/supabase/queries';
import { MiniBajaPage } from '@/app/(com)/book/serve-bookings/mbj';
import { FamilyFunRompPage } from '@/app/(com)/book/serve-bookings/ffr';
import { ValleyOfFirePage } from '@/app/(com)/book/serve-bookings//vof';
import { ATVPage } from '@/app/(com)/book/serve-bookings/atv';
import { getReservationById } from '@/utils/old_db/actions'; 
import { redirect } from 'next/navigation';

export default async function ReservationPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect if not authenticated
  if (!user) {
    return redirect('/signin');
  }
  
  const reservation = await getReservationById(params.id);
  
  if (!reservation) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center">
        <h1 className="text-2xl font-bold">Reservation Not Found</h1>
        <p className="mt-4">The reservation with ID #{params.id} could not be found.</p>
      </div>
    );
  }
  
  // Map location to booking type
  const bookingTypeMap: Record<string, string> = {
    'Nellis30': 'minibaja-chase',
    'Nellis60': 'minibaja-chase',
    'NellisDX': 'minibaja-chase',
    'FamilyFun': 'family-fun-romp',
    'Valley': 'valley-of-fire',
    'RZR_valley': 'valley-of-fire',
    'DunesATV': 'atv-tours',
    // Add other mappings as needed
  };
  
  const bookingType = bookingTypeMap[reservation.location] || 'minibaja-chase';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Reservation #{reservation.res_id} - {reservation.full_name}
      </h1>
      
      {bookingType === 'minibaja-chase' && (
        <MiniBajaPage 
          hotels={[]} 
          initialData={reservation} 
          viewMode={true} 
        />
      )}
{/*       
      {bookingType === 'family-fun-romp' && (
        <FamilyFunRompPage 
          hotels={[]} 
          initialData={reservation} 
          viewMode={true} 
        />
      )}
      
      {bookingType === 'valley-of-fire' && (
        <ValleyOfFirePage 
          hotels={[]} 
          initialData={reservation} 
          viewMode={true} 
        />
      )}
      
      {bookingType === 'atv-tours' && (
        <ATVPage 
          hotels={[]} 
          initialData={reservation} 
          viewMode={true} 
        />
      )} */}
    </div>
  );
}