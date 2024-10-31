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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LocationKey = 'lasvegas' | 'pismo' | 'silverlake';

const Navhead = () => {
  const [position, setPosition] = useState<LocationKey | null>(null);
  const [userLevel, setUserLevel] = useState<number | null>(null);

  // Fetch user level from API on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/userData');
        const data = await response.json();
        setUserLevel(data.userLevel);
      } catch (error) {
        console.error('Error fetching user level:', error);
      }
    };

    fetchUserData();
  }, []);

  const locations: Record<LocationKey, string> = {
    lasvegas: 'Las Vegas',
    pismo: 'Pismo',
    silverlake: 'Silverlake',
  };

  // Define dropdown links based on user level
  const dropdownLinks = [
    { value: 'lasvegas' as LocationKey, link: '/' },
    userLevel && userLevel > 300
      ? { value: 'pismo' as LocationKey, link: 'https://www.sunbuggy.com/Pismo_/makereservation24.php' }
      : { value: 'pismo' as LocationKey, link: 'https://fareharbor.com/sunbuggypismobeach/dashboard' },
    userLevel && userLevel > 300
      ? { value: 'silverlake' as LocationKey, link: 'https://fareharbor.com/embeds/book/sunbuggysilverlakedunes/items/?full-items=yes&back=https://www.sunbuggy.com/silverlake/&g4=yes' }
      : { value: 'silverlake' as LocationKey, link: 'https://fareharbor.com/sunbuggysilverlakedunes/dashboard' },
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
