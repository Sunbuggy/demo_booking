import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { syncUserWaivers } from '@/app/actions/smartwaiver-sync';
import { WAIVER_TEMPLATES } from '@/config/smartwaiver';
import FunLicenseCard from '@/components/fun-license/FunLicenseCard';
import SyncButton from '@/components/fun-license/SyncButton';
import { getPrivatePhotoUrl } from '@/lib/s3-server'; // <--- NEW IMPORT

export const dynamic = 'force-dynamic';

export default async function FunLicensePage() {
  const supabase = await createClient();
  
  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, photo_url, user_level, email')
    .eq('id', user.id)
    .single();

  // 3. Name Resolution Logic (The Waterfall)
  let displayName = "VALUED RENTER"; // Absolute worst-case fallback
  
  if (profile?.first_name && profile?.last_name) {
    // Best Case: We have their profile data
    displayName = `${profile.first_name} ${profile.last_name}`;
  } else if (user.user_metadata?.full_name) {
    // Fallback: Use the name from Google/Apple login
    displayName = user.user_metadata.full_name;
  } else if (profile?.email) {
    // Fallback: Use email handle if we have nothing else
    displayName = profile.email.split('@')[0];
  }

  // 4. Fetch Signed Waivers
  const { data: signedWaivers } = await supabase
    .from('customer_waivers')
    .select('template_id, signed_at')
    .eq('user_id', user.id);

  // 5. SECURE PHOTO HANDLING
  // The DB url is private (returns 401). We generate a temporary public signature here.
  const signedPhotoUrl = await getPrivatePhotoUrl(profile?.photo_url);

  // 6. Determine Status
  const hasPhoto = !!profile?.photo_url;
  // User has a waiver if the array exists and is not empty
  const hasWaiver = !!(signedWaivers && signedWaivers.length > 0);
  
  // 7. Map Waivers to Endorsements
  const endorsements = Object.values(WAIVER_TEMPLATES).map(tpl => ({
    name: tpl.locationName,
    active: signedWaivers?.some(w => w.template_id === tpl.templateId) || false
  }));

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center pt-8 px-4 pb-20">
      
      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black italic text-[#FFEC00] uppercase tracking-tighter transform -skew-x-12">
          SunBuggy
        </h1>
        <p className="text-white text-xs font-bold tracking-[0.3em] uppercase opacity-80">
          Official Fun License
        </p>
      </div>

      {/* THE CARD */}
      <FunLicenseCard 
        user={{
          name: displayName, // Now guaranteed to be the best available name
          id: user.id.slice(0, 8).toUpperCase(),
          photoUrl: signedPhotoUrl, // <--- PASS THE SIGNED URL, NOT THE RAW ONE
          level: profile?.user_level || 100
        }}
        endorsements={endorsements}
        status={{ hasPhoto, hasWaiver }}
      />

      {/* SYNC FOOTER */}
      <div className="mt-8 w-full max-w-sm flex items-center justify-between border-t border-zinc-800 pt-4">
         <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
           Last Synced: Just now
         </span>
         <form action={syncUserWaivers}>
            <SyncButton /> 
         </form>
      </div>
    </div>
  );
}