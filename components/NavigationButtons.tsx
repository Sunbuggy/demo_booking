'use client';

import { Home, RotateCw } from 'lucide-react';
import Link from 'next/link';

export default function NavigationButtons() {
  return (
    <div className="fixed top-20 right-4 flex flex-col gap-2 md:flex-row md:gap-4">
      <Link
        href="/"
        className="p-2 bg-background/50 rounded-full hover:bg-background/80 transition-colors duration-200"
      >
        <Home className="w-5 h-5 text-foreground/50" />
        <span className="sr-only">Back Home</span>
      </Link>
      <button
        onClick={() => window.location.reload()}
        className="p-2 bg-background/50 rounded-full hover:bg-background/80 transition-colors duration-200"
      >
        <RotateCw className="w-5 h-5 text-foreground/50" />
        <span className="sr-only">Reload Page</span>
      </button>
    </div>
  );
}
