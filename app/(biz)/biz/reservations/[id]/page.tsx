import { createClient } from '@/utils/supabase/server';
import { fetchHotels } from '@/utils/supabase/queries';
import { MiniBajaPage } from '../components/booking-type/mbj/server-booking';
import { getReservationById, updateReservation } from '@/utils/old_db/actions'; 
import { redirect } from 'next/navigation';
import { Reservation } from '@/app/(biz)/biz/types';

export default async function ReservationPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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

  // Handle form submission for editing reservation
  async function handleEditReservation(formData: FormData) {
    'use server';
    
    // Collect all form data
    const updates: Partial<Reservation> = {
      sch_date: new Date(formData.get('bookingDate') as string),
      sch_time: formData.get('time') as string,
      location: formData.get('location') as string,
      full_name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      occasion: formData.get('groupName') as string,
      hotel: formData.get('hotel') as string || 'Drive here',
      ppl_count: parseInt(formData.get('howManyPeople') as string),
      total_cost: parseFloat(formData.get('total_cost') as string),
      notes: formData.get('notes') as string,
      // Vehicle counts
      twoSeat4wd: parseInt(formData.get('twoSeat4wd') as string) || 0,
      UZ2: parseInt(formData.get('UZ2') as string) || 0,
      UZ4: parseInt(formData.get('UZ4') as string) || 0,
      RWG: parseInt(formData.get('RWG') as string) || 0,
      GoKartplus: parseInt(formData.get('GoKartplus') as string) || 0,
      GoKart: parseInt(formData.get('GoKart') as string) || 0,
    };

    const result = await updateReservation(reservation.res_id, updates);
    
    if (result.success) {
      redirect(`/biz/reservations/${params.id}?success=true`);
    } else {
      console.error('Failed to update reservation:', result.error);
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Reservation #{reservation.res_id} - {reservation.full_name}
      </h1>
      
      <form action={handleEditReservation} className="space-y-6">
        <MiniBajaPage 
          hotels={[]} 
          initialData={reservation} 
          editMode={true} 
        />
        
        {/* Notes Section */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <textarea
            name="notes"
            defaultValue={reservation.notes || ''}
            className="w-full p-3 border rounded-lg min-h-[150px]"
            placeholder="Add notes about this reservation..."
          />
        </div>
        
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded-lg"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}