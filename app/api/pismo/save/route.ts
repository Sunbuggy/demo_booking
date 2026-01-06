import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // <--- Server Client

// Admin client for writes
import { createClient as createAdminClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount, holder, booking } = body;

    // 1. Identify the Creator (Staff or Customer)
    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    
    let creatorName = 'Online'; // Default for public bookings

    if (user) {
      // If logged in, fetch profile
      const { data: profile } = await cookieClient
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.full_name) {
        creatorName = profile.full_name;
      } else {
        creatorName = 'Staff';
      }
    } else {
        // If not logged in, trust the holder if it says 'Guest', otherwise 'Online'
        creatorName = holder.booked_by === 'Guest' ? 'Guest' : 'Online';
    }

    // 2. Init Admin Client
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Insert Booking Header
    const { data: bookingRec, error: bookingErr } = await adminSupabase
      .from('pismo_bookings')
      .insert({
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        booked_by: creatorName, // <--- Enforced by Server
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        duration_hours: booking.duration,
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        total_amount: Math.round(total_amount * 100), 
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // 4. Insert Line Items
    const itemsToInsert = [];
    const vehicles = booking.vehicles || {};

    for (const [catId, itemData] of Object.entries(vehicles)) {
      const item = itemData as any;
      if (item.qty > 0) {
        itemsToInsert.push({
          pismo_booking_id: bookingRec.id,
          pricing_category_id: catId,
          vehicle_name_snapshot: item.name || 'Unknown',
          quantity: item.qty,
          has_waiver: item.waiver,
          price_at_booking: item.price || 0
        });
      }
    }

    if (itemsToInsert.length > 0) {
      const { error: itemsErr } = await adminSupabase
        .from('pismo_booking_items')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;
    }

    // 5. Create Initial Log Entry
    await adminSupabase.from('pismo_booking_logs').insert({
        booking_id: bookingRec.id,
        editor_name: creatorName,
        action_description: `Created new reservation. Total: $${total_amount.toFixed(2)}`
    });

    return NextResponse.json({ 
        success: true, 
        booking_id: bookingRec.id, 
        reservation_id: bookingRec.reservation_id 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}