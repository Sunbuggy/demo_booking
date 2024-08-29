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
          className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
        >
          Home
        </Link>
      </SheetClose>
      {user && user.user_level > 299 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              
              href={`/biz/${date}`}
              className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Internal
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              
              href="https://www.sunbuggy.biz/login.php"
              className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Old Biz
            </Link>
          </SheetClose>
        </div>
      )}
      {user && user.user_level > 899 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              
              href={`/biz/users/admin`}
              className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Admin
            </Link>
          </SheetClose>
        </div>
      )}
    </div>
  );
}
