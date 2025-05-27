import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Trash2 } from 'lucide-react';

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
          variant={'ghost'}
          className={`${typeof openText !== 'string' ? 'text-red-500 hover:text-red-700' : 
                    openText === 'edit' ? 'text-lime-500' : 
                    openText === '+Add' ? 'text-green-500' : ''} 
                    text-xs p-1 h-[1em]`}
        >
          {openText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">{children}</PopoverContent>
    </Popover>
  );
}