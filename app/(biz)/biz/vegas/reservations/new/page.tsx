import { createClient } from '@/utils/supabase/server';
import { BookingEditPage } from '../components/server-booking';
import { createReservation } from '@/utils/old_db/actions';
import { redirect } from 'next/navigation';
import { Reservation } from '../../../types';
import { fetchHotels, getUserDetails } from '@/utils/supabase/queries';
import { PlusCircle } from 'lucide-react'; // Added icon for visual context

export default async function NewReservationPage() {
  const supabase = await await createClient();
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
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    
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

    // Extract date and ensure it's in YYYY-MM-DD format
    const schDateValue = formData.get('sch_date') as string;
    let bookingDate: Date;
    
    try {
      bookingDate = new Date(schDateValue + 'T00:00:00'); // Add time to avoid timezone issues
      if (isNaN(bookingDate.getTime())) throw new Error('Invalid date format');
    } catch (error) {
      console.error('Date parsing error:', error);
      throw new Error('Invalid booking date format');
    }

    // Extract all fields from form data
    const newReservation: Partial<Reservation> = {
      full_name: formData.get('full_name') as string,
      sch_date: bookingDate,
      sch_time: formData.get('sch_time') as string || '',
      agent: userFullName,
      location: formData.get('location') as string || 'Nellis60',
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
      total_cost: safeParseFloat(formData.get('total_cost')),
    };

    // Validate required fields
    if (!newReservation.full_name || !newReservation.sch_date) {
      throw new Error('Full name and booking date are required');
    }

    // Filter invalid dates
    const filteredDates = ['1999-12-31', '1970-01-01', '1969-12-31', '1980-01-01'];
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
    // SEMANTIC CONTAINER: Inherits text-foreground for correct text color in both modes
    <div className="w-full max-w-7xl mx-auto p-6 text-foreground">
      {/* HEADER: Uses border-border for semantic separation */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
        <PlusCircle className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Create New Reservation</h1>
      </div>
      
      <form action={createReservationHandler} className="space-y-8">
        <BookingEditPage 
          hotels={hotels}
          initialData={undefined}
          viewMode={false} 
        />
        
        {/* FOOTER ACTION BAR */}
        <div className="flex justify-end pt-6 border-t border-border">
          {/* SEMANTIC BUTTON: Uses primary brand color */}
          <button
            type="submit"
            className="px-8 py-3 bg-primary text-primary-foreground font-bold text-lg rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Confirm & Create Booking
          </button>
        </div>
      </form>
    </div>
  );
}