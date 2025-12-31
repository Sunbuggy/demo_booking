'use client';

import { useState } from 'react';
import { FaShuttleVan, FaTrash, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { assignShuttleSegment, removeShuttleSegment } from '@/app/actions/shuttle-operations';

interface FleetItem { id: string; driverName: string; vehicleName: string; capacity: number; }
interface Assignment { manifestId: string; driverName: string; vehicleName: string; paxCount: number; }
interface ReservationStatus { totalAssigned: number; assignments: Assignment[]; }

interface Props {
  reservationId: string;
  totalGroupSize: number;
  reservationHour: string;
  currentStatus?: ReservationStatus;
  activeFleet: FleetItem[];
  hourlyUtilization: Record<string, Record<string, number>>;
  dateContext: string;
}

export default function SplitShuttleAssigner({ 
  reservationId, totalGroupSize, reservationHour, currentStatus, activeFleet, hourlyUtilization, dateContext 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const assignedCount = currentStatus?.totalAssigned || 0;
  const remainingPax = Math.max(0, totalGroupSize - assignedCount);

  // --- STATUS LOGIC ---
  // Red = No one assigned
  // Yellow = Some assigned, but people still left (remainingPax > 0)
  // Green = Everyone assigned
  let iconColor = 'text-red-500 bg-red-900/10 border-red-800'; 
  if (assignedCount > 0 && remainingPax > 0) iconColor = 'text-yellow-500 bg-yellow-900/10 border-yellow-800';
  if (remainingPax === 0 && assignedCount > 0) iconColor = 'text-green-500 bg-green-900/10 border-green-800';

  const assignmentLabel = currentStatus?.assignments.length 
    ? currentStatus.assignments.map(a => `${a.driverName.split(' ')[0]}(${a.paxCount})`).join('+')
    : null;

  // --- AUTO-FILL HANDLER ---
  const handleAssign = async (fleet: FleetItem, currentLoad: number) => {
    if (remainingPax <= 0) {
      toast.success("Everyone is already assigned!");
      return;
    }

    // 1. Calculate Space
    const seatsAvailable = fleet.capacity - currentLoad;
    if (seatsAvailable <= 0) {
      toast.error(`${fleet.driverName} is full!`);
      return;
    }

    // 2. Auto-Fill Amount
    // Take the smaller of: People who need a ride vs. Seats available
    const amountToAssign = Math.min(remainingPax, seatsAvailable);

    setIsUpdating(true);
    try {
      await assignShuttleSegment(reservationId, fleet.id, amountToAssign, dateContext);
      toast.success(`Assigned ${amountToAssign} people to ${fleet.driverName}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign shuttle.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (manifestId: string) => {
    setIsUpdating(true);
    try {
      await removeShuttleSegment(reservationId, manifestId, dateContext);
    } catch (err) {
      toast.error("Failed to remove.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className={`flex items-center gap-2 px-2 py-1 rounded border text-xs font-bold transition-transform active:scale-95 max-w-[180px] ${iconColor}`}
      >
        <FaShuttleVan />
        <span className="truncate">
          {assignmentLabel || `${remainingPax} Need Ride`}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
              <span className="flex items-center gap-2">
                <FaShuttleVan className="text-yellow-500"/>
                Dispatch {reservationHour}:00
              </span>
              <span className={`text-sm px-3 py-1 rounded font-mono border ${remainingPax > 0 ? 'bg-yellow-900/40 border-yellow-700 text-yellow-500' : 'bg-green-900/40 border-green-700 text-green-500'}`}>
                {remainingPax > 0 ? `${remainingPax} UNASSIGNED` : 'ALL SET'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {currentStatus?.assignments?.length > 0 && (
              <div className="bg-black/30 p-3 rounded border border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Current Shuttles</h4>
                <div className="space-y-2">
                  {currentStatus.assignments.map((a) => (
                    <div key={a.manifestId} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded border border-slate-700">
                      <div className="flex items-center gap-2">
                         <FaCheckCircle className="text-green-500" size={12}/>
                         <span className="text-slate-200 font-bold">{a.driverName}</span> 
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">
                          {a.paxCount} pax
                        </span>
                        <button onClick={() => handleRemove(a.manifestId)} disabled={isUpdating} className="text-red-500 hover:text-red-400 p-1">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Tap a driver to fill seats</h4>
              <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {activeFleet.map((fleet) => {
                  const currentHourlyLoad = hourlyUtilization?.[fleet.id]?.[reservationHour] || 0;
                  const seatsLeft = fleet.capacity - currentHourlyLoad;
                  const isFull = seatsLeft <= 0;
                  const isAssigned = currentStatus?.assignments.some(a => a.manifestId === fleet.id);

                  return (
                    <button
                      key={fleet.id}
                      onClick={() => !isFull && handleAssign(fleet, currentHourlyLoad)}
                      disabled={isFull || remainingPax === 0}
                      className={`
                        w-full relative flex items-center justify-between p-3 rounded border transition-all text-left
                        ${isAssigned ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-slate-800 bg-slate-900'}
                        ${isFull ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98]'}
                      `}
                    >
                      <div>
                        <div className="font-bold text-base text-slate-200">{fleet.driverName}</div>
                        <div className="text-xs text-slate-500">{fleet.vehicleName}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-lg font-bold ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                          {currentHourlyLoad} <span className="text-slate-600 text-sm">/</span> {fleet.capacity}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isFull ? 'FULL' : `${seatsLeft} SEATS OPEN`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}