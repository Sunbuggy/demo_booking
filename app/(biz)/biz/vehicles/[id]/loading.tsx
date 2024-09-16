import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-[800px] space-y-5">
      <Skeleton className="w-full h-[446px]" />
    </div>
  );
}
