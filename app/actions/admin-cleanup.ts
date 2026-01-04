'use server';

import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js'; 
import { revalidatePath } from 'next/cache';

/**
 * 1. SEARCH EMPLOYEES
 */
export async function searchEmployees(query: string) {
  const supabase = await createClient();
  
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('users') 
    .select('id, full_name, stage_name, email') 
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,stage_name.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Search Error:', error);
    return [];
  }
  return data;
}

/**
 * 2. GET EMPLOYEE STATS
 */
export async function getEmployeeStats(userId: string) {
  const supabase = await createClient();

  const [shifts, punches, fleet] = await Promise.all([
    supabase.from('employee_schedules').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('time_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId), 
    supabase.from('daily_shuttle_manifest').select('id', { count: 'exact', head: true }).eq('driver_id', userId),
  ]);

  return {
    shifts: shifts.count || 0,
    punches: punches.count || 0,
    fleet: fleet.count || 0,
  };
}

/**
 * 3. MERGE & DELETE EXECUTION
 */
export async function mergeAndRemoveUser(sourceId: string, targetId: string) {
  // A. AUTHENTICATION CHECK
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: currentUserProfile } = await supabaseAuth.from('users').select('user_level').eq('id', user.id).single();
  if (!currentUserProfile || currentUserProfile.user_level < 800) {
    throw new Error("Restricted: Only Admins can merge accounts.");
  }

  // B. INITIALIZE SUPER ADMIN CLIENT
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // C. PERFORM MERGE 
  
  // 1. Move Schedules
  const { error: err1 } = await supabaseAdmin
    .from('employee_schedules')
    .update({ user_id: targetId })
    .eq('user_id', sourceId);
  if (err1) throw new Error(`Move Schedules Error: ${err1.message}`);

  // 2. Move Punches 
  const { error: err2 } = await supabaseAdmin
    .from('time_entries') 
    .update({ user_id: targetId })
    .eq('user_id', sourceId);
  if (err2) throw new Error(`Move Punches Error: ${err2.message}`);

  // 3. Move Fleet Records (SMART MERGE)
  const fleetTable = 'daily_shuttle_manifest';
  
  // 3a. Fetch manifest records for BOTH users to compare
  const { data: sourceManifests, error: fetchErr1 } = await supabaseAdmin
    .from(fleetTable).select('*').eq('driver_id', sourceId);
  
  const { data: targetManifests, error: fetchErr2 } = await supabaseAdmin
    .from(fleetTable).select('*').eq('driver_id', targetId);

  if (fetchErr1 || fetchErr2) throw new Error("Failed to fetch fleet records for comparison.");

  // 3b. Iterate through Source records to handle them one by one
  for (const sourceRecord of (sourceManifests || [])) {
    
    // Check if Target User already has a manifest for this EXACT day
    // (Assuming 'date' or 'schedule_date' is the distinguishing field. Update 'date' below if your column name is different)
    const matchingTarget = targetManifests?.find(t => t.date === sourceRecord.date);

    if (matchingTarget) {
      // COLLISION DETECTED!
      // Source User has a manifest on Jan 4, and Target User ALSO has one on Jan 4.
      // We must move the *assignments* (passengers) from Source -> Target, then delete Source.
      
      console.log(`Merging manifest ${sourceRecord.id} into ${matchingTarget.id}`);

      // Move Reservation Assignments (Children)
      const { error: moveChildrenErr } = await supabaseAdmin
        .from('reservation_assignments')
        .update({ manifest_id: matchingTarget.id })
        .eq('manifest_id', sourceRecord.id);
        
      if (moveChildrenErr) throw new Error(`Failed to move assignments: ${moveChildrenErr.message}`);

      // Now safe to delete the empty Source Manifest
      const { error: delManifestErr } = await supabaseAdmin
        .from(fleetTable)
        .delete()
        .eq('id', sourceRecord.id);
        
      if (delManifestErr) throw new Error(`Failed to delete merged manifest: ${delManifestErr.message}`);

    } else {
      // NO COLLISION
      // Target user was NOT working this day. We can simply assign this manifest to them.
      const { error: moveManifestErr } = await supabaseAdmin
        .from(fleetTable)
        .update({ driver_id: targetId })
        .eq('id', sourceRecord.id);
        
      if (moveManifestErr) throw new Error(`Failed to move manifest: ${moveManifestErr.message}`);
    }
  }

  // D. DELETE DUPLICATE PROFILES
  const { error: delError } = await supabaseAdmin.from('users').delete().eq('id', sourceId);
  if (delError) throw new Error(`Delete Profile Error: ${delError.message}`);

  const { error: authDelError } = await supabaseAdmin.auth.admin.deleteUser(sourceId);
  if (authDelError) console.warn("Auth delete warning:", authDelError.message);

  revalidatePath('/biz/admin/hr/user-cleanup');
  return { success: true };
}