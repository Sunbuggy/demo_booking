/**
 * @file lib/smartwaiver.ts
 * @description Utility to interact with Smartwaiver API v4
 */

const SW_API_URL = 'https://api.smartwaiver.com/v4';
const SW_API_KEY = process.env.SMARTWAIVER_API_KEY;

if (!SW_API_KEY) {
  console.warn("Missing SMARTWAIVER_API_KEY environment variable");
}

const headers = {
  'Content-Type': 'application/json',
  'sw-api-key': SW_API_KEY || '',
};

/**
 * Searches for a verified waiver by email.
 * Smartwaiver uses a 2-step search: Request Search -> Get GUID -> Fetch Results.
 */
export async function findWaiverByEmail(email: string) {
  try {
    // 1. Request the Search
    const searchUrl = `${SW_API_URL}/search?email=${encodeURIComponent(email)}&verified=true`;
    console.log(`[Smartwaiver] Calling: ${searchUrl}`);

    const searchRes = await fetch(searchUrl, { 
      headers, 
      method: 'GET', 
      cache: 'no-store' 
    });

    if (!searchRes.ok) {
      const errorBody = await searchRes.text();
      console.error(`[Smartwaiver] Init Search Failed (${searchRes.status}):`, errorBody);
      throw new Error(`SW Search Init Error: ${searchRes.statusText}`);
    }
    
    const searchData = await searchRes.json();
    const guid = searchData.search?.guid;

    if (!guid) {
        return null; // Should not happen based on docs, but safe to check
    }

    // 2. Fetch the Results using the GUID
    const resultsUrl = `${SW_API_URL}/search/${guid}/results?page=0`;
    const resultsRes = await fetch(resultsUrl, { 
      headers, 
      method: 'GET', 
      cache: 'no-store' 
    });

    // === THE FIX ===
    // Smartwaiver returns 402 if there are 0 results. 
    // We must catch this specific case and return null instead of throwing an error.
    if (resultsRes.status === 402) {
        console.log(`[Smartwaiver] No signed waivers found for ${email} (API returned 402 for empty result set)`);
        return null;
    }

    if (!resultsRes.ok) {
        const errorBody = await resultsRes.text();
        console.error(`[Smartwaiver] Results Failed (${resultsRes.status}):`, errorBody);
        throw new Error(`SW Result Error: ${resultsRes.statusText}`);
    }

    const resultsData = await resultsRes.json();
    const waivers = resultsData.search_results;

    if (!waivers || waivers.length === 0) return null;

    // Return the most recent waiver
    return waivers[0]; 

  } catch (error) {
    console.error("Smartwaiver Integration Error:", error);
    return null;
  }
}

/**
 * Retrieves the specific photo (Selfie) from a waiver.
 */
export async function getWaiverPhotos(waiverId: string) {
  try {
    const res = await fetch(`${SW_API_URL}/waivers/${waiverId}/photos`, {
      headers,
      method: 'GET',
      next: { revalidate: 3600 } 
    });

    if (!res.ok) return null;
    
    const data = await res.json();
    const photos = data.photos?.photos || [];
    
    if (photos.length > 0) {
      return photos[0].photo; 
    }
    return null;
  } catch (error) {
    console.error("Smartwaiver Photo Fetch Failed:", error);
    return null;
  }
}