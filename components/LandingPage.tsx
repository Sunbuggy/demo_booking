import React from 'react';
import Link from 'next/link';
import { Users, Trophy } from 'lucide-react';

// Re-using your exact import paths
import { default as InstallSunbuggy } from '@/components/add-to-screen/page';
import BackgroundVideo from '@/components/BackgroundVideo'; 

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center min-h-screen text-white animate-in fade-in duration-500 relative">
      
      <InstallSunbuggy />
      <BackgroundVideo 
        videoSrc="/videos/sunbuggy-intro.mp4" 
        poster="/videos/sunbuggy-poster.jpg" 
      />

      {/* Hero Section */}
      <section className="w-full max-w-6xl px-4 pt-20 pb-8 text-center space-y-6 z-10">
        <div className="space-y-2 drop-shadow-lg">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white uppercase drop-shadow-md border-text">
            Welcome to SunBuggy
          </h1>
          <p className="text-xl md:text-3xl font-bold text-gray-200">
            You&apos;ve found the Original
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-sm p-6 rounded-2xl border-2 border-dashed border-white/20 mx-auto max-w-3xl text-white">
          <div className="space-y-1 text-lg md:text-xl font-bold uppercase tracking-wide">
            <p>SunBuggy Off Road Adventure Company</p>
            <p className="text-primary">•</p>
            <p>ATV Tours and ATV Rentals</p>
            <p className="text-primary">•</p>
            <p>UTV Tours and UTV Rentals</p>
            <p className="text-primary">•</p>
            <p>Dune Buggy Tours and Dune Buggy Rentals</p>
          </div>
          <p className="mt-4 text-lg italic text-yellow-400 font-serif">
            &quot;Often imitated, but never duplicated&quot;
          </p>
        </div>
      </section>

      {/* Location Cards */}
      <section className="w-full max-w-6xl px-4 py-8 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/lasvegas" 
            className="group relative flex flex-col overflow-hidden rounded-xl border border-white/20 bg-black/60 backdrop-blur-md text-white shadow-lg transition-all hover:scale-[1.02] hover:border-primary/80 hover:bg-black/80"
          >
            <div className="aspect-[4/3] bg-stone-900/80 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
               <span className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter text-center drop-shadow-md">
                 Las<br/>Vegas
               </span>
            </div>
            <div className="p-4 bg-primary text-primary-foreground text-center font-bold tracking-widest text-sm uppercase">
              Nevada
            </div>
            <div className="p-4 flex-grow text-center text-sm text-gray-300">
              <p>ATV • UTV • Dune Buggies</p>
              <p className="font-semibold text-primary-foreground mt-1">The Mini-Baja Chase</p>
            </div>
          </Link>

          <Link href="/pismo" 
            className="group relative flex flex-col overflow-hidden rounded-xl border border-white/20 bg-black/60 backdrop-blur-md text-white shadow-lg transition-all hover:scale-[1.02] hover:border-primary/80 hover:bg-black/80"
          >
            <div className="aspect-[4/3] bg-blue-900/80 flex items-center justify-center group-hover:bg-blue-800 transition-colors">
               <span className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter text-center drop-shadow-md">
                 Pismo<br/>Beach
               </span>
            </div>
            <div className="p-4 bg-primary text-primary-foreground text-center font-bold tracking-widest text-sm uppercase">
              California
            </div>
            <div className="p-4 flex-grow text-center text-sm text-gray-300">
              <p>ATV • UTV • Dune Buggies</p>
              <p className="font-semibold text-primary-foreground mt-1">Beach Rentals</p>
            </div>
          </Link>

          <Link href="/silverlake" 
            className="group relative flex flex-col overflow-hidden rounded-xl border border-white/20 bg-black/60 backdrop-blur-md text-white shadow-lg transition-all hover:scale-[1.02] hover:border-primary/80 hover:bg-black/80"
          >
            <div className="aspect-[4/3] bg-emerald-900/80 flex items-center justify-center group-hover:bg-emerald-800 transition-colors">
               <span className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter text-center drop-shadow-md">
                 Silver<br/>Lake
               </span>
            </div>
            <div className="p-4 bg-primary text-primary-foreground text-center font-bold tracking-widest text-sm uppercase">
              Michigan
            </div>
            <div className="p-4 flex-grow text-center text-sm text-gray-300">
              <p>ATV • UTV • Dune Buggies</p>
              <p className="font-semibold text-primary-foreground mt-1">Dune Rentals</p>
            </div>
          </Link>

        </div>
      </section>

      {/* Info Section */}
      <section className="w-full max-w-4xl px-4 py-12 space-y-12 text-lg leading-relaxed text-gray-100 z-10">
        
        <div className="bg-black/70 border-l-4 border-primary p-6 md:p-8 rounded-r-xl shadow-sm backdrop-blur-md">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            SUNBUGGY IS WHERE YOU GET TO DRIVE A REAL SPECIALIZED DUNE BUGGY!
          </h3>
          <p className="font-bold text-primary text-xl">
            (NO BS! They&apos;re not just store bought UTVs that we call dune buggies!!!)
          </p>
        </div>

        <div className="space-y-6 bg-black/40 p-6 rounded-xl backdrop-blur-sm">
          <p>
            <strong className="text-white">AS SEEN ON OVER 50 TV SHOWS AROUND THE WORLD!</strong> Don&apos;t be duped by wanna-bees...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-200">
          <div className="bg-black/60 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
            <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-3">
              <Users className="w-6 h-6 text-primary"/> Corporate Events
            </h4>
            <p>
              SunBuggy has the facilities to host amazing corporate events...
            </p>
          </div>
          <div className="bg-black/60 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
            <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-3">
              <Trophy className="w-6 h-6 text-primary"/> Best Service & Value
            </h4>
            <p>
              Our staff loves what we do and it shows...
            </p>
          </div>
        </div>

      </section>

      {/* Footer Nav */}
      <section className="w-full bg-black/80 border-t border-white/10 mt-8 z-10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h3 className="text-2xl font-bold uppercase mb-8 text-white">Choose Your Adventure</h3>
          <div className="flex flex-wrap justify-center gap-4">
             <Link href="/lasvegas">
                <span className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90">
                  Las Vegas, NV
                </span>
             </Link>
             <Link href="/pismo">
                <span className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90">
                  Pismo Beach, CA
                </span>
             </Link>
             <Link href="/silverlake">
                <span className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90">
                  Silver Lake, MI
                </span>
             </Link>
          </div>
        </div>
      </section>

    </main>
  );
}