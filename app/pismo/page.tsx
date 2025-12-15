// app/pismo/page.tsx - Pismo Landing / Info Page
'use client';

import Link from 'next/link';

export default function PismoLanding() {
  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-6xl font-bold text-center mb-12 text-orange-500">
        Pismo Beach Dune Buggy Adventures
      </h1>

      {/* Add photos, descriptions, pricing tiers, etc. */}

      <div className="text-center mt-20">
        <Link
          href="/pismo/book"
          className="inline-block bg-orange-600 hover:bg-orange-700 px-16 py-8 rounded-2xl text-4xl font-bold transition"
        >
          Book Your Ride Now
        </Link>
      </div>
    </div>
  );
}