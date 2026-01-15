'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, PlusSquare, Download } from 'lucide-react'; 

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if app is already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Capture the Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); 
      setDeferredPrompt(e);
      // Small delay to let the page settle
      setTimeout(() => setShowPrompt(true), 2000); 
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Force show on iOS (since the event above never fires on iOS)
    if (isIosDevice) {
        setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); 
    const { outcome } = await deferredPrompt.userChoice; 
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  // If clicked anywhere on the card (Android only)
  const handleCardClick = () => {
    if (!isIOS && deferredPrompt) {
      handleInstallClick();
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:bottom-4 md:right-4 md:left-auto md:w-[24rem]">
      {/* The outer div is now clickable for Android users. 
         We stop propagation on the close button so it doesn't trigger the install.
      */}
      <div 
        onClick={handleCardClick}
        className={`relative bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-5 overflow-hidden animate-in slide-in-from-bottom duration-500 fade-in 
        ${!isIOS ? 'cursor-pointer active:scale-95 transition-transform hover:bg-zinc-900/90' : ''}`}
      >
        
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
        
        {/* Close Button - stopPropagation prevents triggering the card click */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            setShowPrompt(false);
          }}
          className="absolute top-3 right-3 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-20"
        >
          <X className="w-5 h-5"/>
        </button>

        <div className="flex gap-4 items-center">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg border border-white/10">
             <Download className="text-white w-7 h-7" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="font-bold text-lg text-white leading-tight">
              Get the App
            </h3>
            <p className="text-xs text-zinc-400 leading-snug mt-1">
              {isIOS ? 'Tap Share below to install.' : 'Tap here to install now!'}
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="mt-4 pt-3 border-t border-white/10">
          {isIOS ? (
             <div className="space-y-3">
               {/* iOS Instructions */}
               <div className="flex items-center gap-3 text-sm text-zinc-300">
                 <span className="flex-shrink-0 w-7 h-7 bg-zinc-800 rounded flex items-center justify-center text-blue-400">
                   <Share className="w-4 h-4" />
                 </span>
                 <span>1. Tap the <b>Share</b> button</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-zinc-300">
                 <span className="flex-shrink-0 w-7 h-7 bg-zinc-800 rounded flex items-center justify-center text-zinc-300">
                   <PlusSquare className="w-4 h-4" />
                 </span>
                 <span>2. Tap <b>Add to Home Screen</b></span>
               </div>
               {/* Mobile Arrow Helper */}
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-950 rotate-45 border-r border-b border-white/10 md:hidden"></div>
             </div>
          ) : (
             <Button 
               onClick={(e) => {
                 e.stopPropagation(); // Prevent double firing since container has click
                 handleInstallClick();
               }} 
               className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-11 rounded-xl shadow-sm text-base"
             >
               Install SunBuggy App
             </Button>
          )}
        </div>

      </div>
    </div>
  );
}