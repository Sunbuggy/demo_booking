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
    // 1. Check if app is already installed (Standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);
    
    if (isStandaloneMode) return;

    // 2. Check device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Handle Android/Desktop Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
      // Delay showing the prompt slightly so it doesn't clash with page load animations
      setTimeout(() => setShowPrompt(true), 3000); 
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Handle iOS
    if (isIosDevice) {
        setTimeout(() => setShowPrompt(true), 3000);
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

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 md:bottom-4 md:right-4 md:left-auto md:w-[24rem]">
      {/* Glassmorphism Container */}
      <div className="relative bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-5 overflow-hidden animate-in slide-in-from-bottom duration-500 fade-in">
        
        {/* Glow Effect Background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
        
        {/* Close Button */}
        <button 
          onClick={() => setShowPrompt(false)} 
          className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4"/>
        </button>

        <div className="flex gap-4">
          {/* App Icon Placeholder */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg border border-white/10">
             {/* Replace with your logo image if available, using trophy for now as generic icon */}
             <Download className="text-white w-7 h-7" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base text-white leading-tight">
              Get the SunBuggy App
            </h3>
            <p className="text-xs text-zinc-400 leading-snug pr-4">
              Book faster and access offline tickets with our free app.
            </p>
          </div>
        </div>

        {/* Dynamic Action Area */}
        <div className="mt-4 pt-3 border-t border-white/10">
          {isIOS ? (
             <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm text-zinc-300">
                 <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-blue-400">
                   <Share className="w-3.5 h-3.5" />
                 </span>
                 <span>Tap the <b>Share</b> button below</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-zinc-300">
                 <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-zinc-300">
                   <PlusSquare className="w-3.5 h-3.5" />
                 </span>
                 <span>Select <b>Add to Home Screen</b></span>
               </div>
               {/* Arrow pointing down for mobile context */}
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-950 rotate-45 border-r border-b border-white/10 md:hidden"></div>
             </div>
          ) : (
             <Button 
               onClick={handleInstallClick} 
               className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-10 rounded-lg shadow-sm active:scale-[0.98] transition-transform"
             >
               Install Now
             </Button>
          )}
        </div>

      </div>
    </div>
  );
}