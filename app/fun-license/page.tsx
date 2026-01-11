import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LicenseSelfie from '@/components/fun-license/LicenseSelfie';
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Force dynamic to ensure we always fetch fresh user data
export const dynamic = 'force-dynamic';

export default async function FunLicensePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch full profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return <div>Loading...</div>;

  // Determine State
  const hasWaiver = !!profile.fun_license_id;
  const hasPhoto = !!profile.license_photo_url;
  
  const isComplete = hasWaiver && hasPhoto;
  const isPending = hasWaiver && !hasPhoto;

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

      {/* === SCENARIO 1: COMPLETED (GREEN) === */}
      {isComplete && (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Green Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-green-500" />
          
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-4 border-green-500 overflow-hidden mb-6 shadow-lg shadow-green-500/20 relative">
               <Image 
                 src={profile.license_photo_url} 
                 alt="License Photo" 
                 fill 
                 className="object-cover"
               />
            </div>
            
            <h2 className="text-2xl font-bold uppercase">{profile.full_name}</h2>
            <p className="text-green-500 font-mono text-sm mb-6 flex items-center gap-2">
              <CheckCircle2 size={16} /> LICENSE ACTIVE
            </p>

            <div className="w-full bg-black/40 rounded-lg p-4 font-mono text-xs text-zinc-500 space-y-2 border border-zinc-800">
              <div className="flex justify-between">
                <span>LICENSE ID:</span>
                <span className="text-zinc-300">{profile.fun_license_id?.substring(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span>ISSUED:</span>
                <span className="text-zinc-300">
                  {profile.license_signed_at ? new Date(profile.license_signed_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>EMAIL:</span>
                <span className="text-zinc-300">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === SCENARIO 2: PENDING PHOTO (YELLOW) === */}
      {isPending && (
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Status Alert */}
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-yellow-500 text-black p-2 rounded-full">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-yellow-500">Action Required</h3>
              <p className="text-sm text-zinc-300">Waiver signed! Just add your photo.</p>
            </div>
          </div>

          {/* The Selfie Uploader */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-6">Step 2: License Photo</h2>
            <LicenseSelfie />
          </div>
        </div>
      )}

      {/* === SCENARIO 3: MISSING EVERYTHING (RED) === */}
      {!hasWaiver && (
        <div className="w-full max-w-md space-y-8 text-center">
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
            
            {/* LINK TO YOUR SMARTWAIVER URL */}
            <Link 
              href="https://waiver.smartwaiver.com/v/sunbuggy" // REPLACE WITH YOUR REAL LINK
              target="_blank"
              className="flex items-center justify-center w-full py-4 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition gap-2"
            >
              SIGN DIGITAL WAIVER <ExternalLink size={18} />
            </Link>
            
            <p className="text-xs text-zinc-600 mt-4">
              Already signed? <br/>
              <form action={async () => {
                  'use server';
                  // This is a "quick refresh" hack to re-trigger the avatar sync logic
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