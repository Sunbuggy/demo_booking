import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import PismoReservationEditForm from '../editFormPismo';
// --- Helper: Fetch Reservation ---
async function getReservation(reservationId: string) {
  const supabase = await createClient();
  
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

// --- Helper: Fetch Pricing Rules ---
async function getPricingRules() {
  const supabase = await createClient();
  
  const { data: rules } = await supabase
    .from('pismo_pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true }); // Ensure consistent order

  return rules || [];
}

// --- Main Page Component ---
export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch both data sources in parallel for speed
  const [booking, pricingRules] = await Promise.all([
    getReservation(id),
    getPricingRules()
  ]);

  if (!booking) notFound();

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Pass both datasets to the client component */}
      <PismoReservationEditForm 
        initialData={booking} 
        pricingRules={pricingRules} 
      />
    </div>
  );
}