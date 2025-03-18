import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

export function PopoverGroupEdit({
  openText,
  children
}: {
  openText: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'ghost'}
          className="text-lime-500 flex flex-wrap pt-0 items-start h-fit"
        >
          {openText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">{children}</PopoverContent>
    </Popover>
  );
}
