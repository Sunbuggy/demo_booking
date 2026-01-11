import { createClient } from '@/utils/supabase/server';
import { getUser, getUserDetails } from '@/utils/supabase/queries';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const supabase = await createClient();
  
  // 1. Fetch Data
  const userDetails = await getUserDetails(supabase); 
  const usr = await getUser(supabase);

  // 2. Render Client Component
  // CRITICAL FIX: We removed the <nav className="fixed..."> wrapper here.
  // We return ONLY the Client component, which now handles its own positioning, 
  // background, and animation.
  return (
    <NavbarClient
      user={userDetails ? userDetails[0] : null}
      usr={usr}
    />
  );
}