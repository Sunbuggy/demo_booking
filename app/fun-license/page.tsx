import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { syncUserWaivers } from '@/app/actions/smartwaiver-sync';
import { WAIVER_TEMPLATES } from '@/config/smartwaiver';
import FunLicenseCard from '@/components/fun-license/FunLicenseCard';
import SyncButton from '@/components/fun-license/SyncButton';
import { getPrivatePhotoUrl } from '@/lib/s3-server';

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

  // 3. Name Resolution Logic
  let displayName = "VALUED RENTER";
  
  if (profile?.first_name && profile?.last_name) {
    displayName = `${profile.first_name} ${profile.last_name}`;
  } else if (user.user_metadata?.full_name) {
    displayName = user.user_metadata.full_name;
  } else if (profile?.email) {
    displayName = profile.email.split('@')[0];
  }

  // 4. Fetch Signed Waivers
  const { data: signedWaivers } = await supabase
    .from('customer_waivers')
    .select('template_id, signed_at')
    .eq('user_id', user.id);

  // 5. Secure Photo URL
  const signedPhotoUrl = await getPrivatePhotoUrl(profile?.photo_url);

  // 6. Determine Status
  const hasPhoto = !!profile?.photo_url;
  const hasWaiver = !!(signedWaivers && signedWaivers.length > 0);
  
  // 7. Map Endorsements
  const endorsements = Object.values(WAIVER_TEMPLATES).map(tpl => ({
    id: tpl.templateId, 
    name: tpl.locationName,
    url: `https://waiver.smartwaiver.com/w/${tpl.templateId}/web/`,
    active: signedWaivers?.some(w => w.template_id === tpl.templateId) || false
  }));

  return (
    // FIX 1: Use 'min-h-[100dvh]' for mobile browser bar compatibility
    // FIX 2: Semantic 'bg-background' instead of 'bg-zinc-950'
    // FIX 3: Increased bottom padding 'pb-24' to lift content above fixed footers
    <div className="min-h-[100dvh] bg-background flex flex-col items-center pt-8 px-4 pb-24 relative overflow-x-hidden">
      
      {/* HEADER */}
      <div className="text-center mb-6">
        {/* SEMANTIC: Dark/Light Mode Yellow */}
        <h1 className="text-3xl font-black italic text-yellow-600 dark:text-[#FFEC00] uppercase tracking-tighter transform -skew-x-12">
          SunBuggy
        </h1>
        <p className="text-muted-foreground text-xs font-bold tracking-[0.3em] uppercase opacity-80">
          Official Fun License
        </p>
      </div>

      {/* THE CARD */}
      <FunLicenseCard 
        user={{
          name: displayName,
          id: user.id, 
          photoUrl: signedPhotoUrl, 
          level: profile?.user_level || 100
        }}
        endorsements={endorsements}
        status={{ hasPhoto, hasWaiver }}
      />

      {/* SYNC FOOTER */}
      {/* FIX 4: 'relative z-10' forces this above any background layers causing the click issue */}
      <div className="mt-8 w-full max-w-sm flex items-center justify-between border-t border-border pt-4 relative z-10">
         <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
           Last Synced: Just now
         </span>
         <form action={syncUserWaivers}>
            <SyncButton /> 
         </form>
      </div>
    </div>
  );
}