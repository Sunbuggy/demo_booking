import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import PismoReservationEditForm from './editFormPismo';

// --- Server Data Fetcher ---
async function getReservation(reservationId: string) {
  const supabase = await createClient();
  
  // Fetch header
  const { data: booking, error } = await supabase
    .from('pismo_bookings')
    .select(`
      *,
      pismo_booking_items (*)
    `)
    .eq('reservation_id', reservationId)
    .single();

  if (error || !booking) return null;
  return booking;
}

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getReservation(id);

  if (!booking) notFound();

  return (
    <div className="bg-gray-900 min-h-screen">
      <PismoReservationEditForm initialData={booking} />
    </div>
  );
}