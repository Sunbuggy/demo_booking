import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 w-[375px]">
      <div className="flex w-full justify-center items-center">
        <Skeleton className="w-[140px] h-[40px]" />
      </div>
      <Skeleton className="w-[384px] h-[66px]" />
      <Skeleton className="w-[384px] h-[660px]" />
    </div>
  );
}
