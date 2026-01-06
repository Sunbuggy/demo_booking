import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Use Server Client for reading Cookies
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Use Admin Client for Database Writes

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount, holder, booking, payment_token } = body;

    // === 1. Identify the Creator (Staff or Customer) ===
    // We check the cookie to see if a staff member is logged in.
    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    
    let creatorName = 'Online'; // Default for public bookings

    if (user) {
      // If logged in, fetch profile to get real name
      const { data: profile } = await cookieClient
        .from('users') // Checks your users table
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.full_name) {
        creatorName = profile.full_name;
      } else if (profile && profile.email) {
        creatorName = profile.email; // Fallback to email
      } else {
        creatorName = 'Staff Member';
      }
    } else {
        // If not logged in, trust the frontend ONLY if it says 'Guest', otherwise force 'Online'
        // This prevents guests from forcing 'Staff' as their name
        creatorName = holder.booked_by === 'Guest' ? 'Guest' : 'Online';
    }

    // === 2. PROCESS PAYMENT (If Token Exists) ===
    let transactionId: string | null = null;
    let authCode: string | null = null;

    if (payment_token) {
        // Prepare NMI Payload
        const nmiBody = new URLSearchParams({
            security_key: NMI_SECURITY_KEY,
            type: 'sale', // Immediate Charge
            amount: Number(total_amount).toFixed(2),
            payment_token: payment_token,
            first_name: holder.firstName,
            last_name: holder.lastName,
            email: holder.email,
            phone: holder.phone,
            order_description: `Pismo Reservation for ${booking.date} at ${booking.startTime}`
        });

        console.log(`[Payment] Processing charge for $${total_amount.toFixed(2)}...`);

        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', {
            method: 'POST',
            body: nmiBody
        });

        const nmiText = await nmiRes.text();
        
        // Parse NMI Response (Query String Format)
        const params = new URLSearchParams(nmiText);
        const response = params.get('response'); // "1" = Success, "2" = Decline, "3" = Error
        const responseText = params.get('responsetext');

        if (response !== '1') {
            console.error(`[Payment] Failed: ${responseText}`);
            return NextResponse.json({ success: false, error: `Payment Failed: ${responseText}` }, { status: 400 });
        }

        // Payment Successful
        transactionId = params.get('transactionid');
        authCode = params.get('authcode');
        console.log(`[Payment] Success! TransID: ${transactionId}`);
    }

    // === 3. DATABASE SAVING ===
    // Initialize Admin Client (Bypasses RLS for writing)
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // A. Insert Booking Header
    const { data: bookingRec, error: bookingErr } = await adminSupabase
      .from('pismo_bookings')
      .insert({
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        booked_by: creatorName,
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        duration_hours: booking.duration,
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        // Store money in Cents to avoid floating point math issues
        total_amount: Math.round(total_amount * 100), 
        status: 'confirmed',
        // Save Payment Details
        transaction_id: transactionId,
        // Note: Ensure your DB table has an 'auth_code' column if you want to save this
        // auth_code: authCode 
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // B. Insert Line Items
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

    // C. Create Initial Log Entry
    const logAction = payment_token 
        ? `Created reservation & charged card (TransID: ${transactionId}). Total: $${total_amount.toFixed(2)}`
        : `Created reservation (Pay Later). Total: $${total_amount.toFixed(2)}`;

    await adminSupabase.from('pismo_booking_logs').insert({
        booking_id: bookingRec.id,
        editor_name: creatorName,
        action_description: logAction
    });

    return NextResponse.json({ 
        success: true, 
        booking_id: bookingRec.id, 
        reservation_id: bookingRec.reservation_id 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error: ' + error.message }, { status: 500 });
  }
}