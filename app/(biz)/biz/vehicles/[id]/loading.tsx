import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-[800px] space-y-5">
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="w-[180px] h-[80px]" />
        ))}
      </div>
      <Skeleton className="w-full h-[400px]" />
    </div>
  );
}
