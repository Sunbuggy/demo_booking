'use client';

import React, { useState, useTransition } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  MapPin, 
  X, 
  Loader2, 
  AlertCircle, 
  FileSignature,
  ExternalLink 
} from 'lucide-react';
import LicenseSelfie from './LicenseSelfie'; 
import { uploadUserPhoto } from '@/app/actions/upload-photo'; 
import { useRouter } from 'next/navigation';

// --- TYPES ---
interface Endorsement {
  id: string;
  name: string;
  url: string; 
  active: boolean;
}

interface Props {
  user: {
    name: string;
    id: string; // Full UUID
    photoUrl?: string | null;
    level: number;
  };
  endorsements: Endorsement[];
  status: { hasPhoto: boolean; hasWaiver: boolean };
}

export default function FunLicenseCard({ user, endorsements, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition(); 
  
  // State: The photo to display
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user.photoUrl || null);
  
  // State: Allows user to manually retake photo
  const [isRetaking, setIsRetaking] = useState(false);

  // --- WORKFLOW LOGIC ---
  const showWaiverStep = !status.hasWaiver;
  const showSelfieStep = status.hasWaiver && (!status.hasPhoto || isRetaking);
  
  // --- HANDLER: Save Photo ---
  const handlePhotoConfirmed = async (photoDataUrl: string) => {
    setCurrentPhoto(photoDataUrl); 
    
    startTransition(async () => {
      try {
        const result = await uploadUserPhoto(photoDataUrl);
        if (result.success) {
          setIsRetaking(false);
          router.refresh(); 
        } else {
          alert(`Save failed: ${result.message}`);
        }
      } catch (e) {
        alert("An unexpected network error occurred.");
      }
    });
  };

  // ===========================================================================
  // VIEW 1: WAIVER SELECTION (RED RING)
  // ===========================================================================
  if (showWaiverStep) {
    return (
      <div className="w-full max-w-md animate-in slide-in-from-bottom duration-500">
        <div className="bg-red-600 text-white text-xs font-black text-center py-3 rounded-t-xl uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)] relative z-10">
          <span className="flex items-center justify-center gap-2">
            <AlertCircle size={16} /> Step 1: Validation Required
          </span>
        </div>

        <div className="bg-zinc-900 border-x border-b border-zinc-800 rounded-b-xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-red-600 bg-zinc-800 mx-auto flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
               <FileSignature size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase">Select Your Location</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Sign a liability waiver to activate your license.
            </p>
          </div>

          <div className="space-y-3">
            {endorsements.map((item) => (
              <a 
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-yellow-500 rounded-lg transition-all"
              >
                <div className="flex items-center gap-3">
                   <div className="bg-zinc-900 p-2 rounded-full text-zinc-400 group-hover:text-yellow-500 transition-colors">
                     <MapPin size={18} />
                   </div>
                   <div className="text-left">
                     <div className="text-sm font-bold text-white group-hover:text-yellow-400 uppercase tracking-wide">
                       {item.name}
                     </div>
                     <div className="text-[10px] text-zinc-500">Tap to Sign</div>
                   </div>
                </div>
                <ExternalLink size={16} className="text-zinc-500 group-hover:text-white" />
              </a>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-[10px] text-zinc-500 italic">
              Use the "Refresh" button below after signing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // VIEW 2: SELFIE CAMERA (YELLOW RING)
  // ===========================================================================
  if (showSelfieStep) {
    return (
      <div className="w-full max-w-md bg-zinc-900 rounded-xl p-4 border border-zinc-800 relative shadow-2xl">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg z-20">
           Step 2: Add Photo
        </div>

        {isPending && (
           <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center rounded-xl animate-in fade-in">
             <Loader2 className="animate-spin text-[#FFEC00] mb-3" size={40} />
             <p className="text-white font-bold animate-pulse tracking-wide uppercase">Uploading to Headquarters...</p>
           </div>
        )}

        {status.hasPhoto && !isPending && (
          <button 
            onClick={() => setIsRetaking(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full p-1 z-20 transition-all"
          >
            <X size={24} />
          </button>
        )}
        
        <LicenseSelfie 
          onPhotoConfirmed={handlePhotoConfirmed} 
          initialImage={currentPhoto}
        />
      </div>
    );
  }

  // ===========================================================================
  // VIEW 3: THE GREEN CARD (GREEN RING)
  // ===========================================================================
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://book.sunbuggy.com';
  
  // UPDATE: Increased API size to 300x300 for high resolution
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${siteUrl}/verify/${user.id}`)}&color=000000&bgcolor=FFFFFF`;

  return (
    <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500 perspective-1000">
      
      {/* STATUS BANNER */}
      <div className="bg-green-600 text-white text-xs font-black text-center py-2 rounded-t-xl uppercase tracking-widest shadow-[0_0_15px_rgba(22,163,74,0.6)] z-10 relative">
        <span className="flex items-center justify-center gap-2">
          <CheckCircle2 size={14} /> Active Operator • Good to Go
        </span>
      </div>

      {/* CARD CONTAINER */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border-x-2 border-b-2 border-green-600 rounded-b-xl overflow-hidden relative shadow-2xl">
        
        {/* TOP SECTION: Photo & Core Info */}
        <div className="p-4 flex gap-4 items-start">
          
          {/* PHOTO FRAME */}
          <div className="relative group w-24 h-32 flex-shrink-0">
             <div className="absolute inset-0 border-[3px] border-green-500 rounded-lg overflow-hidden shadow-inner bg-zinc-800">
               {currentPhoto ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img 
                    src={currentPhoto} 
                    alt="License Photo" 
                    className="object-cover w-full h-full"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-zinc-600">
                   <Camera size={24} />
                 </div>
               )}
             </div>
             
             {/* RETAKE OVERLAY */}
             <button 
               onClick={() => setIsRetaking(true)}
               className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold uppercase rounded-lg backdrop-blur-sm"
             >
               <Camera size={20} className="mb-1 text-[#FFEC00]" />
               Retake
             </button>

             {/* Hologram/Shine Overlay */}
             <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-transparent pointer-events-none rounded-lg" />
          </div>

          {/* USER DETAILS */}
          <div className="flex-1 min-w-0 flex flex-col justify-center h-32">
             <h2 className={`font-black text-zinc-900 dark:text-white uppercase leading-none mb-1 break-words
               ${user.name.length > 20 ? 'text-lg' : 'text-2xl'} 
             `}>
               {user.name}
             </h2>
             
             <p className="text-xs font-mono text-zinc-500 mb-3 tracking-wide">
                ID: {user.id.slice(0, 8).toUpperCase()}
             </p>
             
             <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-700">
                  <ShieldCheck size={10} className="text-[#FFEC00]" />
                  LEVEL {user.level}
                </div>
                
                <button 
                  onClick={() => setIsRetaking(true)} 
                  className="sm:hidden text-[10px] text-zinc-500 underline"
                >
                  Edit Photo
                </button>
             </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Endorsements Grid */}
        <div className="px-4 pb-3">
           <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
             Endorsements
           </p>
           <div className="flex flex-wrap gap-1.5">
             {endorsements.map((end, i) => (
               <a 
                 key={end.id}
                 href={!end.active ? end.url : undefined} 
                 target={!end.active ? "_blank" : undefined}
                 className={`
                   text-[9px] font-bold px-2 py-1 rounded border flex items-center gap-1 uppercase transition-colors
                   ${end.active 
                     ? 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 cursor-default' 
                     : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 opacity-60 hover:opacity-100 hover:text-blue-500 cursor-pointer'
                   }
                 `}
                 title={end.active ? "Signed" : "Click to Sign"}
               >
                 {end.active ? <CheckCircle2 size={8} /> : <ExternalLink size={8} />}
                 {end.name}
               </a>
             ))}
           </div>
        </div>

        {/* BOTTOM SECTION: Verification Footer */}
        <div className="mt-1 bg-white dark:bg-black/20 p-3 flex items-center justify-between border-t border-dashed border-zinc-300 dark:border-zinc-800">
           <div className="text-[10px] text-zinc-500 leading-tight pr-2 max-w-[50%]">
              <span className="font-bold text-zinc-900 dark:text-zinc-300 block mb-1">
                Official Verification
              </span>
              Scan to validate status.
           </div>
           
           {/* UPDATE: Increased QR container size to w-32 h-32 */}
           <div className="bg-white p-1 rounded border border-zinc-200 shrink-0 shadow-sm">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={qrCodeUrl}
               alt="Verification QR"
               className="w-32 h-32" // Massive Size Increase
               loading="lazy"
             />
           </div>
        </div>

      </div>
      <div className="mx-auto w-[90%] h-6 bg-green-500/20 blur-xl rounded-[100%] mt-[-10px] z-0 pointer-events-none"></div>
    </div>
  );
}