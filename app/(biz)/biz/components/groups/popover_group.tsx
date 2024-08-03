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
  openText: string;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size={'icon'}
          variant={'ghost'}
          className={`${openText === 'edit' ? 'text-lime-500' : openText === '+Add' ? 'text-green-500' : openText === 'delete' ? 'text-red-500' : ''} text-xs p-1 h-[1em]`}
        >
          {openText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">{children}</PopoverContent>
    </Popover>
  );
}
