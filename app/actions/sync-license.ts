'use server';

import { createClient } from '@/utils/supabase/server';
import { findWaiverByEmail, getWaiverPhotos } from '@/lib/smartwaiver';
import { revalidatePath } from 'next/cache';

export async function syncFunLicense() {
  const supabase = await createClient();
  
  // 1. Get Current User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { success: false, message: "User not authenticated" };
  }

  try {
    // 2. Search Smartwaiver for this email
    console.log(`Searching Smartwaiver for: ${user.email}`);
    const waiver = await findWaiverByEmail(user.email);

    if (!waiver) {
      return { success: false, message: "No signed waiver found. Please sign first." };
    }

    // 3. If waiver found, get the photo (The "Fun License" Image)
    const photoBase64 = await getWaiverPhotos(waiver.waiverId);
    
    // 4. Construct the License Data
    const licenseData = {
      fun_license_id: waiver.waiverId,
      license_signed_at: waiver.createdOn, // or dateSigned
      // Note: If photoBase64 is huge, you might want to upload it to Supabase Storage 
      // instead of saving base64 string directly to the DB. 
      // For now, we save raw string if it fits, or handle upload logic here.
      license_photo_url: photoBase64 
        ? `data:image/jpeg;base64,${photoBase64}` 
        : null
    };

    // 5. Update Supabase
    const { error } = await supabase
      .from('users')
      .update(licenseData)
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/'); // Refresh UI to show Green Ring
    return { success: true, message: "Fun License Synced!" };

  } catch (error: any) {
    console.error("Sync Error:", error);
    return { success: false, message: error.message };
  }
}