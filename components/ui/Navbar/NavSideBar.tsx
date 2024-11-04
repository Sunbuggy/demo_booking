'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface UserType {
  user_level: number;
}

interface NavLink {
  href: string;
  label: string;
  minLevel: number;
  external?: boolean;
}

interface NavSideBarProps {
  user: UserType | null;
}

export default function NavSideBar({ user }: NavSideBarProps) {
  const pathname = usePathname();
  const date = new Date().toLocaleDateString('en-CA');

  const navLinks: NavLink[] = [
    { href: '/', label: 'Home Page', minLevel: 0 },
    // { href: `/biz/${date}`, label: 'NV', minLevel: 300 },
    {
      href: 'https://www.sunbuggy.biz/',
      label: 'Old Biz',
      minLevel: 300,
      external: true
    },
    { href: '/biz/vehicles/admin', label: 'Vehicle Admin', minLevel: 300 },
    { href: '/biz/users/admin', label: 'User Admin', minLevel: 900 }
  ];

  const dashboardLinks: NavLink[] = [
    { href: `/biz/${date}`, label: 'NV', minLevel: 300, external: false },
    {
      href: `https://fareharbor.com/sunbuggypismobeach/dashboard`,
      label: 'CA',
      minLevel: 300
    },
    {
      href: `https://fareharbor.com/sunbuggysilverlakedunes/dashboard`,
      label: 'MI',
      minLevel: 300
    }
  ];

  const renderNavLink = (link: NavLink) => {
    const isActive = pathname === link.href;

    return (
      <SheetClose key={link.href} asChild>
        <Link
          href={link.href}
          className={cn(
            'white_button',
            'border-2 rounded-md transition-colors',
            isActive
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'hover:bg-zinc-800 dark:hover:bg-zinc-200',
            isActive && 'shadow-md'
          )}
          {...(link.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {link.label}
        </Link>
      </SheetClose>
    );
  };

  const renderLinkGroup = (
    links: NavLink[],
    title: string,
    minLevel: number
  ) => {
    if (!user || user.user_level < minLevel) return null;

    return (
      <React.Fragment key={title}>
        <span className="menulinks">{title}</span>
        {links.map(renderNavLink)}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {renderNavLink(navLinks[0])} {/* Home Page */}
      {renderLinkGroup(dashboardLinks, 'INTERNAL', 300)}
      {renderLinkGroup(
        navLinks.filter((link) => link.minLevel === 900),
        'ADMIN',
        900
      )}
    </div>
  );
}
