'use client';

import React from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

function Navhead() {
  const [position, setPosition] = React.useState('bottom');

  return (
    <div className="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Span acting as dropdown trigger */}
          <span className="nav_head flex items-center text-xl font-bold cursor-pointer">
            SunBuggy
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="text-center w-full">Choose a Location</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
            <Link href="/"> 
              <DropdownMenuRadioItem value="lasvegas">Las Vegas</DropdownMenuRadioItem>
            </Link>
            <DropdownMenuRadioItem value="pismo">Pismo</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="silverlake">Silverlake</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default Navhead;
