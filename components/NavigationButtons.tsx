'use client';

import { 
  Home, 
  RotateCw, 
  ArrowLeft, 
  Share2, 
  Plus, 
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function NavigationButtons() {
  const router = useRouter();
  const pathname = usePathname();
  
  // === 1. CONFIGURATION: HIDE ON BOOKING ===
  const hiddenRoutes = [
    '/booking',
    '/pismo',      
    '/checkout',
    '/review'
  ];

  const shouldHide = hiddenRoutes.some(route => pathname.includes(route));
  if (shouldHide) return null;

  // === 2. STATE ===
  const [canGoBack, setCanGoBack] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true); // New state for pulse control
  const menuRef = useRef<HTMLDivElement>(null);

  // === 3. LOGIC ===
  useEffect(() => {
    setCanGoBack(window.history.length > 1);
    
    // Timer: Stop the pulse animation after 3 seconds
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action?: () => void) => {
    if (action) action();
    setIsOpen(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'SunBuggy Fun Rentals',
      text: 'Check out this page on SunBuggy!',
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } 
      catch (err) { console.log('Share canceled', err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!'); 
    }
    setIsOpen(false);
  };

  const handleBack = () => {
    if (canGoBack) router.back();
    else router.push('/');
    setIsOpen(false);
  };

  // === STYLES ===
  const subButtonClass = `
    group flex items-center justify-end gap-3 w-full
    transition-all duration-200 ease-out
    ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-75 pointer-events-none'}
  `;

  const iconBaseClass = `
    w-12 h-12 rounded-full shadow-lg border border-border/40 backdrop-blur-md
    flex items-center justify-center text-foreground
    hover:scale-110 active:scale-95 transition-all duration-200
  `;

  const labelClass = `
    px-2 py-1 rounded-md bg-background/90 border border-border/40 shadow-sm
    text-xs font-medium text-foreground/80 pointer-events-none
    opacity-0 group-hover:opacity-100 transition-opacity duration-200
  `;

  const isHome = pathname === '/';

  return (
    <div 
      ref={menuRef}
      className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4 pb-[env(safe-area-inset-bottom)]"
    >
      {/* TOOLS LIST */}
      <div className="flex flex-col items-end gap-3 mb-2">
        
        {/* SHARE */}
        <button 
          onClick={handleShare}
          className={subButtonClass}
          style={{ transitionDelay: '50ms' }}
        >
          <span className={labelClass}>Share Page</span>
          <div className={`${iconBaseClass} bg-background/80 hover:bg-blue-500 hover:text-white`}>
             <Share2 className="w-5 h-5" />
          </div>
        </button>

        {/* RELOAD */}
        <button 
          onClick={() => handleAction(() => window.location.reload())}
          className={subButtonClass}
          style={{ transitionDelay: '100ms' }}
        >
          <span className={labelClass}>Reload</span>
          <div className={`${iconBaseClass} bg-background/80 hover:bg-green-500 hover:text-white`}>
            <RotateCw className="w-5 h-5" />
          </div>
        </button>

        {/* DASHBOARD */}
        {!isHome && (
          <Link 
            href="/"
            onClick={() => setIsOpen(false)}
            className={subButtonClass}
            style={{ transitionDelay: '150ms' }}
          >
            <span className={labelClass}>Dashboard</span>
            <div className={`${iconBaseClass} bg-background/80 hover:bg-orange-500 hover:text-white`}>
              <Home className="w-5 h-5" />
            </div>
          </Link>
        )}

        {/* BACK */}
        <button 
          onClick={handleBack}
          className={subButtonClass}
          style={{ transitionDelay: '200ms' }}
        >
          <span className={labelClass}>Go Back</span>
          <div className={`${iconBaseClass} bg-background/80 hover:bg-red-500 hover:text-white`}>
            {canGoBack ? <ArrowLeft className="w-5 h-5" /> : <Home className="w-5 h-5" />}
          </div>
        </button>
      </div>

      {/* FAB TRIGGER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative group w-14 h-14 rounded-full shadow-2xl 
          border border-white/20 backdrop-blur-xl
          flex items-center justify-center
          transition-all duration-300 ease-spring
          ${isOpen ? 'bg-destructive rotate-90' : 'bg-primary hover:scale-105'}
        `}
        aria-label="Open Tools"
      >
        <div className="relative z-10 text-primary-foreground">
          {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </div>
        
        {/* PULSE EFFECT: Only renders if 'showPulse' is true AND menu is closed */}
        {showPulse && !isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-75" />
        )}
      </button>
    </div>
  );
}