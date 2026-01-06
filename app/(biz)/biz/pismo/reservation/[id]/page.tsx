import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import PismoReservationEditForm from '../editFormPismo';

// --- Fetch Reservation ---
async function getReservation(reservationId: string) {
  const supabase = await createClient();
  
  // Added: pismo_booking_notes and pismo_booking_logs ordering
  const { data: booking, error } = await supabase
    .from('pismo_bookings')
    .select(`
      *,
      pismo_booking_items (*),
      pismo_booking_notes (*),
      pismo_booking_logs (*)
    `)
    .eq('reservation_id', reservationId)
    .single();

  if (error || !booking) return null;

  // Sort logs and notes manually if needed, or rely on DB order
  // It's safer to sort them here to ensure newest first
  if (booking.pismo_booking_notes) {
      booking.pismo_booking_notes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  if (booking.pismo_booking_logs) {
      booking.pismo_booking_logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return booking;
}

// --- Fetch Pricing Rules ---
async function getPricingRules() {
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from('pismo_pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return rules || [];
}

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [booking, pricingRules] = await Promise.all([
    getReservation(id),
    getPricingRules()
  ]);

  if (!booking) notFound();

  return (
    <div className="bg-gray-900 min-h-screen">
      <PismoReservationEditForm 
        initialData={booking} 
        pricingRules={pricingRules} 
      />
    </div>
  );
}