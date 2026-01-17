/**
 * @file app/(biz)/biz/vegas/reservations/actions.ts
 * @description Server Actions for creating and updating reservations.
 * UPDATED: Now automatically upgrades "Prospects" (Level 50) to "Customers" (Level 100) upon booking.
 */
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createReservation, updateFullReservation } from '@/utils/old_db/actions';
import { createClient } from '@/utils/supabase/server'; // Standard client for Auth context
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Admin client for RLS bypass
import { getUserDetails } from '@/utils/supabase/queries';

// 1. Define Schema for Strict Validation
const ReservationSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  sch_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  sch_time: z.string().optional(),
  location: z.string().default('Nellis60'),
  occasion: z.string().optional(),
  ppl_count: z.coerce.number().min(1),
  hotel: z.string().optional(),
  notes: z.string().optional(),
  total_cost: z.coerce.number().default(0),
  // Vehicle Counts
  QA: z.coerce.number().default(0),
  QB: z.coerce.number().default(0),
  QU: z.coerce.number().default(0),
  QL: z.coerce.number().default(0),
  SB1: z.coerce.number().default(0),
  SB2: z.coerce.number().default(0),
  SB4: z.coerce.number().default(0),
  SB5: z.coerce.number().default(0),
  SB6: z.coerce.number().default(0),
  twoSeat4wd: z.coerce.number().default(0),
  UZ2: z.coerce.number().default(0),
  UZ4: z.coerce.number().default(0),
  RWG: z.coerce.number().default(0),
  GoKartplus: z.coerce.number().default(0),
  GoKart: z.coerce.number().default(0),
});

export async function createReservationAction(formData: FormData) {
  // A. Standard Client to get the Staff Agent's name
  const supabase = await createClient();
  
  // 1. Get Current Agent Identity
  const userDetails = await getUserDetails(supabase);
  const agentName = userDetails?.[0]?.full_name || 'SunbuggyNet';

  // 2. Parse & Validate Form Data
  const rawData = Object.fromEntries(formData.entries());
  const validated = ReservationSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;

  // 3. Prepare Legacy Payload
  const reservationPayload = {
    ...data,
    sch_date: new Date(data.sch_date + 'T00:00:00'), 
    agent: agentName,
  };

  // 4. Write to Legacy MySQL
  const result = await createReservation(reservationPayload);

  if (!result.success) {
    return { error: `Database Error: ${result.error}` };
  }

  // ---------------------------------------------------------
  // 5. USER LEVEL UPGRADE (Prospect -> Customer)
  // ---------------------------------------------------------
  if (data.email) {
    try {
      // Use Admin Client to bypass RLS restrictions during the upgrade
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Check current level
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('id, user_level')
        .eq('email', data.email.toLowerCase().trim())
        .maybeSingle();

      // If user exists and is a Prospect (Level 50), bump to Customer (Level 100)
      if (userProfile && userProfile.user_level === 50) {
        await supabaseAdmin
          .from('users')
          .update({ user_level: 100 })
          .eq('id', userProfile.id);
        
        console.log(`✅ User ${data.email} upgraded: Level 50 -> 100`);
      }
    } catch (err) {
      // Non-blocking error: If this fails, the booking is still valid, 
      // so we just log it and proceed to redirect.
      console.error("⚠️ Failed to upgrade user level:", err);
    }
  }
  // ---------------------------------------------------------

  // 6. Redirect on Success
  redirect(`/biz/reservations/${result.reservationId}`);
}

export async function updateReservationAction(formData: FormData) {
  const supabase = await createClient();
  const userDetails = await getUserDetails(supabase);
  const agentName = userDetails?.[0]?.full_name || 'SunbuggyNet';

  const res_id = Number(formData.get('res_id'));
  const rawData = Object.fromEntries(formData.entries());
  const validated = ReservationSchema.safeParse(rawData);

  if (!validated.success) {
    console.error("Validation Errors", validated.error.flatten());
    throw new Error("Invalid Form Data");
  }

  const data = validated.data;
  
  const reservationPayload = {
    ...data,
    sch_date: new Date(data.sch_date + 'T00:00:00'),
    agent: agentName, // Update the agent to the last person who edited
  };

  const result = await updateFullReservation(res_id, reservationPayload);

  if (!result.success) {
    throw new Error(`Update Failed: ${result.error}`);
  }

  redirect(`/biz/reservations/${res_id}`);
}