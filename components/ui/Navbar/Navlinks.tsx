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
import { UserNav } from '@/app/(biz)/biz/users/admin/tables/components/user-nav';
import { UserType } from '@/app/(biz)/biz/users/types';
import { usePathname } from 'next/navigation';
import { BarcodeScanner } from '@/components/qr-scanner/scanner';
import DialogFactory from '@/components/dialog-factory';
import React, { useEffect, useState } from 'react';
import { Button } from '../button';
import { User } from '@supabase/supabase-js';
import { MenuIcon } from 'lucide-react';

interface NavlinksProps {
  user: UserType | null;
  usr: User | null | undefined;
  status?: string | null | undefined;
  clockInTimeStamp?: string;
}

export default function Navlinks({
  user,
  usr,
  status,
  clockInTimeStamp
}: NavlinksProps) {
  const path = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // === HYDRATION FIX ===
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex justify-between">
      {/* Left Side: Logo with Sheet Drawer */}
      <div className="ml-5 flex gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <button aria-label="Menu" className="relative h-10 w-10 flex items-center justify-center">
              {/* Only render content once mounted to prevent hydration mismatch */}
              {mounted ? (
                <>
                  {/* Simplfied logic: One icon, CSS handles theme coloring */}
                  <MenuIcon size={40} className="text-black dark:text-white" />
                </>
              ) : (
                /* Placeholder during server-render to maintain layout height/width */
                <div className="w-10 h-10" />
              )}
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
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          title="QR Scanner"
          description="Scan a QR Code"
          disableCloseButton={true}
        >
          <BarcodeScanner user={usr} setIsDialogOpen={setIsDialogOpen} />
        </DialogFactory>

        {/* Conditional Rendering for User */}
        {user ? (
          <UserNav
            email={user.email}
            userInitials={user.full_name ? user.full_name[0] : 'U'}
            userImage={user.avatar_url}
            userName={user.full_name}
            status={status}
            user_id={user.id}
            clockInTimeStamp={clockInTimeStamp}
            user_level={user.user_level}
          />
        ) : (
          mounted && path && !path.includes('signin') && (
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