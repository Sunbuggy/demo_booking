import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Admin Client to bypass RLS for inserts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount, holder, booking } = body;

    // 1. Initialize Supabase Admin
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Saving Booking for:", holder.firstName, holder.lastName);

    // 2. Insert Booking Header (pismo_bookings)
    const { data: bookingRec, error: bookingErr } = await supabase
      .from('pismo_bookings')
      .insert({
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        booked_by: holder.booked_by || 'Guest',
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        duration_hours: booking.duration,
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        total_amount: total_amount, // Matches schema 'total_amount' (number)
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingErr) {
      console.error("Booking Table Error:", bookingErr);
      return NextResponse.json({ success: false, error: bookingErr.message }, { status: 500 });
    }

    // 3. Prepare Line Items (pismo_booking_items)
    const itemsToInsert = [];
    const vehicles = booking.vehicles || {};

    for (const [catId, itemData] of Object.entries(vehicles)) {
      const item = itemData as any;
      if (item.qty > 0) {
        itemsToInsert.push({
          pismo_booking_id: bookingRec.id, // Matches schema 'pismo_booking_id'
          pricing_category_id: catId,
          vehicle_name_snapshot: item.name || 'Unknown',
          quantity: item.qty,
          has_waiver: item.waiver,
          price_at_booking: item.price || 0
        });
      }
    }

    // 4. Insert Line Items
    if (itemsToInsert.length > 0) {
      const { error: itemsErr } = await supabase
        .from('pismo_booking_items')
        .insert(itemsToInsert);

      if (itemsErr) {
        console.error("Items Table Error:", itemsErr);
        // Note: Header was created, but items failed. 
        // In a real app, you might delete the header here to cleanup.
        return NextResponse.json({ success: false, error: itemsErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, booking_id: bookingRec.id });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}