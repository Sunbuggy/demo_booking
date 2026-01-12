import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';
import { WAIVER_TEMPLATES } from '@/config/smartwaiver'; 
import { syncUserWaivers } from '@/app/actions/smartwaiver-sync';
import FunLicenseCard from '@/components/fun-license/FunLicenseCard'; 
import SyncButton from '@/components/fun-license/SyncButton'; 

export const dynamic = 'force-dynamic';

interface EndorsementStatus {
  locationKey: string;
  locationName: string;
  hasSigned: boolean;
  isRequired: boolean;
  templateId: string;
  signedDate?: string;
}

export default async function FunLicensePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: signedWaivers } = await supabase
    .from('customer_waivers')
    .select('template_id, signed_at')
    .eq('user_id', user.id);

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('location')
    .eq('user_id', user.id)
    .gte('date', new Date().toISOString());

  // Logic remains the same
  const endorsements: EndorsementStatus[] = Object.entries(WAIVER_TEMPLATES).map(([key, config]) => {
    const matchingWaiver = signedWaivers?.find(w => w.template_id === config.templateId);
    const hasBookingHere = upcomingBookings?.some(b => config.requiredFor.includes(b.location));

    return {
      locationKey: key,
      locationName: config.locationName,
      templateId: config.templateId,
      hasSigned: !!matchingWaiver,
      signedDate: matchingWaiver?.signed_at,
      isRequired: !!hasBookingHere,
    };
  });

  const hasAnyWaiver = signedWaivers && signedWaivers.length > 0;

  return (
    // REDUCED PADDING: pt-20 instead of pt-24
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center pt-20 pb-8 px-3">
      
      {/* HEADER: Compact */}
      <div className="text-center mb-6 space-y-1">
        <h1 className="text-3xl md:text-4xl font-black font-banco text-[#FFEC00] uppercase tracking-wide">
          My Fun License
        </h1>
        <p className="text-zinc-400 text-sm max-w-sm mx-auto">
          Your digital passport for SunBuggy adventures.
        </p>
      </div>

      {/* PRIMARY LICENSE CARD: Reduced margins */}
      <div className="w-full max-w-md mb-6">
         {hasAnyWaiver ? (
            <FunLicenseCard profile={profile} email={user.email} />
         ) : (
            <div className="p-4 border border-zinc-800 bg-zinc-900/50 rounded-xl text-center">
                <p className="text-zinc-400 text-sm italic">
                    Sign a waiver to generate your ID Card.
                </p>
            </div>
         )}
      </div>

      {/* ENDORSEMENT DASHBOARD */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
           <h2 className="text-lg font-bold text-[#FFEC00]">Endorsements</h2>
           <span className="text-xs text-zinc-500">Location Access</span>
        </div>
        
        {/* GRID: Compact layout, reduced gaps */}
        <div className="grid gap-3">
            {endorsements.map((item) => (
                <div 
                    key={item.locationKey}
                    className={`
                        relative p-3 rounded-lg border flex items-center justify-between
                        ${item.hasSigned 
                            ? 'bg-zinc-900/80 border-green-900/50' 
                            : item.isRequired 
                                ? 'bg-red-950/20 border-red-500/50'
                                : 'bg-zinc-900/40 border-zinc-800 opacity-60'
                        }
                    `}
                >
                    {/* Left Side: Info */}
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${item.hasSigned ? 'bg-green-900/30 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <MapPin size={18} />
                         </div>
                         <div>
                            <h3 className="font-bold text-sm leading-tight">{item.locationName}</h3>
                            <div className="text-xs mt-0.5">
                                {item.hasSigned ? (
                                    <span className="text-green-400 font-medium">Active</span>
                                ) : item.isRequired ? (
                                    <span className="text-red-400 font-bold animate-pulse">REQUIRED</span>
                                ) : (
                                    <span className="text-zinc-500">Not Signed</span>
                                )}
                            </div>
                         </div>
                    </div>

                    {/* Right Side: Action */}
                    {item.hasSigned ? (
                        <CheckCircle2 className="text-green-500 w-5 h-5" />
                    ) : (
                        <Link 
                            href={`https://waiver.smartwaiver.com/w/${item.templateId}/web/`}
                            target="_blank"
                            className={`
                                flex items-center gap-1 py-1.5 px-3 rounded text-xs font-bold transition-colors
                                ${item.isRequired 
                                    ? 'bg-[#FFEC00] text-black hover:bg-yellow-400' 
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }
                            `}
                        >
                            SIGN <ExternalLink size={10} />
                        </Link>
                    )}
                </div>
            ))}
        </div>

        {/* SYNC UTILITY: Horizontal Layout */}
        <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
            <p className="text-zinc-500 text-xs leading-tight">
                Not seeing your stamp?<br/>Force a refresh.
            </p>
            <form action={syncUserWaivers}>
                 <SyncButton />
            </form>
        </div>
      </div>
    </div>
  );
}