// app/biz/reports/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server';

export async function getLiveUnsettledByLocation(location: 'vegas' | 'pismo') {
  const supabase = await createClient();
  
  // Use local date format (YYYY-MM-DD) to avoid UTC "tomorrow" issues
  const now = new Date();
  const today = now.toLocaleDateString('en-CA'); // Outputs YYYY-MM-DD precisely

  try {
    const functionPath = `nmi-charges?location=${location}&start_date=${today}&end_date=${today}`;

    const { data, error } = await supabase.functions.invoke(functionPath, {
      method: 'GET',
    });

    // If Pismo fails, this returns error, but Vegas should proceed if valid
    if (error) {
      console.error(`Edge Function error for ${location}:`, error);
      return { success: false, error: "NMI Gateway Error" };
    }

    return {
      success: true,
      unsettledTotal: data.unsettledTotal || 0,
      holdsTotal: data.holdsTotal || 0
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}