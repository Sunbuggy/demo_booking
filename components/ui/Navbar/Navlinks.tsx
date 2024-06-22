'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import s from './Navbar.module.css';
import ThemeButton from '../mode-toggle';
import Image from 'next/image';

interface NavlinksProps {
  user?: any;
}
export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();

  return (
    <div className="relative flex flex-row justify-between py-4 align-center md:py-6">
      <div className="flex items-center flex-1">
        <Link href="/" className={s.logo} aria-label="Logo">
          <div className="hidden dark:block">
            <Image
              src={`/sb-logo-circle-yellow.svg`}
              width={64}
              height={64}
              alt={`sunbuggy's logo`}
            />
          </div>
          <div className="dark:hidden">
            <Image
              src={`/sb-logo-circle-black.svg`}
              width={64}
              height={64}
              alt={`sunbuggy's logo`}
            />
          </div>
        </Link>
        <nav className="ml-6 space-x-2 lg:block">
          {user && path !== '/account' && (
            <Link href="/account" className={s.link}>
              Account
            </Link>
          )}
        </nav>
      </div>
      <div className="flex justify-end space-x-8">
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={usePathname()} />
            <button type="submit" className={s.link}>
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/signin" className={s.link}>
            Sign In
          </Link>
        )}
        <ThemeButton />
      </div>
    </div>
  );
}
