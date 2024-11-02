'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type LocationKey = 'lasvegas' | 'pismo' | 'silverlake';

const Navhead = () => {
  const [position, setPosition] = useState<LocationKey | null>(null);

  const locations: Record<LocationKey, string> = {
    lasvegas: 'Las Vegas',
    pismo: 'Pismo',
    silverlake: 'Silverlake'
  };

  // Define dropdown links based on user level
  const dropdownLinks = [
    { value: 'lasvegas' as LocationKey, link: '/' },
    // { value: 'pismo' as LocationKey, link: 'https://fareharbor.com/sunbuggypismobeach/dashboard' },
    { value: 'pismo' as LocationKey, link: '/location/pismo' },
    { value: 'silverlake' as LocationKey, link: '/location/silverlake' }

    // { value: 'silverlake' as LocationKey, link: 'https://fareharbor.com/sunbuggysilverlakedunes/dashboard' },
  ];

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="nav_head flex flex-col items-center text-xl font-bold cursor-pointer">
            SunBuggy
            <span className="text-sm font-normal">
              {position ? locations[position] : 'Choose a location'}
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
            {dropdownLinks.map((link) => (
              <Link href={link.link} key={link.value} target="_blank">
                <DropdownMenuRadioItem value={link.value}>
                  {locations[link.value as LocationKey]}
                </DropdownMenuRadioItem>
              </Link>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Navhead;
