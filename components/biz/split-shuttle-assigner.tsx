'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { assignShuttleSegment, removeShuttleSegment } from '@/app/actions/shuttle-operations';
import { toast } from 'sonner';
import { FaShuttleVan, FaCheckCircle, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface Props {
  reservationId: string;
  totalGroupSize: number;
  reservationHour: string;
  currentStatus: any;
  activeFleet: any[];
  hourlyUtilization: any;
  dateContext: string;
  pickupLocation: string;
  groupName: string;
  drivers: any[];
}

export default function SplitShuttleAssigner({
  reservationId,
  totalGroupSize,
  reservationHour,
  currentStatus,
  activeFleet,
  hourlyUtilization,
  dateContext,
  pickupLocation,
  groupName,
  drivers
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [paxToAssign, setPaxToAssign] = useState<number>(totalGroupSize);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Calculate Status
  const assignedPax = currentStatus?.totalAssigned || 0;
  const assignments = currentStatus?.assignments || [];
  const remainingPax = Math.max(0, totalGroupSize - assignedPax);
  
  const isFullyAssigned = assignedPax >= totalGroupSize;
  
  // Auto-set pax to remaining when opening
  const handleOpen = () => {
    setPaxToAssign(remainingPax > 0 ? remainingPax : totalGroupSize);
    setIsOpen(true);
  };

  // 2. Handle Assign
  const handleAssign = async () => {
    if (!selectedDriverId) return toast.error("Select a driver");
    
    const activeDriver = activeFleet?.find(f => f.driverId === selectedDriverId);
    if (!activeDriver) return toast.error("This driver is not scheduled for today.");

    setIsSubmitting(true);
    try {
      await assignShuttleSegment(reservationId, activeDriver.id, paxToAssign, dateContext);
      toast.success("Assigned!");
      setIsOpen(false);
      setSelectedDriverId('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Remove
  const handleRemove = async (manifestId: string) => {
    if (!confirm("Remove this shuttle assignment?")) return;
    setIsSubmitting(true);
    try {
      await removeShuttleSegment(reservationId, manifestId, dateContext);
      toast.success("Removed assignment");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VISUAL LOGIC ---
  const renderTrigger = () => {
    // A. If assignments exist, show the buttons (DRIVER NAME + PAX)
    if (assignments.length > 0) {
      return (
        <div className="flex flex-wrap items-center gap-1">
          {assignments.map((assign: any, i: number) => (
             <span 
               key={i} 
               className={cn(
                 "text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors",
                 isFullyAssigned 
                   ? "bg-green-950/40 text-green-400 border-green-800 hover:bg-green-900" 
                   : "bg-yellow-950/40 text-yellow-500 border-yellow-800 hover:bg-yellow-900"
               )}
               title={`Assigned to ${assign.vehicleName}`} // Hover still shows vehicle
             >
               {/* 1. Driver Name */}
               {assign.driverName.split(' ')[0]} 
               
               {/* 2. Pax Count (Always shown now) */}
               <span className="opacity-80 font-normal">({assign.paxCount})</span>
             </span>
          ))}
          
          {/* Show warning icon if split and incomplete */}
          {remainingPax > 0 && (
             <FaExclamationCircle className="text-red-500 text-xs" title={`${remainingPax} unassigned`} />
          )}
        </div>
      );
    }

    // B. Default: Unassigned Icon
    return (
      <div className="text-slate-500 hover:text-white transition-colors p-1">
         <FaShuttleVan />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) setIsOpen(false); }}>
      <DialogTrigger asChild>
        <button onClick={handleOpen} className="outline-none focus:outline-none text-left">
           {renderTrigger()}
        </button>
      </DialogTrigger>

      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">Assign Shuttle</DialogTitle>
          <div className="text-xs text-slate-400 mt-1">
            {groupName} • {pickupLocation}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          
          {/* Status Bar */}
          <div className="flex justify-between text-sm p-2 bg-slate-800 rounded border border-slate-700">
            <span>Total: <span className="text-white font-bold">{totalGroupSize}</span></span>
            <span>Assigned: <span className={isFullyAssigned ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>{assignedPax}</span></span>
            <span>Rem: <span className="text-red-400 font-bold">{Math.max(0, totalGroupSize - assignedPax)}</span></span>
          </div>

          {/* Current Assignments List */}
          {assignments.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs uppercase text-slate-500 font-bold">Current Shuttles</label>
              {assignments.map((assign: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-sm">
                    <span className="text-yellow-500 font-bold">{assign.driverName}</span>
                    <span className="text-slate-500 text-xs ml-2">({assign.paxCount} pax) • {assign.vehicleName}</span>
                  </div>
                  <button 
                    onClick={() => handleRemove(assign.manifestId)}
                    disabled={isSubmitting}
                    className="text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ASSIGNMENT FORM */}
          {!isFullyAssigned && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs uppercase text-slate-500 font-bold">New Assignment</label>
              
              <div className="grid gap-2">
                <select
                  className="w-full h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">-- Select Driver --</option>
                  {drivers && drivers.map((driver) => {
                    const activeInfo = activeFleet?.find(f => f.driverId === driver.id);
                    const isScheduled = !!activeInfo;
                    
                    let label = driver.full_name;
                    if (isScheduled) {
                       label = `${driver.full_name} (${activeInfo.vehicleName})`; 
                    } else {
                       label = `${driver.full_name} (Not Scheduled)`; 
                    }

                    return (
                      <option 
                        key={driver.id} 
                        value={driver.id} 
                        disabled={!isScheduled}
                        className={!isScheduled ? "text-slate-500 bg-slate-900" : "text-white font-bold bg-slate-800"}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>

                <div className="flex items-center gap-2">
                   <span className="text-sm text-slate-400 whitespace-nowrap">Passengers:</span>
                   <input 
                     type="number" 
                     min="1" 
                     max={remainingPax} 
                     value={paxToAssign}
                     onChange={(e) => setPaxToAssign(parseInt(e.target.value))}
                     className="w-20 h-9 rounded border border-slate-700 bg-slate-950 px-2 text-center text-white"
                   />
                   <Button 
                     onClick={handleAssign} 
                     disabled={isSubmitting || !selectedDriverId} 
                     className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white"
                   >
                     Assign
                   </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}