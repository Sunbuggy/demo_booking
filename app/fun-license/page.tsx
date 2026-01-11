import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ExternalLink } from 'lucide-react';
import FunLicenseCard from '@/components/fun-license/FunLicenseCard'; // Import new component

export const dynamic = 'force-dynamic';

export default async function FunLicensePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return <div>Loading...</div>;

  const hasWaiver = !!profile.fun_license_id;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center pt-24 pb-12 px-4">
      
      {/* HEADER */}
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-4xl md:text-5xl font-black font-banco text-[#FFEC00] uppercase tracking-wide">
          My Fun License
        </h1>
        <p className="text-zinc-400">
          Your passport to the dunes.
        </p>
      </div>

      {/* === SCENARIO 1: WAIVER FOUND (Green or Yellow) === */}
      {/* We delegate the "Photo Logic" to the Client Component */}
      {hasWaiver ? (
        <FunLicenseCard profile={profile} email={user.email} />
      ) : (
        /* === SCENARIO 2: WAIVER MISSING (Red) === */
        <div className="w-full max-w-md space-y-8 text-center animate-in zoom-in-95 duration-300">
           <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-4 text-left">
            <div className="bg-red-500 text-white p-2 rounded-full">
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-red-500">No License Found</h3>
              <p className="text-sm text-zinc-300">You must sign the waiver first.</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-4">Step 1: The Waiver</h2>
            <p className="text-zinc-400 text-sm mb-8">
              Every driver and passenger needs a Fun License. 
              It takes less than 2 minutes.
            </p>
            
            <Link 
              href="https://waiver.smartwaiver.com/v/sunbuggy"
              target="_blank"
              className="flex items-center justify-center w-full py-4 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition gap-2"
            >
              SIGN DIGITAL WAIVER <ExternalLink size={18} />
            </Link>
            
            <p className="text-xs text-zinc-600 mt-4">
              Already signed? <br/>
              <form action={async () => {
                  'use server';
                  redirect('/fun-license?refresh=true');
              }}>
                 <button className="underline hover:text-white">Check again</button>
              </form>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}