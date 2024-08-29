'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import Image from 'next/image';
import NavSideBar from './NavSideBar';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { UserNav } from '@/app/(biz)/biz/users/admin/tables/components/user-nav';
import { UserType } from '@/app/(biz)/biz/users/types';
import QrCodeScanner from '../qrscanner'; 
import CaptureImage from '../Camera/CaptureImage';
import { useState } from 'react';

interface NavlinksProps {
  user: UserType | null;
}

export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (image: string) => {
    setCapturedImage(image);
  };

  return (
    <div className="flex justify-between">
      <div className="ml-5 flex gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <button aria-label="Logo">
              <div className="hidden dark:block">
                <Image
                  src={`/sb-logo-circle-yellow.svg`}
                  width={40}
                  height={40}
                  alt={`sunbuggy's logo`}
                  className="animate-pulse"
                />
              </div>
              <div className="dark:hidden absolute pt-[5px] pl-[10px] transform -translate-y-1/2 block w-[50px] h-[38px] bg-transparent border-0 cursor-pointer z-[1000]">
                <Image
                  src={`/sb-logo-circle-black.svg`}
                  width={40}
                  height={40}
                  alt={`sunbuggy's logo`}
                />
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription></SheetDescription>
            </SheetHeader>
            <NavSideBar user={user} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex justify-end items-center gap-4">
        {/* Capture Image */}
        {/* <Sheet>
          <SheetTrigger asChild>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="red"
                className="w-9 h-9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </a>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Picture</SheetTitle>
              <SheetDescription>Take Pic</SheetDescription>
            </SheetHeader>
            {capturedImage ? (
              <div className="text-center">
                <h3>Captured Image:</h3>
                <img src={capturedImage} alt="Captured" className="mx-auto my-4 border border-gray-300" />
                <button
                  className="m-4 rounded border-0 bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 focus:outline-none"
                  onClick={() => setCapturedImage(null)}
                >
                  Retake Picture
                </button>
              </div>
            ) : (
              <CaptureImage onCapture={handleCapture} />
            )}
          </SheetContent>
        </Sheet> */}

{/* qr */}
        <Sheet>
          <SheetTrigger asChild>
            <a>
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
            </a>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>QR Scanner</SheetTitle>
              <SheetDescription>Scan a QR Code</SheetDescription>
            </SheetHeader>
            <QrCodeScanner/>
          </SheetContent>
        </Sheet>
        {user ? (
          <>
            <UserNav
              email={user.email}
              userInitials={user.full_name[0]}
              userImage={user.avatar_url}
              userName={user.full_name}
            />
          </>
        ) : (
          <Link
            
            href="/signin"
            className="inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md h-[36px]"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

