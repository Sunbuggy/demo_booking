// app/lasvegas/page.tsx
'use client';

import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo'; 
import { MapPin, Trophy, Flag, Flame } from 'lucide-react';

export default function LasVegasLanding() {
  return (
    <main className="flex flex-col items-center min-h-screen text-white relative p-4 md:p-8">
      
      {/* 1. Background Video (Reusing your optimized video) */}
      <BackgroundVideo 
        videoSrc="/videos/sunbuggy-intro.mp4" 
        poster="/videos/sunbuggy-poster.jpg" 
      />

      {/* 2. Main Content Container */}
      <div className="w-full max-w-6xl mx-auto z-10 mt-12 mb-24 space-y-12">
        
        {/* Header Section with Glass Effect */}
        <section className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 p-8 md:p-16 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 border border-yellow-500/30">
            <MapPin className="w-4 h-4" /> Nellis Dunes & Amargosa
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-lg uppercase">
            Las Vegas <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">Off Road</span> Mayhem
          </h1>
          
          <p className="text-xl md:text-3xl text-gray-200 font-medium max-w-4xl mx-auto leading-relaxed">
            Home of the world-famous <span className="text-yellow-400 font-bold">Mini-Baja Chase</span>! Drive real dune buggies on the most intense terrain in Vegas.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
             <Link
                href="/lasvegas/book"
                className="group relative inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white px-10 py-5 rounded-full text-xl md:text-2xl font-black tracking-wide transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(234,179,8,0.6)]"
              >
                BOOK ADVENTURE
             </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Card 1 */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <Flame className="w-10 h-10 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">The Chase</h2>
              <p className="text-gray-300">
                Not a slow tour! Our guides chase you through the dunes. It's high-speed excitement you can't find anywhere else.
              </p>
           </div>

           {/* Card 2 */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <Trophy className="w-10 h-10 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">World Famous</h2>
              <p className="text-gray-300">
                As seen on over 50 TV shows. We have the largest fleet of custom buggies in the known universe.
              </p>
           </div>

           {/* Card 3 */}
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/70 transition-all hover:-translate-y-1">
              <Flag className="w-10 h-10 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Diverse Fleet</h2>
              <p className="text-gray-300">
                From 1-seaters to family buggies (seating up to 6!), plus ATVs and UTVs. We have a ride for every skill level.
              </p>
           </div>
        </div>

        {/* Footer Callout */}
        <div className="text-center pb-8">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">
                Located just 15 minutes from the Strip
            </p>
        </div>

      </div>
    </main>
  );
}