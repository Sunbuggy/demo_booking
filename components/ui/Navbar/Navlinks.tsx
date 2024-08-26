'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import ThemeButton from '../mode-toggle';
import Image from 'next/image';
import { ImNewTab } from 'react-icons/im';
import NavSideBar from './NavSideBar';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';

interface NavlinksProps {
  user?: any;
  role: number | null; // Role will be passed as a prop
}

export default function Navlinks({ user, role }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();
  const is_account_page = path === '/account';

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
            {/* Pass the role to the NavSideBar component */}
            <NavSideBar role={role} />
          </SheetContent>
        </Sheet>

        {user && !is_account_page && (
          <div className="flex flex-col justify-center">
            <Link
              target="_blank"
              href="/account"
              className="cursor-pointer dark:text-yellow-500 text-black flex items-center"
            >
              Profile <ImNewTab />
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-end">
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
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={usePathname()} />
            <button
              type="submit"
              className="inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md p-1 h-[36px]"
            >
              Sign out
            </button>
          </form>
        ) : (
          <Link
            target="_blank"
            href="/signin"
            className="inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md h-[36px]"
          >
            Sign In
          </Link>
        )}
        <ThemeButton />
      </div>
    </div>
  );
}