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
  // Define the type of possible positions as a union of string literals
  type LocationKey = 'lasvegas' | 'pismo' | 'silverlake';
  
  const [position, setPosition] = React.useState<LocationKey | null>(null); // no default location selected

  const locations: Record<LocationKey, string> = {
    lasvegas: 'Las Vegas',
    pismo: 'Pismo',
    silverlake: 'Silverlake',
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="nav_head flex flex-col items-center text-xl font-bold cursor-pointer">
            SunBuggy
            <span className="text-sm font-normal">
              {position ? locations[position] : 'Choose location'}
            </span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="text-center w-full">
            Choose a Location
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup 
            value={position || ''} 
            onValueChange={(value) => setPosition(value as LocationKey)}
          >
            <Link href="/">
              <DropdownMenuRadioItem value="lasvegas">Las Vegas</DropdownMenuRadioItem>
            </Link>
            <Link href="https://www.sunbuggy.com/sunbuggy_pismo.php">
            <DropdownMenuRadioItem value="pismo">Pismo</DropdownMenuRadioItem>
            </Link>
            <Link href="https://www.sunbuggy.com/silverlake/">
            <DropdownMenuRadioItem value="silverlake">Silverlake</DropdownMenuRadioItem>
            </Link>            
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default Navhead;
