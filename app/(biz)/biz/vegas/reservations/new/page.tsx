import { createClient } from '@/utils/supabase/server';
import { BookingEditPage } from '../components/server-booking';
import { redirect } from 'next/navigation';
import { fetchHotels } from '@/utils/supabase/queries';
import { PlusCircle } from 'lucide-react';
import { createReservationAction } from '../actions'; // Import the new action

export default async function NewReservationPage() {
  const supabase = await createClient(); // Fixed typo (removed double await)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect('/signin');
  
  const [hotels] = await Promise.all([fetchHotels(supabase)]);
  
  return (
    <div className="w-full max-w-7xl mx-auto p-6 text-foreground">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
        <PlusCircle className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Create New Reservation</h1>
      </div>
      
      {/* FORM: Points to the separated Server Action */}
      <form action={createReservationAction} className="space-y-8">
        <BookingEditPage 
          hotels={hotels}
          initialData={undefined}
          viewMode={false} 
        />
        
        {/* FOOTER ACTION BAR */}
        <div className="flex justify-end pt-6 border-t border-border">
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