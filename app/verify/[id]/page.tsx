import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPrivatePhotoUrl } from '@/lib/s3-server'; // <--- CRITICAL IMPORT FOR PRIVATE BUCKETS

// --- CONFIGURATION ---
// 1. Service Role Client: Required to read user data publicly without the scanner being logged in.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// 2. Page Configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fetch fresh data (Fraud Prevention)

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VerifyLicensePage(props: Props) {
  const params = await props.params;
  const userId = params.id;

  // --- STEP 1: FETCH DATA (PARALLEL) ---
  const [profileRes, waiverRes] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('first_name, last_name, photo_url, user_level, email')
      .eq('id', userId)
      .single(),
    
    supabaseAdmin
      .from('customer_waivers')
      .select('template_id, signed_at')
      .eq('user_id', userId)
  ]);

  const profile = profileRes.data;
  const waivers = waiverRes.data || [];

  // --- STEP 2: SIGN THE PHOTO URL ---
  // If the bucket is private, the raw URL returns 401. We must sign it.
  if (profile && profile.photo_url) {
     profile.photo_url = await getPrivatePhotoUrl(profile.photo_url);
  }

  // --- STEP 3: DETERMINE STATUS ---
  // A. Check Existence
  if (!profile) {
    return <StatusScreen status="NOT_FOUND" userId={userId} />;
  }

  // B. Check Critical Requirements
  const hasPhoto = !!profile.photo_url;
  const hasWaiver = waivers.length > 0;
  
  // C. Determine Final State
  if (!hasWaiver) return <StatusScreen status="NO_WAIVER" profile={profile} />;
  if (!hasPhoto) return <StatusScreen status="NO_PHOTO" profile={profile} />;

  // D. Success State
  return <StatusScreen status="VALID" profile={profile} waivers={waivers} />;
}

// --- SUB-COMPONENTS: THE STATUS SCREENS ---

type ValidationStatus = 'VALID' | 'NO_WAIVER' | 'NO_PHOTO' | 'NOT_FOUND';

function StatusScreen({ 
  status, 
  profile, 
  waivers, 
  userId 
}: { 
  status: ValidationStatus; 
  profile?: any; 
  waivers?: any[]; 
  userId?: string 
}) {
  
  // --- SCENARIO 1: VALID (GREEN SCREEN) ---
  if (status === 'VALID') {
    const latestWaiver = waivers?.sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime())[0];

    return (
      <div className="min-h-screen bg-green-600 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-300">
        
        {/* BIG ICON */}
        <div className="bg-white/20 p-6 rounded-full mb-6 animate-bounce shadow-2xl">
          <CheckCircle2 className="text-white w-24 h-24" />
        </div>

        {/* STATUS TEXT */}
        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 drop-shadow-md">
          VALID
        </h1>
        <p className="text-green-100 font-bold tracking-widest uppercase mb-8">
          Authorized SunBuggy Operator
        </p>

        {/* ID CARD REPLICA */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-transform hover:scale-105 duration-300">
          
          {/* Photo */}
          <div className="relative w-32 h-32 mx-auto mb-4 rounded-full border-[6px] border-green-500 overflow-hidden shadow-inner bg-zinc-200">
            {/* Using standard img tag to prevent Next.js Optimization 401 errors on signed URLs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={profile.photo_url} 
              alt="Driver" 
              className="object-cover w-full h-full" 
            />
          </div>

          {/* Details */}
          <h2 className="text-3xl font-black text-zinc-900 uppercase leading-none mb-1">
            {profile.first_name}
          </h2>
          <h2 className="text-2xl font-bold text-zinc-600 uppercase leading-tight mb-4">
            {profile.last_name}
          </h2>

          <div className="bg-zinc-100 rounded-lg p-3 space-y-2 text-left">
             <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold uppercase">Level</span>
                <span className="font-mono font-bold">{profile.user_level}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-bold uppercase">Waiver</span>
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Signed
                </span>
             </div>
             {latestWaiver && (
               <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Last Signed:</span>
                  <span>{formatDistanceToNow(new Date(latestWaiver.signed_at))} ago</span>
               </div>
             )}
          </div>
        </div>

        {/* TIMESTAMP */}
        <div className="mt-8 text-green-200 text-xs font-mono">
           Verified: {new Date().toLocaleTimeString()}
        </div>
      </div>
    );
  }

  // --- SCENARIO 2: NO WAIVER (RED SCREEN) ---
  if (status === 'NO_WAIVER') {
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="bg-white/20 p-6 rounded-full mb-6">
          <ShieldAlert className="w-24 h-24" />
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">STOP</h1>
        <p className="text-xl font-bold uppercase tracking-widest opacity-90 mb-8">
          No Active Waiver Found
        </p>

        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm max-w-sm w-full">
           <p className="font-bold text-lg mb-1">{profile.first_name} {profile.last_name}</p>
           <p className="text-sm opacity-80">Profile found, but liability release is missing.</p>
        </div>
      </div>
    );
  }

  // --- SCENARIO 3: NO PHOTO (YELLOW SCREEN) ---
  if (status === 'NO_PHOTO') {
    return (
      <div className="min-h-screen bg-yellow-500 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="bg-white/20 p-6 rounded-full mb-6 animate-pulse">
          <AlertTriangle className="w-24 h-24" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">ID PHOTO MISSING</h1>
        <p className="font-bold uppercase tracking-widest opacity-90 mb-8">
          Identity Not Verified
        </p>

        <div className="bg-black/20 p-6 rounded-xl max-w-sm w-full">
           <div className="w-20 h-20 bg-black/30 rounded-full mx-auto mb-4 flex items-center justify-center">
             <span className="text-3xl">?</span>
           </div>
           <p className="font-bold text-lg">{profile.first_name} {profile.last_name}</p>
           <p className="text-sm opacity-80 mt-2">
             Guest must take a selfie via their Fun License page before riding.
           </p>
        </div>
      </div>
    );
  }

  // --- SCENARIO 4: 404 NOT FOUND (GRAY SCREEN) ---
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
      <XCircle className="w-24 h-24 mb-6 opacity-50" />
      <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">
        INVALID ID
      </h1>
      <p className="max-w-xs mx-auto mb-8">
        The QR code scanned does not match any record in the SunBuggy database.
      </p>
      <div className="font-mono text-xs bg-black p-2 rounded text-zinc-600">
        ID: {userId || 'Unknown'}
      </div>
    </div>
  );
}