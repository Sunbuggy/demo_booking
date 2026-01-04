/**
 * @file /components/UI/Navbar/NavSideBar.tsx
 * @description Main Sidebar Navigation.
 * Updated: Added link to System Architecture Docs.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  ShieldCheck, 
  Users, 
  HeartPulse, 
  FileText, 
  Trash2,
  Car,
  BookOpen // <-- New Import for Docs Icon
} from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// --- Single Source of Truth ---
import { USER_LEVELS } from '@/lib/constants/user-levels';

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
  // Default to GUEST (0) if user is null
  const userLevel = user?.user_level ?? USER_LEVELS.GUEST;

  // --- 1. PUBLIC LINKS (Customer Facing) ---
  const publicLinks: NavLink[] = [
    { href: '/lasvegas', label: 'Las Vegas', minLevel: USER_LEVELS.GUEST },
    { href: '/pismo', label: 'Pismo Beach', minLevel: USER_LEVELS.GUEST },
    { href: '/silverlake', label: 'Silver Lake', minLevel: USER_LEVELS.GUEST },
    { href: '/pismo/book', label: 'Pismo Booking', minLevel: USER_LEVELS.GUEST },
  ];

  // --- 2. DASHBOARDS (Staff 300+) ---
  const dashboardLinks: NavLink[] = [
    { href: `/biz/vegas`, label: 'Las Vegas', minLevel: USER_LEVELS.STAFF },
    { href: `/biz/pismo`, label: 'Pismo Beach', minLevel: USER_LEVELS.STAFF },
    { href: `/biz/michigan`, label: 'Silver Lake', minLevel: USER_LEVELS.STAFF, external: true },
  ];

  // --- 3. STAFF HUB (General Tools 300+) ---
  const staffLinks: NavLink[] = [
    { href: '/biz/schedule', label: 'ROSTER', minLevel: USER_LEVELS.STAFF }, 
    { href: '/biz/vehicles/admin', label: 'Fleet Management', minLevel: USER_LEVELS.STAFF, icon: <Car size={16} /> },
    { href: '/daily-pics', label: 'Daily Pics', minLevel: USER_LEVELS.STAFF },
    { href: '/biz/sst', label: 'SST', minLevel: USER_LEVELS.STAFF },
    { href: '/biz/qr', label: 'QR Generator', minLevel: USER_LEVELS.STAFF },
    { href: 'https://www.sunbuggy.biz/', label: 'Old Biz Portal', minLevel: USER_LEVELS.STAFF, external: true },
    { href: 'tel:+17752060022', label: 'Cyber Support', minLevel: USER_LEVELS.STAFF },
  ];

  // --- 4. OPERATIONS MANAGEMENT (Managers 500+) ---
  const operationsLinks: NavLink[] = [
    { href: '/biz/reports', label: 'Reports', minLevel: USER_LEVELS.MANAGER, icon: <FileText size={16} /> },
    { href: '/biz/pismo-times', label: 'Pismo Times', minLevel: USER_LEVELS.MANAGER },
    { href: '/biz/pismo-pricing', label: 'Pismo Pricing', minLevel: USER_LEVELS.MANAGER },
    { href: '/biz/admin/charge_pismo', label: 'Pismo Billing', minLevel: USER_LEVELS.MANAGER },
  ];

  // --- 5. HR (Specific Role - Level 925+) ---
  const hrLinks: NavLink[] = [
     { href: '/biz/admin/hr/audit', label: 'Staff Audit', minLevel: USER_LEVELS.HR, icon: <HeartPulse size={16} className="text-red-600 dark:text-red-400" /> },
     { href: '/biz/admin/hr/user-cleanup', label: 'User Merge', minLevel: USER_LEVELS.HR, icon: <Trash2 size={16} className="text-red-600 dark:text-red-400" /> },
     { href: '/biz/payroll', label: 'Payroll', minLevel: USER_LEVELS.HR },
     { href: '/biz/users/admin', label: 'User Admin', minLevel: USER_LEVELS.HR, icon: <Users size={16} /> },
  ];

  // --- 6. DEVELOPER (Level 950+) ---
  const devLinks: NavLink[] = [
    { href: '/biz/admin/health', label: 'System Health', minLevel: USER_LEVELS.DEV, icon: <Activity size={16} className="text-green-600 dark:text-green-400" /> },
    // NEW LINK: System Architecture & Living Docs
    { href: '/biz/admin/developer/docs', label: 'System Architecture', minLevel: USER_LEVELS.DEV, icon: <BookOpen size={16} className="text-blue-500 dark:text-blue-400" /> },
  ];

  /**
   * Renders a single navigation link.
   */
  const renderNavLink = (link: NavLink, isPublicGroup: boolean) => {
    const isActive = pathname === link.href;

    // --- STYLING LOGIC ---
    // 1. PUBLIC LINKS (Primary Blue)
    const publicActive = 
      'bg-blue-100 text-blue-900 border-blue-500 shadow-sm font-bold ' + 
      'dark:bg-blue-600 dark:text-white dark:border-blue-400 dark:shadow-md'; 

    const publicInactive = 
      'text-blue-700 border-transparent hover:bg-blue-50 hover:text-blue-900 ' + 
      'dark:text-blue-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-200'; 

    // 2. STAFF LINKS (Orange/Zinc)
    const staffActive = 
      'bg-orange-600 text-white border-orange-500 shadow-md translate-x-1 font-bold'; 

    const staffInactive = 
      'text-zinc-700 border-transparent hover:bg-zinc-100 hover:text-zinc-900 ' + 
      'dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'; 

    return (
      <SheetClose key={link.href} asChild>
        <Link
          href={link.href}
          className={cn(
            'flex items-center gap-3 border rounded-md transition-all duration-200 p-2.5 text-sm font-semibold',
            isPublicGroup 
              ? (isActive ? publicActive : publicInactive)
              : (isActive ? staffActive : staffInactive)
          )}
          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link.icon && <span className="opacity-80">{link.icon}</span>}
          {link.label}
        </Link>
      </SheetClose>
    );
  };

  /**
   * Renders a group of links with a section header.
   */
  const renderLinkGroup = (links: NavLink[], title: string, minLevelRequired: number, isPublicGroup = false) => {
    // Basic Access Check
    if (minLevelRequired > USER_LEVELS.GUEST && userLevel < minLevelRequired) return null;
    
    // Detailed Filter (e.g. if a specific link inside a group requires higher access)
    const filtered = links.filter(l => l.minLevel <= userLevel);
    if (filtered.length === 0) return null;

    // Header Color Logic
    let headerClass = "text-orange-600 dark:text-orange-500/80";
    
    if (isPublicGroup) {
      headerClass = "text-blue-700 dark:text-blue-400 hover:text-blue-500 transition-colors cursor-pointer";
    }
    else if (minLevelRequired >= USER_LEVELS.DEV) {
      headerClass = "text-green-700 dark:text-green-500/80";
    }
    else if (minLevelRequired >= USER_LEVELS.ADMIN) {
      headerClass = "text-red-700 dark:text-red-500/80";
    }

    return (
      <div className="mb-6">
        {isPublicGroup ? (
           <SheetClose asChild>
             <Link href="/">
               <h3 className={cn("text-[13px] font-black uppercase tracking-[0.1em] mb-2 px-1 flex items-center gap-2", headerClass)}>
                 {title} 
               </h3>
             </Link>
           </SheetClose>
        ) : (
           <h3 className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-2 px-1", headerClass)}>
             {title}
           </h3>
        )}
        <div className="flex flex-col gap-1">{filtered.map(l => renderNavLink(l, isPublicGroup))}</div>
      </div>
    );
  };

  return (
    <nav className="flex flex-col p-4 h-full overflow-y-auto custom-scrollbar border-r 
      bg-white border-zinc-200 
      dark:bg-zinc-950 dark:border-zinc-900">
      
      {/* BRANDING */}
      <div className="mb-8 px-2">
        <div 
          className="text-3xl tracking-wider select-none text-yellow-500"
          style={{ 
            fontFamily: "'Banco', 'Arial Black', sans-serif",
            fontWeight: 'bold',
          }}
        >
          <span className="light-mode-stroke">SUNBUGGY</span>
        </div>
        
        <style jsx>{`
          .light-mode-stroke {
             color: #FACC15; 
          }
          :global(.light) .light-mode-stroke, 
          :global(html:not(.dark)) .light-mode-stroke {
             -webkit-text-stroke: 0.5px black;
             color: #FACC15;
          }
        `}</style>
      </div>

      {/* 1. WELCOME (Public Group) */}
      {renderLinkGroup(publicLinks, 'WELCOME', USER_LEVELS.GUEST, true)}

      {/* SEPARATOR */}
      <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/50" />

      {/* 2. STAFF DASHBOARDS */}
      {renderLinkGroup(dashboardLinks, 'Dashboards', USER_LEVELS.STAFF)}

      {/* 3. STAFF HUB */}
      {renderLinkGroup(staffLinks, 'Staff Hub', USER_LEVELS.STAFF)}

      {/* 4. OPERATIONS */}
      {renderLinkGroup(operationsLinks, 'Operations', USER_LEVELS.MANAGER)}

      {/* 5. HR */}
      {renderLinkGroup(hrLinks, 'Human Resources', USER_LEVELS.HR)}

      {/* 6. DEV */}
      <div className="mt-auto">
        {renderLinkGroup(devLinks, 'Developer Tools', USER_LEVELS.DEV)}
      </div>

      {/* FOOTER */}
      <div className="pt-4 border-t mt-4 px-2 border-zinc-200 dark:border-zinc-900">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-600">
          <ShieldCheck size={12} />
          <span>Encrypted Session</span>
        </div>
      </div>
    </nav>
  );
}