// app/pismo/page.tsx - Pismo Landing / Info Page
'use client';

import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo'; 
import { MapPin, Trophy, Info } from 'lucide-react'; // Optional icons for flavor

export default function PismoLanding() {
  return (
    <main className="flex flex-col items-center min-h-screen text-white relative p-4 md:p-8">
      
      {/* 1. Background Video (Fixed layer) */}
      <BackgroundVideo 
        videoSrc="/videos/sunbuggy-intro.mp4" 
        poster="/videos/sunbuggy-poster.jpg" 
      />

      {/* 2. Main Content Container */}
      <div className="w-full max-w-5xl mx-auto z-10 mt-12 mb-24 space-y-8">
        
        {/* Header Section with Glass Effect */}
        <section className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 p-8 md:p-12 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 border border-orange-500/30">
            <MapPin className="w-4 h-4" /> Oceano Dunes SVRA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 drop-shadow-lg uppercase">
            Pismo Beach <br/> <span className="text-orange-500">Dune Buggy</span> Adventures
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 font-medium max-w-3xl mx-auto leading-relaxed">
            Experience the only place in California where you can drive real dune buggies right on the beach!
          </p>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/60 transition-colors">
              <h2 className="text-2xl font-bold text-orange-400 mb-3 flex items-center gap-2">
                <Trophy className="w-6 h-6"/> ATV Rentals
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Tear up the dunes on our high-performance quads. Perfect for solo riders seeking an adrenaline rush on the sand highway.
              </p>
           </div>

           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-black/60 transition-colors">
              <h2 className="text-2xl font-bold text-orange-400 mb-3 flex items-center gap-2">
                <Info className="w-6 h-6"/> Dune Buggies
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our signature vehicles featuring roll cages, bucket seats, and pure power. Available in 1, 2, and 4 seat configurations.
              </p>
           </div>
        </section>

        {/* Call to Action - Big & Bold */}
        <div className="text-center pt-8">
          <Link
            href="/pismo/book"
            className="group relative inline-flex items-center justify-center bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-12 py-6 rounded-full text-2xl md:text-4xl font-black tracking-wide transition-all transform hover:scale-105 shadow-[0_0_50px_-10px_rgba(234,88,12,0.5)] border border-orange-400/30"
          >
            <span className="drop-shadow-md">BOOK YOUR RIDE NOW</span>
          </Link>
          <p className="mt-4 text-gray-400 text-sm font-medium">
            * Reservations highly recommended for weekends
          </p>
        </div>

      </div>
    </main>
  );
}