'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 1. Launch a Group (Start Timer)
 */
export async function launchGroup(groupId: string) {
  const supabase = await createClient();
  const launchedAt = new Date().toISOString();

  const { error } = await supabase
    .from('group_timings')
    .upsert(
      { group_id: groupId, launched_at: launchedAt },
      { onConflict: 'group_id' }
    );

  if (error) return { error: error.message };
  revalidatePath('/biz/vegas');
  return { success: true };
}

/**
 * 2. Land a Group (Stop Timer)
 * [FIX] Updated to accept an optional timestamp for manual corrections.
 */
export async function landGroup(groupId: string, landedAtOverride?: string) {
  const supabase = await createClient();
  
  // Use the override if provided, otherwise default to NOW
  const landedAt = landedAtOverride || new Date().toISOString();

  const { error } = await supabase
    .from('group_timings')
    .update({ landed_at: landedAt })
    .eq('group_id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/biz/vegas');
  return { success: true };
}

/**
 * 3. Update Launch Time (Correction)
 */
export async function updateGroupLaunchTime(groupId: string, newLaunchTime: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('group_timings')
    .update({ launched_at: newLaunchTime })
    .eq('group_id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/biz/vegas');
  return { success: true };
}

/**
 * 4. Reset / Un-Launch (Delete Row)
 */
export async function unLaunchGroup(groupId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('group_timings')
    .delete()
    .eq('group_id', groupId);

  if (error) return { error: error.message };
  revalidatePath('/biz/vegas');
  return { success: true };
}