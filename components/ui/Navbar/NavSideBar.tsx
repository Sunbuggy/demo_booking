import React from 'react';
import Link from 'next/link';
import { SheetClose } from '../sheet';

interface NavSideBarProps {
  role: number | null;
}

export default function NavSideBar({ role }: NavSideBarProps) {
  const date = new Date().toLocaleDateString('en-CA'); // 'en-CA' format is 'YYYY-MM-DD'

  return (
    <div className="flex flex-col gap-3">
      <SheetClose asChild>
        <Link
          target="_blank"
          href="/"
          className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
        >
          Home
        </Link>
      </SheetClose>
      {role && role > 299 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              target="_blank"
              href={`/biz/${date}`}
              className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Internal
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              target="_blank"
              href="https://www.sunbuggy.biz/login.php"
              className="border-2 p-2 rounded-md white_button transition duration-150 ease-in-out"
            >
              Old Biz
            </Link>
          </SheetClose>
        </div>
      )}
      {role && role > 899 && (
        <div className="flex flex-col gap-3">
          <SheetClose asChild>
            <Link
              target="_blank"
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
