// app/actions/user-actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export interface DriverOption {
  id: string;
  full_name: string;
  stage_name?: string;
  department?: string;
  location?: string;
  // New props for Avatar Status
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export async function getVegasShuttleDrivers(): Promise<DriverOption[]> {
  const supabase = await createClient();

  // Updated query to fetch contact info
  const { data, error } = await supabase
    .from('users') 
    .select('id, full_name, stage_name, department, location, phone, email, avatar_url')
    .ilike('department', '%shuttle%') 
    .ilike('location', '%vegas%')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching shuttle drivers:', error);
    return [];
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    full_name: u.stage_name || u.full_name, // Prefer Stage Name
    stage_name: u.stage_name,
    department: u.department,
    location: u.location,
    phone: u.phone,
    email: u.email,
    avatar_url: u.avatar_url
  }));
}