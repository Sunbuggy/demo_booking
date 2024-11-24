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
    {
      href: 'https://www.sunbuggy.biz/',
      label: 'Old Biz',
      minLevel: 300,
      external: true
    },
    { href: '/biz/users/admin', label: 'User Admin', minLevel: 900 },
    {
      href: '/biz/reports',
      label: 'Reports',
      minLevel: 900,
      external: false
    }
  ];

  const dashboardLinks: NavLink[] = [
    { href: `/biz/${date}`, label: 'NV', minLevel: 300, external: false },
    {
      href: `https://fareharbor.com/sunbuggypismobeach/dashboard`,
      label: 'CA',
      minLevel: 300,
      external: true
    },
    {
      href: `https://fareharbor.com/sunbuggysilverlakedunes/dashboard`,
      label: 'MI',
      minLevel: 300,
      external: true
    },
    {
      href: '/biz/vehicles/admin',
      label: 'Fleet',
      minLevel: 300,
      external: false
    },

    {
      href: '/biz/sst',
      label: 'SST',
      minLevel: 300,
      external: false
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
              : 'hover:bg-zinc-800 dark:hover:bg-zinc-500',
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
    if (!user) return null;

    if (user?.user_level < minLevel) return null;
    const filteredLinks = links.filter(
      (link) => link.minLevel <= user?.user_level
    );
    if (filteredLinks.length === 0) return null;

    return (
      <React.Fragment key={title}>
        <span className="menulinks">{title}</span>
        {filteredLinks.map(renderNavLink)}
      </React.Fragment>
    );
  };

  const publicLinks = navLinks.filter((link) => link.minLevel === 0);
  const internalLinks = [
    ...dashboardLinks,
    ...navLinks.filter((link) => link.minLevel === 300)
  ];
  const adminLinks = navLinks.filter((link) => link.minLevel === 900);

  return (
    <div className="flex flex-col gap-3">
      {renderLinkGroup(publicLinks, 'PUBLIC', 0)}
      {user &&
        user.user_level >= 300 &&
        renderLinkGroup(internalLinks, 'INTERNAL', 300)}
      {user &&
        user.user_level >= 900 &&
        renderLinkGroup(adminLinks, 'ADMIN', 900)}
    </div>
  );
}
