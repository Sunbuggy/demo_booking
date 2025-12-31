'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function launchGroup(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('group_timings').upsert({ group_id: groupId, launched_at: new Date().toISOString() }, { onConflict: 'group_id' });
  if (error) return { error: error.message };
  revalidatePath('/biz');
  return { success: true };
}

export async function landGroup(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('group_timings').upsert({ group_id: groupId, landed_at: new Date().toISOString() }, { onConflict: 'group_id' });
  if (error) return { error: error.message };
  revalidatePath('/biz');
  return { success: true };
}

export async function updateGroupLaunchTime(groupId: string, time: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('group_timings').upsert({ group_id: groupId, launched_at: time }, { onConflict: 'group_id' });
  if (error) return { error: error.message };
  revalidatePath('/biz');
  return { success: true };
}

export async function unLaunchGroup(groupId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('group_timings').delete().eq('group_id', groupId);
  if (error) return { error: error.message };
  revalidatePath('/biz');
  return { success: true };
}