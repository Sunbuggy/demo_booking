/**
 * @file components/fleet/vehicle-status-avatar.tsx
 * @description The "Identity" component for vehicles.
 * FEATURES:
 * - Uses Popover (Click interaction)
 * - Uses LocationCell (Interactive Map Pill)
 * - Uses FleetIcon (Dynamic System)
 * - Displays S3 Profile Pictures
 */
'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  XCircle,
  Ghost, 
  Fuel   
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FleetIcon } from './FleetIconProvider'; 
import { LocationCell } from './LocationCell';     

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const getStatusConfig = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'fine':
      return { 
        color: 'bg-green-500', 
        icon: CheckCircle2, 
        label: 'Operational', 
        border: 'border-green-500/20', 
        bg: 'bg-green-500/10', 
        text: 'text-green-600 dark:text-green-400' 
      };
    case 'broken':
      return { 
        color: 'bg-red-500', 
        icon: XCircle, 
        label: 'Out Of Service', 
        border: 'border-red-500/20', 
        bg: 'bg-red-500/10', 
        text: 'text-red-600 dark:text-red-400' 
      };
    case 'maintenance':
      return { 
        color: 'bg-amber-500', 
        icon: Wrench, 
        label: 'Maintenance', 
        border: 'border-amber-500/20', 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-600 dark:text-amber-400' 
      };
    case 'former':
      return { 
        color: 'bg-slate-400', 
        icon: Ghost, 
        label: 'Decommissioned', 
        border: 'border-slate-500/20', 
        bg: 'bg-slate-500/10', 
        text: 'text-slate-500' 
      };
    default:
      return { 
        color: 'bg-slate-300', 
        icon: History, 
        label: 'Unknown', 
        border: 'border-slate-500/20', 
        bg: 'bg-slate-500/10', 
        text: 'text-slate-500' 
      };
  }
};

interface VehicleStatusAvatarProps {
  vehicle: {
    id: string;
    name: string;
    pet_name?: string | null;
    type?: string;
    vehicle_status?: string;
    profile_pic_url?: string | null; 
    location_name?: string;          
    latitude?: number | null;        
    longitude?: number | null;       
    fuel_level?: string | number;    
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusDot?: boolean;
  className?: string;
}

export default function VehicleStatusAvatar({
  vehicle,
  size = 'md',
  showStatusDot = true,
  className
}: VehicleStatusAvatarProps) {
  
  const [isOpen, setIsOpen] = useState(false);
  const statusConfig = getStatusConfig(vehicle.vehicle_status);
  const StatusIcon = statusConfig.icon;

  // Dimensions
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn("relative group cursor-pointer inline-block", className)}
          onClick={(e) => e.stopPropagation()} // Prevent row clicks
        >
          <Avatar className={cn(
            "border-2 transition-all bg-slate-100 dark:bg-zinc-800",
            // Dynamic Border Color
            vehicle.vehicle_status === 'broken' ? 'border-red-200 dark:border-red-900/50' : 
            vehicle.vehicle_status === 'maintenance' ? 'border-amber-200 dark:border-amber-900/50' : 
            'border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600',
            sizeClasses[size]
          )}>
            {vehicle.profile_pic_url ? (
              <AvatarImage 
                src={vehicle.profile_pic_url} 
                alt={vehicle.name} 
                className="object-cover" 
              />
            ) : (
              <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                 <FleetIcon type={vehicle.type} className={cn("text-slate-400", iconSizes[size])} />
              </AvatarFallback>
            )}
          </Avatar>
          
          {showStatusDot && (
            <span className={cn(
              "absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-zinc-950", 
              statusConfig.color,
              (size === 'lg' || size === 'xl') ? 'w-5 h-5' : 'w-2.5 h-2.5'
            )} />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl" align="start">
        
        {/* HEADER SECTION */}
        <div className="p-4 flex gap-4 items-start bg-slate-50 dark:bg-zinc-900/50">
           <Avatar className="h-16 w-16 border-2 border-white dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
            {vehicle.profile_pic_url ? (
               <AvatarImage src={vehicle.profile_pic_url} className="object-cover" />
            ) : (
               <AvatarFallback className="bg-slate-100 dark:bg-zinc-800">
                  <FleetIcon type={vehicle.type} className="w-8 h-8 text-slate-400" />
               </AvatarFallback>
            )}
           </Avatar>
           <div className="space-y-1.5 min-w-0 flex-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-none truncate">
                {vehicle.pet_name || vehicle.name}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
                  #{vehicle.name}
                </span>
                
                {/* --- LOCATION PILL --- */}
                <LocationCell 
                  name={vehicle.location_name || 'Unknown'}
                  lat={vehicle.latitude}
                  lng={vehicle.longitude}
                  className="text-[10px] py-0.5 px-2 bg-white dark:bg-zinc-900"
                />
              </div>
           </div>
        </div>

        {/* STATUS BANNER */}
        <div className={cn("px-4 py-2 flex items-center justify-between border-y dark:border-zinc-800", statusConfig.bg, statusConfig.border)}>
           <div className="flex items-center gap-2">
             <StatusIcon className={cn("w-4 h-4", statusConfig.text)} />
             <span className={cn("text-xs font-bold uppercase tracking-wider", statusConfig.text)}>
               {statusConfig.label}
             </span>
           </div>
           
           {vehicle.fuel_level && (
             <span className="flex items-center gap-1.5 text-xs font-mono font-medium opacity-80 text-slate-700 dark:text-slate-300">
               <Fuel className="w-3.5 h-3.5" />
               {vehicle.fuel_level}%
             </span>
           )}
        </div>

        {/* ACTION LINKS */}
        <div className="p-2 grid grid-cols-2 gap-2 bg-white dark:bg-zinc-950">
           <Link href={`/biz/vehicles/${vehicle.id}`} className="w-full">
             <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20">
               <FileText size={14} />
               Vehicle Details
             </Button>
           </Link>
           <Link href={`/biz/vehicles/${vehicle.id}?tab=history`} className="w-full">
             <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20">
               <History size={14} />
               Service History
             </Button>
           </Link>
           <Button variant="ghost" size="sm" className="w-full col-span-2 justify-start gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:text-amber-400 dark:hover:bg-amber-900/20">
               <AlertTriangle size={14} />
               Report Issue / Open Tag
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}