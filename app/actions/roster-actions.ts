'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ActionSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['approved', 'denied']),
  adminNote: z.string().optional(),
});

export async function processTimeOffRequest(formData: FormData) {
  const supabase = await createClient();

  // 1. Auth Check (Security Level 500+)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  // Note: Add your specific Level 500+ check here (e.g., getUserProfile)

  // 2. Parse Data
  const rawData = {
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    adminNote: formData.get('adminNote'),
  };

  const validated = ActionSchema.safeParse(rawData);
  if (!validated.success) return { error: 'Invalid data' };

  const { requestId, status, adminNote } = validated.data;

  // 3. Update DB
  const { error } = await supabase
    .from('time_off_requests')
    .update({ 
      status: status,
      manager_note: adminNote || (status === 'approved' ? 'Quick approved via Roster' : 'Denied via Roster'),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (error) return { error: error.message };

  // 4. Refresh Roster immediately
  revalidatePath('/biz/schedule'); 
  return { success: true };
}