import { createClient } from '@/utils/supabase/server';
import { BookingEditPage } from '../components/server-booking';
import { getReservationById, updateFullReservation } from '@/utils/old_db/actions';
import { redirect } from 'next/navigation';
import { Reservation } from '../../../types';
import { fetchHotels, getUserDetails } from '@/utils/supabase/queries';
import { FileText, Save, UserCheck } from 'lucide-react'; // Added icons for UI polish

export default async function ReservationPage({
  params
}: {
  params: Promise<{ id: string }>; 
}) {
  // UNWRAP THE PARAMS PROMISE
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await (await supabase).auth.getUser();
  
  if (!user) {
    return redirect('/signin');
  }
  
  // Get user details for agent name
  const userDetails = await getUserDetails(supabase);
  const userFullName = userDetails?.[0]?.full_name || 'SunbuggyNet';
  
  // Data Fetching
  const reservation = await getReservationById(id);
  const [hotels] = await Promise.all([fetchHotels(await supabase)]);
  
  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <h1 className="text-3xl font-bold text-white mb-2">Reservation Not Found</h1>
        <p>The reservation with ID <span className="font-mono text-yellow-500">#{id}</span> could not be found.</p>
        <a href="/biz/reservations" className="mt-6 text-yellow-500 hover:underline">Return to List</a>
      </div>
    );
  }
  
  async function updateReservationHandler(formData: FormData) {
    'use server';
    const res_id = parseInt(id);
    
    // Helper parsers
    const safeParseInt = (value: FormDataEntryValue | null) => {
      if (!value) return 0;
      const num = parseInt(value.toString());
      return isNaN(num) ? 0 : num;
    };

    const safeParseFloat = (value: FormDataEntryValue | null) => {
      if (!value) return 0;
      const num = parseFloat(value.toString());
      return isNaN(num) ? 0 : num;
    };

    const updates: Partial<Reservation> = {
      full_name: formData.get('full_name') as string,
      sch_date: new Date(formData.get('sch_date') as string),
      sch_time: formData.get('sch_time') as string || '',
      agent: userFullName, 
      location: formData.get('location') as string || '',
      occasion: formData.get('occasion') as string || '',
      ppl_count: safeParseInt(formData.get('ppl_count')),
      phone: formData.get('phone') as string || '',
      email: formData.get('email') as string || '',
      hotel: formData.get('hotel') as string || '',
      notes: formData.get('notes') as string || '',
      
      // Vehicles
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

    console.log('Updating reservation:', res_id, 'by', userFullName);

    const result = await updateFullReservation(res_id, updates);
    
    if (!result.success) {
      console.error('Failed to update reservation:', result.error);
      throw new Error(`Failed to update reservation: ${result.error}`);
    }
    
    redirect(`/biz/reservations/${id}`);
  }

  return (
    // LAYOUT FIX: Used 'w-full max-w-7xl mx-auto' instead of 'container' to prevent left-leaning alignment
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8 text-slate-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">
                  Reservation <span className="text-yellow-500">#{reservation.res_id}</span>
                </h1>
                <p className="text-lg text-slate-400 font-medium mt-1">
                  {reservation.full_name}
                </p>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Status</div>
                <span className="px-3 py-1 bg-green-950 text-green-400 border border-green-900 rounded-full text-xs font-bold uppercase">
                  Active
                </span>
            </div>
        </div>
      </div>
      
      <form action={updateReservationHandler} className="space-y-8">
        <input type="hidden" name="res_id" value={reservation.res_id} />
        
        {/* MAIN FORM COMPONENT */}
        {/* Ensure BookingEditPage accepts className or is styled internally to match Slate-900 backgrounds */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-1 md:p-6 shadow-sm">
            <BookingEditPage 
              hotels={hotels}
              initialData={reservation} 
              viewMode={false} 
            />
        </div>
        
        {/* NOTES SECTION - THEMED */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-white">Internal Notes</h2>
          </div>
          <div className="p-6">
             <textarea
                name="notes"
                defaultValue={reservation.notes || ''}
                className="w-full p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all min-h-[150px] resize-y font-mono text-sm"
                placeholder="Add notes about this reservation (customer requests, payment details, etc.)..."
             />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-800/50">
          
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
             <UserCheck className="w-3 h-3" />
             <span>
                Last updated by: <strong className="text-slate-300">{reservation.agent || 'System'}</strong>
                {reservation.agent !== userFullName && (
                  <> • Editing as: <strong className="text-yellow-500">{userFullName}</strong></>
                )}
             </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 w-full md:w-auto">
             <a href="/biz/reservations" className="text-sm text-slate-500 hover:text-white transition-colors px-4">
                Cancel
             </a>
             <button
                type="submit"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-yellow-500 text-black font-bold uppercase tracking-wider rounded-lg hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform active:scale-95"
             >
                <Save className="w-4 h-4" />
                Save Changes
             </button>
          </div>
        </div>

      </form>
    </div>
  );
}