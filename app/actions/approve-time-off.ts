'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Unified Time Off Approval
 * Supports optional Manager Notes.
 */
export async function approveTimeOffRequest(
  requestId: string, 
  status: 'approved' | 'denied',
  note?: string // <--- NEW: Optional Argument
) {
  const supabase = await createClient();

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const dbStatus = status.toLowerCase(); 
  
  // 2. Logic: If no note provided, use a polite default for the log, or null.
  // We use a fallback string just in case your DB column is set to NOT NULL.
  const finalNote = note && note.trim() !== '' 
    ? note 
    : (dbStatus === 'denied' ? 'Denied by Manager' : 'Approved by Manager');

  // 3. Update Database
  const { error } = await supabase
    .from('time_off_requests')
    .update({ 
      status: dbStatus, 
      manager_note: finalNote,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (error) {
    console.error('Time Off Action Error:', error);
    return { error: `Database Error: ${error.message}` };
  }

  // 4. Revalidate
  revalidatePath('/biz/schedule');
  revalidatePath('/biz/payroll');
  
  return { success: true };
}