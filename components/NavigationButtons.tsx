'use client';

import { Home, RotateCw, ArrowLeft, Share } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ShareButton from './share-button';

export default function NavigationButtons() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBackClick = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed  top-20 left-1 flex  gap-2 z-40">
      <button
        onClick={handleBackClick}
        className="p-2 bg-background/50 rounded-full hover:bg-background/80 transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5 text-foreground/50" />
        <span className="sr-only">Go Back</span>
      </button>
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
      <ShareButton
        title="Share this page"
        text="Share this page with your friends"
        url={pathname}
      />
    </div>
  );
}
