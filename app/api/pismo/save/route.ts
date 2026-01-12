import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js'; 

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount, holder, booking, payment_token, payment_amount } = body;

    // --- 1. USER RESOLUTION LOGIC ---
    let userId = null;
    let creatorName = 'Online';

    const cookieClient = await createClient();
    const { data: { user: loggedInUser } } = await cookieClient.auth.getUser();
    
    // Initialize Admin Client (Needed to create/search users)
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (loggedInUser) {
        // A. User is logged in -> Use their ID
        userId = loggedInUser.id;
        
        // Fetch profile name for logs
        const { data: profile } = await cookieClient
            .from('users').select('full_name').eq('id', userId).single();
        creatorName = profile?.full_name || 'Staff/User';

    } else {
        // B. Guest User -> Check if account exists or create one
        creatorName = 'Guest (Auto-Account)';
        const email = holder.email.toLowerCase().trim();

        // 1. Search for existing user by email
        // Note: listUsers is an admin function
        const { data: { users } } = await adminSupabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email?.toLowerCase() === email);

        if (existingUser) {
            console.log(`[Booking] Linking to existing user: ${existingUser.id}`);
            userId = existingUser.id;
        } else {
            console.log(`[Booking] Creating new account for: ${email}`);
            
            // 2. Create new user & Send Invite
            // inviteUserByEmail creates the user AND sends them a magic link to set a password
            const { data: newUser, error: createError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
                data: {
                    first_name: holder.firstName,
                    last_name: holder.lastName,
                    user_level: 100 // Default level
                }
                // redirectTo: 'https://your-site.com/profile' // Optional: redirect after they set password
            });

            if (createError) {
                console.error("Auto-Account Error:", createError);
                // Fallback: Proceed without linking user (don't block booking)
                userId = null; 
            } else {
                userId = newUser.user?.id;
            }
        }
    }

    // --- 2. INSERT BOOKING (With user_id) ---
    const { data: bookingRec, error: bookingErr } = await adminSupabase
      .from('pismo_bookings')
      .insert({
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        
        // LINK THE USER HERE
        user_id: userId, 
        
        adults: holder.adults || 1,
        minors: holder.minors || 0,
        booked_by: creatorName,
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        duration_hours: booking.duration,
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        total_amount: Math.round(total_amount * 100), 
        status: 'pending_payment', 
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // --- 3. PROCESS PAYMENT ---
    let transactionId = null;
    let paymentSuccess = false;

    if (payment_token) {
        const nmiParams = {
            security_key: NMI_SECURITY_KEY,
            type: 'sale',
            amount: Number(payment_amount).toFixed(2),
            payment_token: payment_token,
            orderid: bookingRec.reservation_id.toString(), 
            first_name: holder.firstName,
            last_name: holder.lastName,
            email: holder.email,
            phone: holder.phone,
        };

        const nmiBody = new URLSearchParams(nmiParams);
        console.log(`[Payment] Charging Reservation #${bookingRec.reservation_id}...`);

        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', { method: 'POST', body: nmiBody });
        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);

        if (params.get('response') === '1') {
            paymentSuccess = true;
            transactionId = params.get('transactionid');
        } else {
            // Payment Failed: Clean up and return error
            await adminSupabase.from('pismo_bookings').delete().eq('id', bookingRec.id);
            return NextResponse.json({ success: false, error: `Payment Declined: ${params.get('responsetext')}` }, { status: 400 });
        }
    } else {
        paymentSuccess = true; // Pay Later
    }

    // --- 4. FINALIZE ---
    if (paymentSuccess) {
        await adminSupabase
            .from('pismo_bookings')
            .update({ status: 'confirmed', transaction_id: transactionId })
            .eq('id', bookingRec.id);

        // Insert Items
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
        if (itemsToInsert.length > 0) await adminSupabase.from('pismo_booking_items').insert(itemsToInsert);

        // Log
        await adminSupabase.from('pismo_booking_logs').insert({
            booking_id: bookingRec.id,
            editor_name: creatorName,
            action_description: payment_token 
                ? `Created & Paid (TransID: ${transactionId}). Total: $${total_amount.toFixed(2)}`
                : `Created (Pay Later). Total: $${total_amount.toFixed(2)}`
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
    return NextResponse.json({ success: false, error: 'Server Error: ' + error.message }, { status: 500 });
  }
}