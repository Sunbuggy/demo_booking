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
    { value: 'lasvegas' as LocationKey, link: '/lasvegas' },
    // { value: 'pismo' as LocationKey, link: 'https://fareharbor.com/sunbuggypismobeach/dashboard' },
    { value: 'pismo' as LocationKey, link: '/pismo' },
    { value: 'silverlake' as LocationKey, link: '/silverlake' }

    // { value: 'silverlake' as LocationKey, link: 'https://fareharbor.com/sunbuggysilverlakedunes/dashboard' },
  ];

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Kept flex-col for vertical stacking to maintain readability, but reduced sizes to prevent overflow and fit shorter navbar. */}
          {/* Title: text-xl to text-lg; subtitle: text-sm to text-xs. leading-tight minimizes line height between lines. */}
          {/* Removed items-center (defaults to flex-start) to tighten vertical space. If profile icon is still off-page, this ensures Navhead takes minimal height. */}
          <button className="nav_head flex flex-col text-lg font-bold cursor-pointer leading-tight">
            SunBuggy
            <span className="text-xs font-normal leading-tight">
              {position ? locations[position] : 'Choose a location'}
            </span>
          </button>
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
              <Link href={link.link} key={link.value}>
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