'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SheetClose } from '../sheet';
import { UserType } from '@/app/(biz)/biz/users/types';

interface NavSideBarProps {
  user: UserType | null;
}

export default function NavSideBar({ user }: NavSideBarProps) {
  const pathname = usePathname();
  const date = new Date().toLocaleDateString('en-CA');

  const navLinks = [
    { href: '/', label: 'Home Page', minLevel: 0 },
    { href: `/biz/${date}`, label: 'Today', minLevel: 300 },
    {
      href: 'https://www.sunbuggy.biz/',
      label: 'Old Biz',
      minLevel: 300,
      external: true
    },
    { href: '/biz/vehicles/admin', label: 'Vehicle Admin', minLevel: 300 },
    { href: '/biz/users/admin', label: 'User Admin', minLevel: 900 }
  ];

  const renderNavLink = (link: (typeof navLinks)[0]) => {
    if (pathname === link.href) return null; // Don't render the link for the current page

    return (
      <SheetClose key={link.href} asChild>
        <Link
          href={link.href}
          className="border-2 bg-primary p-2 rounded-md white_button transition duration-150 ease-in-out"
          {...(link.external ? { target: '_blank' } : {})}
        >
          {link.label}
        </Link>
      </SheetClose>
    );
  };

  let hasRenderedInternal = false;
  let hasRenderedAdmin = false;

  return (
    <div className="flex flex-col gap-3">
      {navLinks.map((link) => {
        if (!user || user.user_level < link.minLevel) return null;

        if (
          link.minLevel === 300 &&
          user.user_level >= 300 &&
          !hasRenderedInternal
        ) {
          hasRenderedInternal = true;
          return (
            <React.Fragment key={link.href}>
              <span className="menulinks">INTERNAL</span>
              {renderNavLink(link)}
            </React.Fragment>
          );
        }

        if (
          link.minLevel === 900 &&
          user.user_level >= 900 &&
          !hasRenderedAdmin
        ) {
          hasRenderedAdmin = true;
          return (
            <React.Fragment key={link.href}>
              <span className="menulinks">ADMIN</span>
              {renderNavLink(link)}
            </React.Fragment>
          );
        }

        return renderNavLink(link);
      })}
    </div>
  );
}
