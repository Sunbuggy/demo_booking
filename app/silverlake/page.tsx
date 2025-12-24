// app/silverlake/page.tsx
'use client';

import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo'; 
import { MapPin, Car, Users, Ticket, CheckCircle } from 'lucide-react';

export default function SilverLakeLanding() {
  return (
    <main className="flex flex-col items-center min-h-screen text-white relative p-4 md:p-8">
      
      {/* 1. Background Video */}
      <BackgroundVideo 
        videoSrc="/videos/sunbuggy-intro.mp4" 
        poster="/videos/sunbuggy-poster.jpg" 
      />

      {/* 2. Main Content Container */}
      <div className="w-full max-w-6xl mx-auto z-10 mt-12 mb-24 space-y-12">
        
        {/* Header Section with Glass Effect */}
        <section className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 p-8 md:p-16 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 border border-emerald-500/30">
            <MapPin className="w-4 h-4" /> Silver Lake Sand Dunes, MI
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-lg uppercase">
            Silver Lake <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Dune Buggy</span> Rentals
          </h1>
          
          <p className="text-xl md:text-3xl text-gray-200 font-medium max-w-4xl mx-auto leading-relaxed">
            The world-famous SunBuggy experience is now in Michigan! Rent specialized Dune Buggies, UTVs, and ATVs right at the dunes.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
             <Link
                href="/silverlake/book"
                className="group relative inline-flex items-center justify-center bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white px-12 py-6 rounded-full text-xl md:text-3xl font-black tracking-wide transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(16,185,129,0.6)] border border-emerald-400/30"
              >
                BOOK RENTAL NOW
             </Link>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* Card 1: Specialized Fleet */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <Car className="w-10 h-10 text-emerald-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Real Dune Buggies</h2>
              <p className="text-gray-300 mb-4">
                Don&apos;t just settle for a store-bought UTV. Drive our <span className="text-emerald-300 font-bold">Dune Buggy XP</span> series—built low, long, and wide specifically for the dunes.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Single Seat &quot;Spider&quot;</li>
                <li>• Multi-seat Family Buggies (up to 6 people!)</li>
              </ul>
           </div>

           {/* Card 2: Convenience */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <Ticket className="w-10 h-10 text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Street Legal & Ready</h2>
              <p className="text-gray-300 mb-4">
                No trailers needed! All our vehicles are street legal. You can drive right from our lot at <span className="text-white font-mono">7794 W Taylor Rd</span> directly to the dunes.
              </p>
              <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-900/30 px-3 py-1 rounded-lg">
                <CheckCircle className="w-4 h-4"/> Recreation Passport Included
              </div>
           </div>

           {/* Card 3: UTVs & ATVs */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-white mb-2">UTV & ATV Fleet</h2>
              <p className="text-gray-300 mb-4">
                Prefer a traditional ride? We have a massive fleet of top-tier ATVs and Yamaha Wolverines/Vikings.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-white/10 px-2 py-1 rounded">Wolverine X2</span>
                <span className="text-xs bg-white/10 px-2 py-1 rounded">Wolverine X4</span>
                <span className="text-xs bg-white/10 px-2 py-1 rounded">Viking VI (6-Seat)</span>
              </div>
           </div>

           {/* Card 4: Groups */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <Users className="w-10 h-10 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Large Groups?</h2>
              <p className="text-gray-300">
                We have the largest fleet in the universe (seriously, 500+ vehicles company-wide). We can handle corporate events and large family outings with ease.
              </p>
           </div>
        </div>

        {/* Info / Location Footer */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-8 text-center border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Visit Us</h3>
            <p className="text-lg text-gray-300 font-mono mb-6">
                7794 W Taylor Rd, Mears, MI 49436
            </p>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                Walk-ups are welcome, but we highly recommend booking in advance as we do sell out! 
                Drivers for Dune Buggies must be 18+. UTV Drivers must be 21+.
            </p>
            <div className="mt-8">
                <p className="text-emerald-400 font-bold text-lg">Call Us: 517-271-8585</p>
            </div>
        </div>

      </div>
    </main>
  );
}