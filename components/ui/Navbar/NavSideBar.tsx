import React from 'react';
import Link from 'next/link';
import { SheetClose } from '../sheet';
import { UserType } from '@/app/(biz)/biz/users/types';

interface NavSideBarProps {
  user: UserType | null; // Updated to receive the user object or null
}

export default function NavSideBar({ user }: NavSideBarProps) {
  const date = new Date().toLocaleDateString('en-CA'); // 'en-CA' format is 'YYYY-MM-DD'

  return (
    <div className="flex flex-col gap-3">
      <SheetClose asChild>
        <Link
          href="/"
          className="border-2 bg-primary p-2 rounded-md white_button transition duration-150 ease-in-out"
        >
          Home Page
        </Link>
      </SheetClose>
      {user && user.user_level > 299 && (
        <span className="menulinks">INTERNAL</span>
      )}
      {user && user.user_level > 299 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              href={`/biz/${date}`}
              className="border-2 bg-primary p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Board View
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              href="https://www.sunbuggy.biz/"
              target="_blank"
              className="border-2 bg-primary p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Old Biz
            </Link>
          </SheetClose>
        </div>
      )}
      {user && user.user_level > 899 && (
        <span className="menulinks">ADMIN</span>
      )}
      {user && user.user_level > 899 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              href={`/biz/users/admin`}
              className="border-2 bg-primary p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              User Admin
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href={`/biz/vehicles/admin`}
              className="border-2 bg-primary p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Vehicle Admin
            </Link>
          </SheetClose>
        </div>
      )}
    </div>
  );
}
