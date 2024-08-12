import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

export function PopoverGroups({
  openText,
  children
}: {
  openText: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          // size={openText === 'Delete Group' ? 'sm' : 'icon'}
          variant={'ghost'}
          className={`${openText === 'edit' ? 'text-lime-500' : openText === '+Add' ? 'text-green-500' : openText === 'Delete Group' ? 'w-full bg-red-600 hover:text-black' : ''} text-xs p-1 h-[1em]`}
        >
          {openText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">{children}</PopoverContent>
    </Popover>
  );
}
