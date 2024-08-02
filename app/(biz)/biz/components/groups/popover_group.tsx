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
          variant="ghost"
          size={'sm'}
          className={`${openText === 'edit' ? 'text-lime-500' : openText === '+Add' ? 'text-green-500' : 'text-red-500'}`}
        >
          {openText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">{children}</PopoverContent>
    </Popover>
  );
}
