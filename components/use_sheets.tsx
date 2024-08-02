import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import React from 'react';
interface SheetComponentProps {
  children: React.ReactNode;
  triggerName: string;
  title: string;
  description: string;
  button_class?: string;
  assignedGroupsExist?: boolean;
}

export const SheetComponent: React.FC<SheetComponentProps> = ({
  children,
  triggerName,
  description,
  title,
  assignedGroupsExist,
  button_class = `p-0 items-start h-[1rem] underline ${assignedGroupsExist ? 'text-green-500' : 'text-red-500'}`
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className={button_class} variant="ghost">
          {triggerName}
        </Button>
      </SheetTrigger>
      <SheetContent side={'bottom'} className="text-center">
        <SheetHeader>
          <SheetTitle className="text-center">{title}</SheetTitle>
          <SheetDescription className="text-center">
            {description}
          </SheetDescription>
        </SheetHeader>
        {children}
        {/* <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
};
