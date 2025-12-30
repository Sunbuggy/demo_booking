'use client';

import Link from 'next/link';
import NavSideBar from './NavSideBar';
import Navhead from './Navhead';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
// --- REPLACED UserNav WITH NEW COMPONENT ---
import CurrentUserAvatar from '@/components/CurrentUserAvatar'; 
import { UserType } from '@/app/(biz)/biz/users/types';
import { usePathname } from 'next/navigation';
import { BarcodeScanner } from '@/components/qr-scanner/scanner';
import DialogFactory from '@/components/dialog-factory';
import React from 'react';
import { Button } from '../button';
import { User } from '@supabase/supabase-js';
import { MenuIcon } from 'lucide-react';

interface NavlinksProps {
  user: UserType | null;
  usr: User | null | undefined;
  // REMOVED: status & clockInTimeStamp are no longer needed here
}

export default function Navlinks({
  user,
  usr,
}: NavlinksProps) {
  const path = usePathname();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <div className="flex justify-between">
      {/* Left Side: Logo with Sheet Drawer */}
      <div className="ml-5 flex gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <button aria-label="Logo">
              <div className="hidden dark:block">
                <MenuIcon size={40} />
              </div>
              <div className="dark:hidden absolute pt-[5px] pl-[10px] transform -translate-y-1/2 block w-[50px] h-[38px] bg-transparent border-0 cursor-pointer z-[1000]">
                <MenuIcon size={40} className="text-black" />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="dark:bg-background flex flex-col h-full p-0"
          >
            <SheetHeader className="p-4 flex-shrink-0">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription></SheetDescription>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto">
              <NavSideBar user={user} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Center: Navigation Heading */}
      <div className="">
        <Navhead />
      </div>

      {/* Right Side: QR Scanner and User Nav */}
      <div className="flex justify-end items-center gap-4">
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={() => setIsDialogOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="orange"
            className="w-9 h-9"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </Button>
        <DialogFactory
          children={
            <BarcodeScanner user={usr} setIsDialogOpen={setIsDialogOpen} />
          }
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          title="QR Scanner"
          description="Scan a QR Code"
          disableCloseButton={true}
        />

        {/* Conditional Rendering for User */}
        {user ? (
          /* NEW: Replaced massive prop list with self-contained component */
          <CurrentUserAvatar />
        ) : (
          path &&
          !path.includes('signin') && (
            <Link
              href="/signin"
              className="inline-flex underline items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md h-[36px]"
            >
              Log In
            </Link>
          )
        )}
      </div>
    </div>
  );
}