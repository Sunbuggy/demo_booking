import { createClient } from '@/utils/supabase/server';
import { BookingEditPage } from '../components/server-booking';
import { createReservation } from '@/utils/old_db/actions';
import { redirect } from 'next/navigation';
import { Reservation } from '../../types';
import { fetchHotels, getUserDetails } from '@/utils/supabase/queries';

export default async function NewReservationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect('/signin');
  }
  
  // Get user details to access full_name
  const userDetails = await getUserDetails(supabase);
  const userFullName = userDetails?.[0]?.full_name || 'SunbuggyNet';
  
  const [hotels] = await Promise.all([fetchHotels(supabase)]);
  
  async function createReservationHandler(formData: FormData) {
    'use server';
    
    // Safe number parsing function
    const safeParseInt = (value: FormDataEntryValue | null) => {
      if (!value) return 0;
      const num = parseInt(value.toString());
      return isNaN(num) ? 0 : num;
    };

    // Safe float parsing function for total_cost
    const safeParseFloat = (value: FormDataEntryValue | null) => {
      if (!value) return 0;
      const num = parseFloat(value.toString());
      return isNaN(num) ? 0 : num;
    };

    // Extract all fields from form data
    const newReservation: Partial<Reservation> = {
      full_name: formData.get('full_name') as string,
      sch_date: new Date(formData.get('sch_date') as string), // This becomes Res_Date
      sch_time: formData.get('sch_time') as string || '',
      agent: userFullName, // Use user's full_name or 'SunbuggyNet' as fallback
      location: formData.get('location') as string || 'Nellis60',
      occasion: formData.get('occasion') as string || '',
      ppl_count: safeParseInt(formData.get('ppl_count')),
      phone: formData.get('phone') as string || '',
      email: formData.get('email') as string || '',
      hotel: formData.get('hotel') as string || '',
      notes: formData.get('notes') as string || '',
      // Add vehicle counts - ensure all are included even if 0
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
      total_cost: safeParseFloat(formData.get('total_cost')),
    };

    console.log('Creating new reservation with data:', newReservation);
    console.log('Agent set to:', userFullName);
    console.log('Booking date (Res_Date):', newReservation.sch_date);

    // Validate required fields
    if (!newReservation.full_name || !newReservation.sch_date) {
      throw new Error('Full name and booking date are required');
    }

    // Ensure the booking date is not one of the filtered dates
    const bookingDate = newReservation.sch_date;
    const filteredDates = [
      '1999-12-31',
      '1970-01-01', 
      '1969-12-31',
      '1980-01-01'
    ];
    
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    if (filteredDates.includes(bookingDateStr)) {
      throw new Error('Invalid booking date');
    }

    const result = await createReservation(newReservation);
    
    if (!result.success) {
      console.error('Failed to create reservation:', result.error);
      throw new Error(`Failed to create reservation: ${result.error}`);
    }
    
    // Redirect to the new reservation's edit page
    redirect(`/biz/reservations/${result.reservationId}`);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Reservation</h1>
      </div>
      
      <form action={createReservationHandler} className="space-y-6">
        <BookingEditPage 
          hotels={hotels}
          initialData={undefined}
          viewMode={false} 
        />
        
        {/* Notes Section */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <textarea
            name="notes"
            className="w-full p-3 border rounded-lg min-h-[150px]"
            placeholder="Add notes about this reservation..."
          />
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <a 
            href="/biz/reservations"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Reservation
          </button>
        </div>
      </form>
    </div>
  );
}