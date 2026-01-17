import { createClient } from '@/utils/supabase/server';
import { BookingEditPage } from '../components/server-booking';
import { getReservationById } from '@/utils/old_db/actions';
import { redirect } from 'next/navigation';
import { fetchHotels, getUserDetails } from '@/utils/supabase/queries';
import { FileText, Save, UserCheck, AlertTriangle } from 'lucide-react';
import { updateReservationAction } from '../actions'; // Import the new action

export default async function ReservationPage({
  params
}: {
  params: Promise<{ id: string }>; 
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return redirect('/signin');
  
  // Fetch Data
  const [reservation, hotels, userDetails] = await Promise.all([
    getReservationById(id),
    fetchHotels(supabase),
    getUserDetails(supabase)
  ]);
  
  const userFullName = userDetails?.[0]?.full_name || 'SunbuggyNet';

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Reservation Not Found</h1>
        <p>The reservation <span className="font-mono text-primary">#{id}</span> does not exist in the legacy database.</p>
        <a href="/biz/reservations" className="mt-6 text-primary hover:underline font-medium">Return to List</a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8 text-foreground">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black italic tracking-tight uppercase flex items-center gap-2">
                  Reservation <span className="text-primary">#{reservation.res_id}</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium mt-1">
                  {reservation.full_name}
                </p>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">Status</div>
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full text-xs font-bold uppercase">
                  Active
                </span>
            </div>
        </div>
      </div>
      
      <form action={updateReservationAction} className="space-y-8">
        <input type="hidden" name="res_id" value={reservation.res_id} />
        
        {/* MAIN FORM */}
        {/* We wrap it in a card style to separate it from the background */}
        <div className="bg-card rounded-2xl border border-border p-1 md:p-6 shadow-sm">
            <BookingEditPage 
              hotels={hotels}
              initialData={reservation} 
              viewMode={false} 
            />
        </div>
        
        {/* NOTES SECTION */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Internal Notes</h2>
          </div>
          <div className="p-6">
             <textarea
                name="notes"
                defaultValue={reservation.notes || ''}
                className="w-full p-4 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[150px] resize-y font-mono text-sm"
                placeholder="Add notes about this reservation (customer requests, payment details, etc.)..."
             />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-border">
          
          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border">
             <UserCheck className="w-3 h-3" />
             <span>
                Last updated by: <strong className="text-foreground">{reservation.agent || 'System'}</strong>
                {reservation.agent !== userFullName && (
                  <> • Editing as: <strong className="text-primary">{userFullName}</strong></>
                )}
             </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 w-full md:w-auto">
             <a href="/biz/reservations" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4">
                Cancel
             </a>
             <button
                type="submit"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-all transform active:scale-95 shadow-md"
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