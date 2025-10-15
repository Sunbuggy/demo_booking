import { createClient } from '@/utils/supabase/server';
import { BookingEditPage } from '../components/server-booking';
import { getReservationById, updateFullReservation } from '@/utils/old_db/actions';
import { redirect } from 'next/navigation';
import { Reservation } from '../../types';
import { fetchHotels } from '@/utils/supabase/queries';

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
  const [hotels] = await Promise.all([fetchHotels(supabase)]);
  
  if (!reservation) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center">
        <h1 className="text-2xl font-bold">Reservation Not Found</h1>
        <p className="mt-4">The reservation with ID #{params.id} could not be found.</p>
      </div>
    );
  }
  
  async function updateReservationHandler(formData: FormData) {
    'use server';
    const res_id = parseInt(params.id);
    
    // Safe number parsing function
    const safeParseInt = (value: FormDataEntryValue | null) => {
      if (!value) return 0;
      const num = parseInt(value.toString());
      return isNaN(num) ? 0 : num;
    };

    // Extract all fields from form data
    const updates: Partial<Reservation> = {
      full_name: formData.get('full_name') as string,
      sch_date: new Date(formData.get('sch_date') as string),
      sch_time: formData.get('sch_time') as string || '',
      agent: formData.get('agent') as string || '',
      location: formData.get('location') as string || '',
      occasion: formData.get('occasion') as string || '',
      ppl_count: safeParseInt(formData.get('ppl_count')),
      phone: formData.get('phone') as string || '',
      email: formData.get('email') as string || '',
      hotel: formData.get('hotel') as string || '',
      notes: formData.get('notes') as string || '',
      // Add vehicle counts
      QA: safeParseInt(formData.get('QA')),
      QB: safeParseInt(formData.get('QB')),
      QU: safeParseInt(formData.get('QU')),
      QL: safeParseInt(formData.get('QL')),
      SB1: safeParseInt(formData.get('SB1')),
      SB2: safeParseInt(formData.get('SB2')),
      SB4: safeParseInt(formData.get('SB4')),
      SB5: safeParseInt(formData.get('SB5')),
      SB6: safeParseInt(formData.get('SB6')),
      twoSeat4wd: safeParseInt(formData.get('twoSeat4wd')),
      UZ2: safeParseInt(formData.get('UZ2')),
      UZ4: safeParseInt(formData.get('UZ4')),
      RWG: safeParseInt(formData.get('RWG')),
      GoKartplus: safeParseInt(formData.get('GoKartplus')),
      GoKart: safeParseInt(formData.get('GoKart')),
    };

    const result = await updateFullReservation(res_id, updates);
    
    if (!result.success) {
      console.error('Failed to update reservation:', result.error);
    }
    
    redirect(`/biz/reservations/${params.id}`);
  }

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-6">
        Reservation #{reservation.res_id} - {reservation.full_name}
      </h1>
      
      <form action={updateReservationHandler} className="space-y-6">
        <input type="hidden" name="res_id" value={reservation.res_id} />
        
        <BookingEditPage 
          hotels={hotels}
          initialData={reservation} 
          viewMode={false} 
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
        
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save All Changes
          </button>
        </div>
      </form>
    </div>
  );
}