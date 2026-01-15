import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js'; 
import { Resend } from 'resend'; 

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!; 

const resend = new Resend(RESEND_API_KEY);

// Helper: Calculate End Time from Start + Duration
const calculateEndTime = (start: string, duration: number) => {
    if (!start || !duration) return '';
    const match = start.match(/(\d+):(\d+) (\w+)/);
    if (!match) return '';

    let hours = parseInt(match[1]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    let endHour = (hours + duration);
    const displayPeriod = endHour >= 12 && endHour < 24 ? 'PM' : 'AM';
    if (endHour >= 24) endHour -= 24; 

    let displayHour = endHour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:00 ${displayPeriod}`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount, holder, booking, payment_token, payment_amount } = body;

    // --- 1. USER RESOLUTION ---
    let userId = null;
    let creatorName = 'Online';

    const cookieClient = await createClient();
    const { data: { user: loggedInUser } } = await cookieClient.auth.getUser();
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (loggedInUser) {
        userId = loggedInUser.id;
        const { data: profile } = await cookieClient.from('users').select('full_name').eq('id', userId).single();
        creatorName = profile?.full_name || 'Staff/User';
    } else {
        creatorName = 'Guest (Auto-Account)';
        const email = holder.email.toLowerCase().trim();
        const { data: { users } } = await adminSupabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email?.toLowerCase() === email);

        if (existingUser) {
            userId = existingUser.id;
        } else {
            const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
                type: 'invite',
                email: email,
                options: {
                    data: {
                        first_name: holder.firstName,
                        last_name: holder.lastName,
                        full_name: `${holder.firstName} ${holder.lastName}`,
                        user_level: 100
                    },
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password`
                }
            });

            if (!linkError) {
                userId = linkData.user?.id;
                if (linkData.properties?.action_link) {
                    await resend.emails.send({
                        from: 'SunBuggy <reservations@sunbuggy.com>',
                        to: email,
                        subject: 'Your SunBuggy Reservation & Account',
                        html: `
                          <div style="font-family: sans-serif; color: #333;">
                            <h1>Welcome to SunBuggy!</h1>
                            <p>We have confirmed your reservation for <strong>${booking.date}</strong>.</p>
                            <p>To view your booking details and sign waivers easily, please claim your account below:</p>
                            <a href="${linkData.properties.action_link}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                              Set Password & View Booking
                            </a>
                          </div>
                        `
                    });
                }
            }
        }
    }

    // --- 2. CALCULATE END TIME ---
    // Even if frontend sends it, we recalculate to be safe based on duration
    const calculatedEndTime = calculateEndTime(booking.startTime, Number(booking.duration));

    // --- 3. INSERT BOOKING ---
    const { data: bookingRec, error: bookingErr } = await adminSupabase
      .from('pismo_bookings')
      .insert({
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        user_id: userId, 
        
        adults: holder.adults || 1,
        minors: holder.minors || 0,
        booked_by: creatorName,
        
        booking_date: booking.date,
        start_time: booking.startTime,
        duration_hours: Number(booking.duration), // Save Duration
        end_time: calculatedEndTime, // Save Calculated End Time
        
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        total_amount: Math.round(total_amount * 100), 
        status: 'pending_payment', 
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // --- 4. PROCESS PAYMENT ---
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
        };

        const nmiBody = new URLSearchParams(nmiParams);
        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', { method: 'POST', body: nmiBody });
        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);

        if (params.get('response') === '1') {
            paymentSuccess = true;
            transactionId = params.get('transactionid');
        } else {
            await adminSupabase.from('pismo_bookings').delete().eq('id', bookingRec.id);
            return NextResponse.json({ success: false, error: `Payment Declined: ${params.get('responsetext')}` }, { status: 400 });
        }
    } else {
        paymentSuccess = true; 
    }

    // --- 5. FINALIZE ---
    if (paymentSuccess) {
        await adminSupabase
            .from('pismo_bookings')
            .update({ status: 'confirmed', transaction_id: transactionId })
            .eq('id', bookingRec.id);

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