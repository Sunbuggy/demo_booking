/**
 * Page: Public Device Checkup
 * Route: /system/checkup
 */

import { Suspense } from 'react';
import DeviceHealthCheck from '@/components/system/DeviceHealthCheck';
import Link from 'next/link';

export const metadata = {
  title: 'Device Checkup | SunBuggy Fun Rentals',
  description: 'Troubleshoot camera and location permissions.',
};

export default function PublicCheckupPage() {
  return (
    // SEMANTIC: bg-background (Instead of bg-zinc-50)
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      
      {/* SEMANTIC: text-muted-foreground (Instead of text-zinc-500) */}
      <Suspense fallback={<div className="text-muted-foreground animate-pulse">Loading Diagnostics...</div>}>
        <DeviceHealthCheck />
      </Suspense>

      <div className="mt-8 text-center w-full">
        <Link 
          href="/" 
          // SEMANTIC: bg-card, text-foreground, border-border (Instead of white/zinc)
          className="inline-block px-6 py-3 text-sm font-bold text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors shadow-sm"
        >
          Return to Home
        </Link>
        <p className="mt-4 text-[10px] text-muted-foreground">
          SunBuggy Tech Support
        </p>
      </div>
    </main>
  );
}