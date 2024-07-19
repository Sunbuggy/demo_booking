'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import ThemeButton from '../mode-toggle';
import Image from 'next/image';
import { ImNewTab } from 'react-icons/im';

interface NavlinksProps {
  user?: any;
}
export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();
  const is_account_page = path === '/account';
  return (
    <div className=" flex  justify-between">
      <div className=" ml-5 flex gap-4">
        <Link href="/" aria-label="Logo">
          <div className="hidden dark:block">
            <Image
              src={`/sb-logo-circle-yellow.svg`}
              width={40}
              height={40}
              alt={`sunbuggy's logo`}
            />
          </div>
          <div className="dark:hidden">
            <Image
              src={`/sb-logo-circle-black.svg`}
              width={40}
              height={40}
              alt={`sunbuggy's logo`}
            />
          </div>
        </Link>
        {user && !is_account_page && (
          <div className="flex flex-col justify-center">
            <Link
              href="/account"
              target="_blank"
              className="cursor-pointer dark:text-yellow-500 text-black flex items-center"
            >
              Profile <ImNewTab />
            </Link>
          </div>
        )}
      </div>
      <div className="flex justify-end ">
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={usePathname()} />
            <button
              type="submit"
              className={`inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md p-1 h-[36px]`}
            >
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href="/signin"
            className={`inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md h-[36px] `}
          >
            Sign In
          </Link>
        )}
        <ThemeButton />
      </div>
    </div>
  );
}
