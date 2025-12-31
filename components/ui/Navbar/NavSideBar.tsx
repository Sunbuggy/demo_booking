/**
 * @file /components/NavSideBar.tsx
 * @description Digitized navigation for SunBuggy. 
 * Implements strict role-based access control (RBAC) and modern Next.js 16 patterns.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ShieldCheck, Truck, Users, Calendar, ClipboardList } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes safely

/**
 * Technical Standard: User type with integer-based level.
 * 300: Internal Staff | 600: Manager | 900: Admin/Dev
 */
interface UserType {
  user_level: number;
}

interface NavLink {
  href: string;
  label: string;
  minLevel: number;
  icon?: React.ReactNode;
  external?: boolean;
}

interface NavSideBarProps {
  user: UserType | null;
}

export default function NavSideBar({ user }: NavSideBarProps) {
  const pathname = usePathname();

  // Primary Navigation Definitions
  const navLinks: NavLink[] = [
    { href: '/', label: 'Welcome', minLevel: 0 },
    { href: '/lasvegas', label: 'Las Vegas', minLevel: 0 },
    { href: '/pismo', label: 'Pismo Beach', minLevel: 0 },
    { href: '/pismo/book', label: 'Pismo Booking', minLevel: 0 },
    { href: '/biz/pismo-times', label: 'Pismo Times', minLevel: 600 },
    { href: '/biz/pismo-pricing', label: 'Pismo Pricing', minLevel: 600 },
    { href: 'https://www.sunbuggy.biz/', label: 'Old Biz Portal', minLevel: 300, external: true },
    { href: '/daily-pics', label: 'Daily Pics', minLevel: 300 },
    // Core Admin Links
    { href: '/biz/users/admin', label: 'User Admin', minLevel: 900 },
    { href: '/biz/payroll', label: 'Payroll', minLevel: 900 },
    { href: '/biz/reports', label: 'Reports', minLevel: 900 },
    { href: 'tel:+17752060022', label: 'Cyber Support', minLevel: 300 }
  ];

  // Fleet and Operations Specific Links
  const dashboardLinks: NavLink[] = [
    { href: `/biz/vegas`, label: 'NV DASH', minLevel: 300 },
    { href: `/biz/pismo`, label: 'CA DASH', minLevel: 300 },
    { href: `/biz/michigan`, label: 'MI DASH', minLevel: 300, external: true },
    { href: '/biz/my-schedule', label: 'My Schedule', minLevel: 300 },
    { href: '/biz/schedule', label: 'ROSTER', minLevel: 300 },
    { href: '/biz/vehicles/admin', label: 'Fleet Management', minLevel: 300 },
    { href: '/biz/sst', label: 'SST', minLevel: 300 },
    { href: '/biz/qr', label: 'QR Generator', minLevel: 300 },
    { href: '/biz/admin/charge_pismo', label: 'Pismo Billing', minLevel: 300 },
  ];

  /**
   * Refactor: Centralized rendering logic for nav buttons.
   * Handles active state tracking using Next.js usePathname.
   */
  const renderNavLink = (link: NavLink) => {
    const isActive = pathname === link.href;

    return (
      <SheetClose key={link.href} asChild>
        <Link
          href={link.href}
          className={cn(
            'flex items-center gap-3 border-2 rounded-md transition-all p-3 text-sm font-medium',
            isActive
              ? 'bg-orange-600 text-white border-orange-400 shadow-lg translate-x-1'
              : 'text-zinc-300 border-transparent hover:bg-zinc-800 hover:text-white',
          )}
          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link.icon && <span className="text-current">{link.icon}</span>}
          {link.label}
        </Link>
      </SheetClose>
    );
  };

  /**
   * Impact Analysis: Filters links by user level to ensure security and UI clarity.
   */
  const renderLinkGroup = (links: NavLink[], title: string, minLevelRequired: number) => {
    if (minLevelRequired > 0 && (!user || user.user_level < minLevelRequired)) return null;

    const filtered = links.filter(l => l.minLevel <= (user?.user_level ?? 0));
    if (filtered.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-[10px] font-bold text-orange-500/80 uppercase tracking-[0.2em] mb-3 px-1">
          {title}
        </h3>
        <div className="flex flex-col gap-1.5">{filtered.map(renderNavLink)}</div>
      </div>
    );
  };

  // Organizational Groups
  const publicLinks = navLinks.filter(l => l.minLevel === 0);
  const internalLinks = [...dashboardLinks, ...navLinks.filter(l => l.minLevel === 300)];
  const managerLinks = navLinks.filter(l => l.minLevel === 600);
  
  // Admin Group: Now including System Health
  const adminLinksWithHealth: NavLink[] = [
    { 
      href: '/biz/admin/health', 
      label: 'System Health', 
      minLevel: 900, 
      icon: <Activity size={16} /> 
    },
    ...navLinks.filter(l => l.minLevel === 900)
  ];

  return (
    <nav className="flex flex-col p-4 bg-zinc-950 h-full overflow-y-auto custom-scrollbar">
      {/* Visual Identity */}
      <div className="mb-10 px-2">
        <div className="text-xl font-black text-white italic tracking-tighter">
          SUN<span className="text-orange-500">BUGGY</span>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">FLOW_OS v2.4.12</div>
      </div>

      {renderLinkGroup(publicLinks, 'Adventure Guide', 0)}
      {renderLinkGroup(internalLinks, 'Staff Hub', 300)}
      {renderLinkGroup(managerLinks, 'Operations Management', 600)}
      {renderLinkGroup(adminLinksWithHealth, 'Infrastructure Control', 900)}

      {/* Footer Info */}
      <div className="mt-auto pt-6 border-t border-zinc-800/50 px-2">
        <div className="flex items-center gap-2 text-zinc-600 text-[10px]">
          <ShieldCheck size={12} />
          <span>Encrypted Session</span>
        </div>
      </div>
    </nav>
  );
}