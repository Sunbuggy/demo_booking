'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Type Definitions ---
type VehicleAssignmentMap = Record<string, number>;

// --- Server Actions ---

/**
 * Assigns specific vehicle counts from a reservation to a group.
 * Handles creating a new group if 'NEW' is passed, or updating an existing one.
 * * UPDATED FIX:
 * - Added a "Stale Group Check" to ensure the ID provided by the client actually exists in the DB.
 * - Prevents FK violations if the group was deleted in the background.
 */
export async function assignReservationToGroup(
  date: string,
  hour: string,
  reservationId: string,
  groupId: string | 'NEW',
  vehiclesToAssign: VehicleAssignmentMap,
  leadGuideId?: string,
  sweepGuideId?: string,
  newGroupName?: string
) {
  const supabase = await createClient();
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be logged in to manage groups.");

  let finalGroupId = groupId;

  // Sanitize Inputs
  const lead = leadGuideId && leadGuideId.trim() !== '' ? leadGuideId : null;
  const sweep = sweepGuideId && sweepGuideId.trim() !== '' ? sweepGuideId : null;

  try {
    // ---------------------------------------------------------
    // STEP 1: GROUP RESOLUTION & VALIDATION
    // ---------------------------------------------------------
    if (groupId === 'NEW') {
      // --- A) CREATE NEW GROUP ---
      if (!newGroupName) throw new Error("Group name is required when creating a new group.");

      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          group_name: newGroupName,
          group_date: date,     
          lead: lead,           
          sweep: sweep,         
          created_by: user.id
        })
        .select('id')
        .single();

      if (groupError) throw new Error(`Group creation failed: ${groupError.message}`);
      if (!newGroup) throw new Error("Group created but no ID returned.");
      
      finalGroupId = newGroup.id;

    } else {
      // --- B) VALIDATE EXISTING GROUP ---
      // CRITICAL FIX: Verify this group actually exists before we try to insert children.
      // This prevents the "Foreign Key Violation" if the group was deleted in the background.
      
      const { data: existingGroup, error: fetchError } = await supabase
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .single();

      if (fetchError || !existingGroup) {
        // If we can't find the group, we MUST stop here.
        throw new Error("This group no longer exists. Please refresh the page.");
      }

      finalGroupId = existingGroup.id;

      // Update guides if needed
      if (lead !== undefined || sweep !== undefined) {
         await supabase
           .from('groups')
           .update({ lead, sweep })
           .eq('id', finalGroupId);
      }
    }

    // ---------------------------------------------------------
    // STEP 2: CLEAR OLD ASSIGNMENTS
    // ---------------------------------------------------------
    // Clear previous vehicles for this reservation in this group
    const { error: deleteError } = await supabase
      .from('group_vehicles')
      .delete()
      .eq('group_id', finalGroupId)
      .eq('old_booking_id', reservationId);
      
    if (deleteError) throw new Error(`Failed to clear old assignments: ${deleteError.message}`);

    // ---------------------------------------------------------
    // STEP 3: INSERT NEW ASSIGNMENTS
    // ---------------------------------------------------------
    const assignmentsToInsert = Object.entries(vehiclesToAssign)
      .filter(([_, quantity]) => quantity > 0)
      .map(([vehicleName, quantity]) => ({
        group_id: finalGroupId,       // We now KNOW this ID is valid
        old_booking_id: reservationId,
        old_vehicle_name: vehicleName,
        quantity: quantity
      }));

    if (assignmentsToInsert.length > 0) {
      const { error: assignError } = await supabase
        .from('group_vehicles')
        .insert(assignmentsToInsert);
      
      if (assignError) throw new Error(`Assignment failed: ${assignError.message}`);
    } else {
      // ---------------------------------------------------------
      // EDGE CASE: GHOST GROUP CLEANUP
      // ---------------------------------------------------------
      // If we created a NEW group but added 0 vehicles, delete it.
      if (groupId === 'NEW') {
        await deleteGroup(finalGroupId);
      }
    }

    // ---------------------------------------------------------
    // STEP 4: REVALIDATE
    // ---------------------------------------------------------
    revalidatePath('/biz/vegas');
    revalidatePath(`/biz/vegas/${date}`);

  } catch (error: any) {
    console.error("assignReservationToGroup Error:", error);
    // Return the specific error message so the Toast can display "Group no longer exists"
    throw new Error(error.message || "An unexpected error occurred during assignment.");
  }
}

/**
 * Removes a reservation's vehicles from a group.
 * AUTOMATICALLY DELETES THE GROUP if it becomes empty.
 */
export async function removeReservationFromGroup(reservationId: string, groupId: string) {
  const supabase = await createClient();

  // 1. Remove the vehicles
  const { error } = await supabase
    .from('group_vehicles')
    .delete()
    .eq('old_booking_id', reservationId)
    .eq('group_id', groupId);
    
  if (error) throw new Error(`Failed to remove reservation: ${error.message}`);

  // 2. Check if group is now empty (Ghost Group Check)
  const { count, error: countError } = await supabase
    .from('group_vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  // 3. Delete group if empty
  if (!countError && count === 0) {
    await deleteGroup(groupId);
  }

  revalidatePath('/biz/vegas');
}

/**
 * Explicitly deletes a group and all its vehicle associations.
 */
export async function deleteGroup(groupId: string) {
  const supabase = await createClient();

  // Step A: Delete vehicle associations
  const { error: vehicleError } = await supabase
    .from('group_vehicles')
    .delete()
    .eq('group_id', groupId);

  if (vehicleError) throw new Error('Failed to clear group vehicles');

  // Step B: Delete the group itself
  const { error: groupError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (groupError) throw new Error('Failed to delete group');

  revalidatePath('/biz/vegas');
}