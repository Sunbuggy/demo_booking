import { Skeleton } from '@/components/ui/skeleton';
export function SkeletonLoader() {
  return (
    <div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
export default function Loading() {
  return <SkeletonLoader />;
}
