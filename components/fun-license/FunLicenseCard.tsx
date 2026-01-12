'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { CheckCircle2, ShieldCheck, Camera, MapPin, X, Loader2 } from 'lucide-react';
import LicenseSelfie from './LicenseSelfie'; 
import { uploadUserPhoto } from '@/app/actions/upload-photo'; 
import { useRouter } from 'next/navigation';

interface Props {
  user: {
    name: string;
    id: string;
    photoUrl?: string | null;
    level: number;
  };
  endorsements: { name: string; active: boolean }[];
  status: { hasPhoto: boolean; hasWaiver: boolean };
}

export default function FunLicenseCard({ user, endorsements, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition(); 
  
  // State: The photo to display
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user.photoUrl || null);
  
  // State: Mode switching (Camera vs Card)
  const [isSelfieMode, setIsSelfieMode] = useState(!status.hasPhoto);

  // --- HANDLER: Save Photo to Server ---
  const handlePhotoConfirmed = async (photoDataUrl: string) => {
    setCurrentPhoto(photoDataUrl); // Optimistic update
    
    startTransition(async () => {
      try {
        const result = await uploadUserPhoto(photoDataUrl);
        
        if (result.success) {
          setIsSelfieMode(false);
          router.refresh(); 
        } else {
          alert(`Save failed: ${result.message}`);
          setIsSelfieMode(true); 
        }
      } catch (e) {
        alert("An unexpected network error occurred.");
        setIsSelfieMode(true);
      }
    });
  };

  // --- DYNAMIC URL LOGIC ---
  // Priority: 1. ENV Variable (Production) -> 2. Default to Book (Staging)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://book.sunbuggy.com';
  const verifyLink = `${siteUrl}/verify/${user.id}`;
  
  // QR Code Generation
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyLink)}&color=000000&bgcolor=FFFFFF`;

  // --- MODE 1: SELFIE CAMERA ---
  if (isSelfieMode) {
    return (
      <div className="w-full max-w-md bg-zinc-900 rounded-xl p-4 border border-zinc-800 relative shadow-2xl">
        
        {/* Loading Overlay */}
        {isPending && (
           <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center rounded-xl animate-in fade-in">
             <Loader2 className="animate-spin text-[#FFEC00] mb-3" size={40} />
             <p className="text-white font-bold animate-pulse tracking-wide uppercase">Uploading to Headquarters...</p>
           </div>
        )}

        {/* Cancel Button */}
        {status.hasPhoto && !isPending && (
          <button 
            onClick={() => setIsSelfieMode(false)}
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

  // --- MODE 2: THE "GOOD TO GO" GREEN CARD ---
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
                 // Using standard img to handle private bucket redirects if necessary
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
               onClick={() => setIsSelfieMode(true)}
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
             
             <p className="text-xs font-mono text-zinc-500 mb-3 tracking-wide">ID: {user.id}</p>
             
             <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-700">
                  <ShieldCheck size={10} className="text-[#FFEC00]" />
                  LEVEL {user.level}
                </div>
                
                <button 
                  onClick={() => setIsSelfieMode(true)} 
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
               <span 
                 key={i}
                 className={`
                   text-[9px] font-bold px-2 py-1 rounded border flex items-center gap-1 uppercase transition-colors
                   ${end.active 
                     ? 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                     : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 opacity-40 grayscale'
                   }
                 `}
               >
                 {end.active && <MapPin size={8} />}
                 {end.name}
               </span>
             ))}
           </div>
        </div>

        {/* BOTTOM SECTION: Verification Footer */}
        <div className="mt-1 bg-white dark:bg-black/20 p-3 flex items-center justify-between border-t border-dashed border-zinc-300 dark:border-zinc-800">
           <div className="text-[10px] text-zinc-500 leading-tight pr-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-300 block mb-1">
                Official Verification
              </span>
              Scan to validate status.
           </div>
           
           <div className="bg-white p-1 rounded border border-zinc-200 shrink-0 shadow-sm">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={qrCodeUrl}
               alt="Verification QR"
               className="w-14 h-14"
               loading="lazy"
             />
           </div>
        </div>

      </div>
      
      {/* Decorative Glow underneath */}
      <div className="mx-auto w-[90%] h-6 bg-green-500/20 blur-xl rounded-[100%] mt-[-10px] z-0 pointer-events-none"></div>

    </div>
  );
}