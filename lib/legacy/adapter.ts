import { createClient } from '@/utils/supabase/server';
import { mysqlClient } from '@/lib/legacy/mysql'; // Your legacy DB connection
import { v4 as uuidv4 } from 'uuid';

// 1. Define the Legacy Shape (What the old DB looks like)
interface LegacyReservation {
  res_id: number;
  customer_name: string;
  pax_count: number;
  tour_date: string;
  vehicle_type: string; // e.g., "Buggy 2 Seater"
  status: string;
}

/**
 * MIGRATION FUNCTION:
 * Takes a Legacy Reservation and explodes it into the 3-Layer Schema
 */
export async function migrateReservationToSupabase(legacyRes: LegacyReservation) {
  const supabase = createClient();

  // A. Create the User (Identity)
  // We use a "Shadow Account" strategy if they don't exist yet
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', legacyRes.email) // Assuming email exists
    .single();

  let userId = user?.id;
  if (!userId) {
    // Logic to create a placeholder user...
    userId = await createPlaceholderUser(legacyRes.customer_name); 
  }

  // B. Layer 1: The Booking Header
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      location_id: '...vegas-uuid...', 
      customer_id: userId,
      start_at: new Date(legacyRes.tour_date).toISOString(),
      legacy_id: legacyRes.res_id, // <--- THE BRIDGE
      status: mapLegacyStatus(legacyRes.status),
      operational_metadata: {
        migrated_from_legacy: true,
        original_vehicle_string: legacyRes.vehicle_type
      }
    })
    .select()
    .single();

  if (error) throw error;

  // C. Layer 2: The Participants (Explode the PAX count)
  const participants = [];
  
  // 1. The Renter
  participants.push({
    booking_id: booking.id,
    user_id: userId,
    role: 'PRIMARY_RENTER',
    check_in_status: 'EXPECTED'
  });

  // 2. The Guests (Pax Count - 1)
  for (let i = 0; i < legacyRes.pax_count - 1; i++) {
    participants.push({
      booking_id: booking.id,
      role: 'PASSENGER',
      check_in_status: 'EXPECTED',
      temp_name: `Guest ${i + 1} of ${legacyRes.customer_name}` // Placeholder name
    });
  }

  await supabase.from('booking_participants').insert(participants);

  // D. Layer 3: The Assets (Map "Buggy 2 Seater" to Resource Types)
  // This requires a mapping function
  const resourceType = mapLegacyVehicleToResourceType(legacyRes.vehicle_type);
  
  await supabase.from('booking_resources').insert({
    booking_id: booking.id,
    resource_type_id: resourceType
  });

  return booking.id;
}