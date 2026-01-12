'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const SMARTWAIVER_API_KEY = process.env.SMARTWAIVER_API_KEY?.trim();
const API_URL = 'https://api.smartwaiver.com/v4';

export async function syncUserWaivers() {
  if (!SMARTWAIVER_API_KEY) {
    console.error("❌ CRITICAL: SMARTWAIVER_API_KEY is missing.");
    return { success: false, message: 'Server configuration error.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) return { success: false, message: 'Not authenticated' };

  try {
    console.log(`🔌 Connecting to Smartwaiver for: ${user.email}`);

    // --- STRATEGY: THE "SKELETON KEY" APPROACH ---
    // We send the key in ALL known formats.
    const headers = {
        // 1. Standard V4 Header
        'Smartwaiver-ApiKey': SMARTWAIVER_API_KEY,
        // 2. Alternative Header (sometimes used in older/newer SDKs)
        'sw-api-key': SMARTWAIVER_API_KEY, 
        // 3. Bearer Token (referenced in your Postman docs)
        'Authorization': `Bearer ${SMARTWAIVER_API_KEY}`,
        // 4. Standard Accept
        'Accept': 'application/json'
    };

    const searchResponse = await fetch(`${API_URL}/search?email=${encodeURIComponent(user.email)}`, {
      method: 'GET',
      headers: headers,
      cache: 'no-store'
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ Smartwaiver Search Failed: ${searchResponse.status}`);
      console.error(`Response: ${errorText}`);
      
      if (searchResponse.status === 401) {
          // If this fails, the Key itself might be "Pending" or invalid on their side.
          return { success: false, message: 'API Key Rejected by Provider' };
      }
      throw new Error(`Smartwaiver API Error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const guid = searchData.search?.guid;

    if (!guid || searchData.search?.count === 0) {
      console.log("✅ Smartwaiver connected. No waivers found.");
      return { success: true, count: 0 }; 
    }

    // --- STEP 2: GET RESULTS (Reuse Headers) ---
    const resultsResponse = await fetch(`${API_URL}/search/${guid}/results?page=0`, {
      method: 'GET',
      headers: headers, // Use the same working headers
      cache: 'no-store'
    });

    const resultsData = await resultsResponse.json();
    const waivers = resultsData.search_results || [];

    console.log(`📥 Found ${waivers.length} waivers. Syncing...`);

    let syncCount = 0;
    for (const waiver of waivers) {
      if (waiver.verified) { 
        const { error } = await supabase.from('customer_waivers').upsert({
          user_id: user.id,
          smartwaiver_waiver_id: waiver.waiverId,
          template_id: waiver.templateId,
          signed_at: new Date(waiver.createdOn).toISOString(), 
        }, { onConflict: 'user_id, smartwaiver_waiver_id' });

        if (!error) syncCount++;
      }
    }

    console.log(`✅ Synced ${syncCount} waivers.`);
    revalidatePath('/fun-license');
    return { success: true, count: syncCount };

  } catch (error) {
    console.error('🔥 Sync Exception:', error);
    return { success: false, message: 'Sync failed.' };
  }
}