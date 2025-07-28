import { createClient } from '@/utils/supabase/server';
import { fetchHotels } from '@/utils/supabase/queries';
import { MiniBajaPage } from '@/app/(com)/book/serve-bookings/mbj';
import { FamilyFunRompPage } from '@/app/(com)/book/serve-bookings/ffr';
import { ValleyOfFirePage } from '@/app/(com)/book/serve-bookings//vof';
import { ATVPage } from '@/app/(com)/book/serve-bookings/atv';
import { getReservationById, updateReservation } from '@/utils/old_db/actions'; 
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
  };
  
  const bookingType = bookingTypeMap[reservation.location] || 'minibaja-chase';

  // Handle form submission for notes update
  async function updateNotes(formData: FormData) {
    'use server';
    const notes = formData.get('notes') as string;
    const res_id = parseInt(params.id);
    
    const result = await updateReservation(res_id, { notes });
    
    if (!result.success) {
      console.error('Failed to update notes:', result.error);
      // You could return an error message here if you want to show it to the user
    }
    
    // Revalidate the page to show the updated notes
    redirect(`/biz/reservations/${params.id}`);
  }
  
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
      
      {/* Notes Section */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Notes</h2>
        <form action={updateNotes} className="space-y-4">
          <textarea
            name="notes"
            defaultValue={reservation.notes || ''}
            className="w-full p-3 border rounded-lg min-h-[150px]"
            placeholder="Add notes about this reservation..."
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}