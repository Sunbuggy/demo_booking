// app/actions/fetch-hr-config.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function fetchHRConfiguration() {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('locations')
    .select(`
      id, 
      name, 
      departments (
        id, 
        name, 
        positions (
          id, 
          title
        )
      )
    `)
    .order('sort_order', { ascending: true });

  if (!data) return [];

  // Sort nested arrays (Supabase doesn't deeply sort easily)
  return data.map((loc: any) => ({
    ...loc,
    departments: (loc.departments || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((dept: any) => ({
        ...dept,
        positions: (dept.positions || [])
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      }))
  }));
}