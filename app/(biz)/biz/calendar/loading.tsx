import { Skeleton } from '@/components/ui/skeleton';

/**
 * @file loading.tsx
 * @description Semantic loading state for the page.
 * Updated: Semantic Theming Applied (v1.0)
 */

export default function Loading() {
  return (
    // SEMANTIC: 
    // 1. bg-background ensures the page is the correct color (White/Dark Gray) immediately.
    // 2. Flex centering keeps the loader in the middle of the viewport.
    <div className="flex h-screen w-full items-center justify-center bg-background p-4 md:p-8">
      
      {/* RESPONSIVE FIX:
         - Replaced fixed 'w-[1152px]' with 'w-full max-w-7xl' to prevent mobile overflow.
         - Replaced fixed 'h-[790px]' with 'h-[85vh]' to respect viewport height.
         - Added 'rounded-xl' to match the design language of Cards/Calendar.
      */}
      <Skeleton className="h-[85vh] w-full max-w-7xl rounded-xl" />
    </div>
  );
}