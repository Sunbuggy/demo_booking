import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // <--- Use Server Client for Cookies

// Admin client for writing data (bypassing RLS)
import { createClient as createAdminClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, total_amount, holder, booking, note } = body;

    // 1. Identify the Current User (The Editor)
    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    
    // Default to 'System' or 'Online Customer' if no one is logged in
    let editorName = 'Online Customer'; 

    if (user) {
      // If a user is logged in, look up their real name from the 'users' table
      const { data: profile } = await cookieClient
        .from('users') // Matches your schema
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.full_name) {
        editorName = profile.full_name;
      } else {
        editorName = profile?.email || 'Staff Member';
      }
    }

    // 2. Initialize Admin Client for Database Writes
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Update Booking Header
    // We do NOT update 'booked_by' here, because the original creator hasn't changed.
    const updatePayload: any = {
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
    };

    // Sync Note to main column
    if (note && note.trim().length > 0) {
        updatePayload.notes = note; 
    }

    const { error: headerErr } = await adminSupabase
      .from('pismo_bookings')
      .update(updatePayload)
      .eq('id', booking_id);

    if (headerErr) throw headerErr;

    // 4. Update Line Items (Split Logic)
    const { data: existingItems } = await adminSupabase
        .from('pismo_booking_items')
        .select('id, pricing_category_id')
        .eq('pismo_booking_id', booking_id);

    const vehicles = booking.vehicles || {};
    const itemsToUpdate: any[] = [];
    const itemsToInsert: any[] = [];
    const processedCategoryIds = new Set();
    
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
            itemsToUpdate.push({ ...payload, id: existingRow.id });
        } else {
            itemsToInsert.push(payload);
        }
        processedCategoryIds.add(catId);
      }
    }

    const idsToDelete = existingItems
        ?.filter(r => !processedCategoryIds.has(r.pricing_category_id))
        .map(r => r.id) || [];

    if (idsToDelete.length > 0) await adminSupabase.from('pismo_booking_items').delete().in('id', idsToDelete);
    if (itemsToUpdate.length > 0) await adminSupabase.from('pismo_booking_items').upsert(itemsToUpdate);
    if (itemsToInsert.length > 0) await adminSupabase.from('pismo_booking_items').insert(itemsToInsert);

    // 5. INSERT NOTE HISTORY
    if (note && note.trim().length > 0) {
        await adminSupabase.from('pismo_booking_notes').insert({
            booking_id: booking_id,
            author_name: editorName, // <--- Uses the actual logged-in user name
            note_text: note
        });
    }

    // 6. INSERT AUDIT LOG
    await adminSupabase.from('pismo_booking_logs').insert({
        booking_id: booking_id,
        editor_name: editorName, // <--- Uses the actual logged-in user name
        action_description: `Updated reservation. Total: $${total_amount.toFixed(2)}`
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}