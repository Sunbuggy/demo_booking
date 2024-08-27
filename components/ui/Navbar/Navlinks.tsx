'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import ThemeButton from '../mode-toggle';
import Image from 'next/image';
import NavSideBar from './NavSideBar';
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

interface NavlinksProps {
  user: UserType | null; 
}

export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();

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
