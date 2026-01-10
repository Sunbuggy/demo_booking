/**
 * @file components/fleet/vehicle-status-avatar.tsx
 * @description The "Identity" component for vehicles.
 * Shows photo/icon, status dot, and quick actions popover.
 * Modeled after UserStatusAvatar.
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { 
  CarFront, Tractor, Truck, Zap, 
  AlertTriangle, Wrench, CheckCircle2, 
  MapPin, Fuel, History, FileText, 
  MoreHorizontal,
  Ghost
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DashboardVehicle } from '@/app/actions/fleet'; 

// -----------------------------------------------------------------------------
// TYPES & HELPERS
// -----------------------------------------------------------------------------

// Loose type definition to allow reuse in different contexts
interface VehicleAvatarProps {
  vehicle: DashboardVehicle | any; // Fallback to any for legacy queries
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusDot?: boolean;
  className?: string;
}

const getVehicleIcon = (type: string, className?: string) => {
  const cls = className || "w-3/5 h-3/5";
  switch (type?.toLowerCase()) {
    case 'buggy': return <CarFront className={cls} />;
    case 'atv': return <Tractor className={cls} />;
    case 'truck': return <Truck className={cls} />;
    case 'shuttle': return <Truck className={cls} />; // Or Bus icon if available
    case 'tram': return <Zap className={cls} />;
    default: return <CarFront className={cls} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'fine': return 'bg-green-500 border-green-600';
    case 'broken': return 'bg-red-500 border-red-600';
    case 'maintenance': return 'bg-amber-500 border-amber-600';
    case 'former': return 'bg-slate-400 border-slate-500';
    default: return 'bg-slate-300 border-slate-400';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'fine': return 'Operational';
    case 'broken': return 'Out of Service';
    case 'maintenance': return 'In Maintenance';
    case 'former': return 'Decommissioned';
    default: return status;
  }
};

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export default function VehicleStatusAvatar({ 
  vehicle, 
  size = 'md',
  showStatusDot = true,
  className
}: VehicleAvatarProps) {
  
  const [isOpen, setIsOpen] = useState(false);

  // Dimensions logic
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24 text-4xl' 
  };
  
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  // "Personality" Logic: If it has a pet name, that's the primary identity.
  const displayName = vehicle.pet_name || vehicle.name;
  const subName = vehicle.pet_name ? `#${vehicle.name}` : vehicle.type;
  const status = vehicle.vehicle_status || 'fine';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "relative inline-block cursor-pointer hover:scale-105 transition-transform", 
            className
          )}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className={cn(
            "rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 select-none shadow-sm relative",
            sizeClasses[size],
            // Dynamic border color based on status for extra visibility
            status === 'broken' ? 'border-red-200 dark:border-red-900' : 
            status === 'maintenance' ? 'border-amber-200 dark:border-amber-900' :
            'border-slate-200 dark:border-slate-700'
          )}>
            {vehicle.profile_pic_url ? (
              <Image 
                src={vehicle.profile_pic_url} 
                alt={displayName} 
                fill 
                className="object-cover" 
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              getVehicleIcon(vehicle.type)
            )}
          </div>

          {/* Realtime Status Dot */}
          {showStatusDot && (
            <span className={cn(
              "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-950 shadow-sm",
              dotSize,
              getStatusColor(status)
            )} />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl border-slate-200 dark:border-slate-800" align="start" sideOffset={8}>
        
        {/* HEADER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 flex gap-4">
          <div className={cn(
            "relative w-16 h-16 rounded-full overflow-hidden border bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 shadow-inner shrink-0",
            status === 'broken' ? 'border-red-400' : 'border-slate-200'
          )}>
             {vehicle.profile_pic_url ? (
               <Image src={vehicle.profile_pic_url} alt={displayName} fill className="object-cover" />
             ) : (
               getVehicleIcon(vehicle.type, "w-8 h-8")
             )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100 truncate">
              {displayName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-5 bg-white dark:bg-slate-800">
                {subName}
              </Badge>
              {vehicle.location_name && (
                <span className="text-xs text-slate-500 flex items-center gap-0.5 truncate">
                  <MapPin className="w-3 h-3" /> {vehicle.location_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className={cn(
          "px-4 py-3 flex items-center justify-between text-sm font-medium border-b dark:border-slate-800",
          status === 'fine' ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
          status === 'broken' ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
          status === 'maintenance' ? "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" :
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        )}>
          <span className="flex items-center gap-2 capitalize">
            {status === 'fine' && <CheckCircle2 className="w-4 h-4" />}
            {status === 'broken' && <AlertTriangle className="w-4 h-4" />}
            {status === 'maintenance' && <Wrench className="w-4 h-4" />}
            {status === 'former' && <Ghost className="w-4 h-4" />}
            {getStatusLabel(status)}
          </span>
          {/* Placeholder for fuel level - Will work once Unified Inspections are live */}
          {vehicle.fuel_level && (
             <span className="flex items-center gap-1 text-xs opacity-80 font-mono">
               <Fuel className="w-3 h-3" /> {vehicle.fuel_level}
             </span>
          )}
        </div>

        {/* ACTIONS GRID */}
        <div className="p-2 grid grid-cols-2 gap-2">
          
          <Button variant="ghost" className="justify-start h-10 px-2 gap-2 text-xs" asChild onClick={() => setIsOpen(false)}>
            <Link href={`/biz/vehicles/${vehicle.id}`}>
              <FileText className="w-4 h-4 text-blue-500" />
              Vehicle Details
            </Link>
          </Button>

          <Button variant="ghost" className="justify-start h-10 px-2 gap-2 text-xs" asChild onClick={() => setIsOpen(false)}>
            <Link href={`/biz/vehicles/${vehicle.id}?tab=history`}>
              <History className="w-4 h-4 text-slate-500" />
              Service History
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            className="justify-start h-10 px-2 gap-2 text-xs col-span-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            onClick={() => {
              // Future: Wire this up to a "Quick Tag" modal
              setIsOpen(false);
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            Report Issue / Open Tag
          </Button>

        </div>
      </PopoverContent>
    </Popover>
  );
}