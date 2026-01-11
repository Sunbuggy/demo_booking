'use client';

import Link from 'next/link';
import { ScanLine } from 'lucide-react'; 
import NavSideBar from './NavSideBar';
import SunBuggyLogo from '@/components/ui/SunBuggyLogo'; 
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import CurrentUserAvatar from '@/components/CurrentUserAvatar'; 
import { UserType } from '@/app/(biz)/biz/users/types';
import { usePathname } from 'next/navigation';
import { BarcodeScanner } from '@/components/qr-scanner/scanner';
import DialogFactory from '@/components/dialog-factory';
import React, { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface NavbarClientProps {
  user: UserType | null;
  usr: User | null | undefined;
}

export default function NavbarClient({ user, usr }: NavbarClientProps) {
  const path = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // === 1. MENU STATE TRACKING ===
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  // === 2. SMART SCROLL LOGIC ===
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Disable hiding on Desktop (keep it always visible)
        if (window.innerWidth >= 768) {
            setIsVisible(true);
            return;
        }

        // Always show at the very top
        if (currentScrollY < 10) {
          setIsVisible(true);
          lastScrollY.current = currentScrollY;
          return;
        }

        // Hide on scroll down, Show on scroll up
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false); 
        } else {
          setIsVisible(true); 
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', controlNavbar); 
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  return (
    <nav 
      className={`
        fixed top-0 left-0 right-0 z-50 h-16 px-4
        bg-background/80 backdrop-blur-md border-b border-border/40
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'} 
        md:translate-y-0
      `}
    >
      <div className="flex items-center justify-between h-full w-full max-w-7xl mx-auto">
        
        {/* =======================================
            LEFT ZONE: BRAND & MENU
        ======================================= */}
        <div className="flex-shrink-0">
          <Sheet onOpenChange={setIsMainMenuOpen}>
            <SheetTrigger asChild>
              <button 
                className="group flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-muted/40 transition-all duration-200 focus:outline-none"
                aria-label="Open Main Menu"
              >
                 {/* === NAVBAR LOGO === */}
                 <div className="relative w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105">
                     {/* Spins slowly when closed, fast when open */}
                     <SunBuggyLogo spinning={isMainMenuOpen} />
                 </div>

                 {/* === NAVBAR TEXT === */}
                 <div className="flex flex-col items-start leading-none pt-1">
                    <span 
                      className="
                        text-xl md:text-2xl font-black tracking-wide uppercase transform -skew-x-6 font-banco
                        text-[#FFEC00] 
                        [-webkit-text-stroke:0.5px_black] 
                        drop-shadow-[1px_2px_0px_rgba(0,0,0,0.5)]
                        dark:[-webkit-text-stroke:0px] 
                        dark:drop-shadow-[0_0_8px_rgba(255,236,0,0.6)]
                        dark:text-shadow-[0_0_15px_rgba(255,236,0,0.4)]
                      "
                    >
                      SUNBUGGY
                    </span>
                    <span className="text-[0.6rem] font-bold tracking-[0.2em] text-muted-foreground uppercase pl-0.5">
                      Fun Rentals
                    </span>
                 </div>
              </button>
            </SheetTrigger>
            
            {/* === SIDEBAR CONTENT === */}
            <SheetContent side="left" className="dark:bg-background flex flex-col h-full p-0 border-r border-border/50">
              
              {/* === SIDEBAR HEADER (Visible when menu is open) === */}
              <SheetHeader className="p-4 border-b border-border/50 bg-muted/20 flex flex-row items-center gap-2">
                
                {/* 1. LOGO INSIDE MENU (Matches Navbar) */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  {/* Force spinning because menu is open */}
                  <SunBuggyLogo spinning={true} />
                </div>

                {/* 2. TEXT INSIDE MENU (Matches Navbar) */}
                <SheetTitle className="flex flex-col items-start leading-none pt-1">
                   <span 
                      className="
                        text-2xl font-black tracking-wide uppercase transform -skew-x-6 font-banco
                        text-[#FFEC00] 
                        [-webkit-text-stroke:0.5px_black] 
                        drop-shadow-[1px_2px_0px_rgba(0,0,0,0.5)]
                        dark:[-webkit-text-stroke:0px] 
                        dark:drop-shadow-[0_0_8px_rgba(255,236,0,0.6)]
                        dark:text-shadow-[0_0_15px_rgba(255,236,0,0.4)]
                      "
                    >
                      SUNBUGGY
                    </span>
                    <span className="text-[0.6rem] font-bold tracking-[0.2em] text-muted-foreground uppercase pl-0.5">
                      Menu
                    </span>
                </SheetTitle>
                <SheetDescription className="sr-only">Main Navigation</SheetDescription>
              </SheetHeader>

              {/* LIST */}
              <div className="flex-grow overflow-y-auto">
                <NavSideBar user={user} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* =======================================
            RIGHT ZONE: TOOLS & USER PROFILE
        ======================================= */}
        <div className="flex items-center justify-end gap-3">
          
          <button
            onClick={() => setIsDialogOpen(true)}
            className="relative group p-2 rounded-full border border-transparent hover:border-border/40 hover:bg-muted/50 transition-all duration-200"
            title="Scan QR Code"
          >
            <div className="text-orange-500 group-hover:scale-110 transition-transform">
               <ScanLine className="w-6 h-6" />
            </div>
          </button>
          
          <DialogFactory
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            title="QR Scanner"
            description="Scan a vehicle or booking QR Code"
            disableCloseButton={true}
          >
            <BarcodeScanner user={usr} setIsDialogOpen={setIsDialogOpen} />
          </DialogFactory>

          <div className="pl-2 border-l border-border/30">
            {user ? (
              <CurrentUserAvatar />
            ) : (
              mounted && path && !path.includes('signin') && (
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Log In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}