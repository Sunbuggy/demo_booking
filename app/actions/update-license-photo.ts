'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateLicensePhoto(photoBase64: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated" };

  try {
    // Save to DB
    // Note: For production scaling, you should upload this to Supabase Storage 
    // and save the URL. For now, we save the Data URI directly to match the logic.
    const { error } = await supabase
      .from('users')
      .update({ 
        license_photo_url: photoBase64,
        // Optional: Update signed_at if you want to refresh the timestamp
      })
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/'); 
    revalidatePath('/fun-license');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}