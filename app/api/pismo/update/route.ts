import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, total_amount, holder, booking } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Update Booking Header
    const { error: headerErr } = await supabase
      .from('pismo_bookings')
      .update({
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        duration_hours: booking.duration,
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        total_amount: Math.round(total_amount * 100),
      })
      .eq('id', booking_id);

    if (headerErr) throw headerErr;

    // 2. Fetch Existing Items (to compare)
    const { data: existingItems } = await supabase
        .from('pismo_booking_items')
        .select('id, pricing_category_id')
        .eq('pismo_booking_id', booking_id);

    const vehicles = booking.vehicles || {};
    const processedCategoryIds = new Set();
    
    // Arrays to split the work
    const itemsToUpdate: any[] = [];
    const itemsToInsert: any[] = [];

    // 3. Sort items into Updates vs Inserts
    for (const [catId, itemData] of Object.entries(vehicles)) {
      const item = itemData as any;
      
      if (item.qty > 0) {
        const existingRow = existingItems?.find(r => r.pricing_category_id === catId);
        
        const payload = {
            pismo_booking_id: booking_id,
            pricing_category_id: catId,
            vehicle_name_snapshot: item.name || 'Unknown',
            quantity: item.qty,
            has_waiver: item.waiver,
            price_at_booking: item.price || 0
        };

        if (existingRow) {
            // EXISTING ITEM: Add ID to payload -> goes to Update batch
            itemsToUpdate.push({ ...payload, id: existingRow.id });
        } else {
            // NEW ITEM: No ID in payload -> goes to Insert batch
            itemsToInsert.push(payload);
        }
        
        processedCategoryIds.add(catId);
      }
    }

    // 4. Execution Phase

    // A. Delete Removed Items (Items in DB that are no longer in the form)
    const idsToDelete = existingItems
        ?.filter(r => !processedCategoryIds.has(r.pricing_category_id))
        .map(r => r.id) || [];

    if (idsToDelete.length > 0) {
        await supabase.from('pismo_booking_items').delete().in('id', idsToDelete);
    }

    // B. Perform Updates (Safe because all these items HAVE an ID)
    if (itemsToUpdate.length > 0) {
        const { error: updateErr } = await supabase
            .from('pismo_booking_items')
            .upsert(itemsToUpdate);
        if (updateErr) throw updateErr;
    }

    // C. Perform Inserts (Safe because these items have NO ID key at all)
    // This forces Postgres to generate a new UUID for each row.
    if (itemsToInsert.length > 0) {
        const { error: insertErr } = await supabase
            .from('pismo_booking_items')
            .insert(itemsToInsert);
        if (insertErr) throw insertErr;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}