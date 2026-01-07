import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js'; 

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount, holder, booking, payment_token } = body;

    // 1. Identify Creator (Staff/Online)
    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    
    let creatorName = 'Online'; 
    if (user) {
      // ... (Same staff identification logic as before) ...
    } else {
        creatorName = holder.booked_by === 'Guest' ? 'Guest' : 'Online';
    }

    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // === 2. DATABASE: INSERT "PENDING" BOOKING FIRST ===
    // We insert first so we can generate the reservation_id
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
        total_amount: Math.round(total_amount * 100), 
        status: 'pending_payment', // <--- Mark as Pending initially
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // === 3. PROCESS PAYMENT (Using the new Reservation ID) ===
    let transactionId = null;
    let authCode = null;
    let paymentSuccess = false;

    if (payment_token) {
        // --- DATA SENT TO NMI ---
        const nmiParams = {
            security_key: NMI_SECURITY_KEY,
            type: 'sale',
            amount: Number(total_amount).toFixed(2),
            payment_token: payment_token,
            
            // BILLING INFO (Used for AVS checks)
            first_name: holder.firstName,
            last_name: holder.lastName,
            email: holder.email,
            phone: holder.phone,
            
            // ORDER INFO
            // This sets the Order ID in NMI to your actual Reservation ID (e.g. 100050000)
            orderid: bookingRec.reservation_id.toString(), 
            order_description: `Pismo Reservation #${bookingRec.reservation_id} - ${booking.date}`,
            
            // OPTIONAL: If you collect address in your form, add it here:
            // address1: holder.address,
            // city: holder.city,
            // state: holder.state, 
            // zip: holder.zip 
        };

        const nmiBody = new URLSearchParams(nmiParams);

        console.log(`[Payment] Charging Reservation #${bookingRec.reservation_id}...`);

        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', {
            method: 'POST',
            body: nmiBody
        });

        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);
        const response = params.get('response'); 

        if (response === '1') {
            paymentSuccess = true;
            transactionId = params.get('transactionid');
            authCode = params.get('authcode');
        } else {
            // === PAYMENT FAILED ===
            // 1. Delete the pending booking so it doesn't clutter the DB
            await adminSupabase.from('pismo_bookings').delete().eq('id', bookingRec.id);
            
            // 2. Return error to user
            const responseText = params.get('responsetext');
            return NextResponse.json({ success: false, error: `Payment Declined: ${responseText}` }, { status: 400 });
        }
    } else {
        // Pay Later mode
        paymentSuccess = true; 
    }

    // === 4. FINALIZE BOOKING (If Payment Success) ===
    if (paymentSuccess) {
        // A. Update Status to Confirmed
        await adminSupabase
            .from('pismo_bookings')
            .update({ 
                status: 'confirmed',
                transaction_id: transactionId,
                // auth_code: authCode // Uncomment if you add this column
            })
            .eq('id', bookingRec.id);

        // B. Insert Line Items (Vehicles)
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
            await adminSupabase.from('pismo_booking_items').insert(itemsToInsert);
        }

        // C. Create Log
        const logAction = payment_token 
            ? `Created & Paid (TransID: ${transactionId}). Total: $${total_amount.toFixed(2)}`
            : `Created (Pay Later). Total: $${total_amount.toFixed(2)}`;

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
    }

    return NextResponse.json({ success: false, error: "Unknown error" }, { status: 500 });

  } catch (error: any) {
    console.error("API Error:", error);
    // Cleanup if crash happens after insert
    // (Optional: You could delete the bookingRec here if it exists)
    return NextResponse.json({ success: false, error: 'Server Error: ' + error.message }, { status: 500 });
  }
}