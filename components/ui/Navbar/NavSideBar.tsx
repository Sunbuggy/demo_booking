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
  title?: string;
  minLevel: number;
  external?: boolean;
}

interface NavSideBarProps {
  user: UserType | null;
}

export default function NavSideBar({ user }: NavSideBarProps) {
  const pathname = usePathname();

  const navLinks: NavLink[] = [
    { href: '/', label: 'Welcome', minLevel: 0 },
    { href: '/lasvegas', label: 'Las Vegas', minLevel: 0 },
    { href: '/pismo', label: 'Pismo Beach', minLevel: 0 },
    { href: '/pismo/book', label: 'Pismo Booking', minLevel: 0 },
    { href: '/biz/pismo-times', label: 'Pismo Times', minLevel: 600 },
    { href: '/biz/pismo-pricing', label: 'Pismo Pricing', minLevel: 600 },
    {
      href: 'https://www.sunbuggy.biz/',
      label: 'Old Biz',
      minLevel: 300,
      external: true
    },
    {
      href: '/daily-pics',
      label: 'Daily Pics',
      minLevel: 300,
    },
    { href: '/biz/users/admin', label: 'User Admin', minLevel: 900 },
    { href: '/biz/payroll', label: 'Payroll', minLevel: 900 },
    {
      href: '/biz/reports',
      label: 'Reports',
      minLevel: 900,
    },
    {
      href: 'tel:+17752060022',
      label: 'Cyber Support: (775) 206-0022',
      minLevel: 300,
    }
  ];

  const dashboardLinks: NavLink[] = [
    // --- NEW BUTTON ADDED HERE ---
    
    // -----------------------------
    { href: `/biz/vegas`, label: 'NV', minLevel: 300 },
    {
      href: `/biz/pismo`,
      label: 'CA',
      minLevel: 300,
    },
    {
      href: `/biz/michigan`,
      label: 'MI',
      minLevel: 300,
      external: true
    },
    { 
      href: '/biz/my-schedule', 
      label: 'My Schedule', 
      minLevel: 300 
    },
    { href: '/biz/schedule', label: 'All Schedule', minLevel: 300 },
    {
      href: '/biz/vehicles/admin',
      label: 'Fleet',
      minLevel: 300,
    },
    {
      href: '/biz/sst',
      label: 'SST',
      minLevel: 300,
    },
    {
      href: '/biz/qr',
      label: 'QR Generator',
      minLevel: 300,
    },
    {
      href: '/biz/admin/charge_pismo',
      label: 'Pismo Charge',
      minLevel: 300,
    },
  ];

  const renderNavLink = (link: NavLink) => {
    const isActive = pathname === link.href;

    return (
      <SheetClose key={link.href} asChild>
        <Link
          href={link.href}
          className={cn(
            'white_button',
            'border-2 rounded-md transition-colors p-2 block mr-1',
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

  // Render a group of links - only if the user has sufficient level (or minLevel 0)
  const renderLinkGroup = (
    links: NavLink[],
    title: string,
    minLevelRequired: number
  ) => {
    // Public links (minLevel 0) are always shown
    // Protected links only shown if user exists and has enough level
    if (minLevelRequired > 0 && (!user || user.user_level < minLevelRequired)) {
      return null;
    }

    const filteredLinks = links.filter(
      (link) => link.minLevel <= (user?.user_level ?? 0)
    );

    if (filteredLinks.length === 0) return null;

    return (
      <div key={title} className="mb-6">
        <span className="menulinks mb-2 block text-sm font-semibold text-orange-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="space-y-2">{filteredLinks.map(renderNavLink)}</div>
      </div>
    );
  };

  // Group definitions
  const publicLinks = navLinks.filter((link) => link.minLevel === 0);

  const internalLinks = [
    ...dashboardLinks,
    ...navLinks.filter((link) => link.minLevel === 300)
  ];

  const managerLinks = navLinks.filter((link) => link.minLevel === 600);

  const adminLinks = navLinks.filter((link) => link.minLevel === 900);

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {/* PUBLIC - Always visible, even for guests */}
      {renderLinkGroup(publicLinks, 'PUBLIC', 0)}

      {/* INTERNAL - Requires login + level 300+ */}
      {renderLinkGroup(internalLinks, 'INTERNAL', 300)}

      {/* MANAGER - Level 600+ */}
      {renderLinkGroup(managerLinks, 'MANAGER', 600)}

      {/* ADMIN - Level 900+ */}
      {renderLinkGroup(adminLinks, 'ADMIN', 900)}
    </div>
  );
}