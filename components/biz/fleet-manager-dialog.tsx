'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createFleetPairing, removeFleetPairing } from '@/app/actions/shuttle-operations';
import { toast } from 'sonner';
import { FaBus, FaUserPlus, FaTrash } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch'; 
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';

interface Props { 
  date: string; 
  drivers: { id: string; full_name: string }[]; 
  activeFleet: any[]; 
  todaysShifts: any[];
  realFleet: VehicleType[]; 
  trigger?: React.ReactNode; 
}

export default function FleetManagerDialog({ date, drivers, activeFleet, todaysShifts, realFleet, trigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [showAllStaff, setShowAllStaff] = useState(false); 

  // --- FILTER LOGIC ---
  const filteredDrivers = useMemo(() => {
    if (showAllStaff || !todaysShifts) return drivers;
    return drivers.filter(d => todaysShifts.some(shift => shift.user_id === d.id));
  }, [drivers, todaysShifts, showAllStaff]);

  // --- HANDLER: ADD ---
  const handlePair = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error('Please select both a driver and a vehicle');
      return;
    }
    
    setIsSubmitting(true);

    const vehicle = realFleet.find(v => v.id === selectedVehicleId);
    
    // LOGIC UPDATE: Combine Name and Pet Name for the display
    // Result: "sh013 - Dundee" or just "sh005" if no pet name
    let vehicleDisplayName = vehicle?.name || 'Unknown';
    if (vehicle?.pet_name) {
      vehicleDisplayName += ` - ${vehicle.pet_name}`;
    }

    const vehicleSeats = vehicle?.seats || 14; 

    try {
      await createFleetPairing(
        date, 
        selectedDriverId, 
        selectedVehicleId, 
        vehicleDisplayName, // <--- Saves "Name - Pet Name" to the schedule
        vehicleSeats
      );
      
      toast.success('Driver added to schedule');
      setSelectedDriverId('');
      setSelectedVehicleId('');
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to add driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLER: REMOVE ---
  const handleRemove = async (manifestId: string, driverName: string) => {
    if(!confirm(`Remove ${driverName} from the schedule?`)) return;
    setIsSubmitting(true);
    try {
      await removeFleetPairing(manifestId, date);
      toast.success(`${driverName} removed.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to remove driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="inline-block cursor-pointer">
          {trigger ? (
            trigger
          ) : (
            <Button className="bg-slate-900 border border-slate-700 text-yellow-500 hover:bg-slate-800 hover:text-yellow-400 transition-all gap-2">
              <FaBus /> Morning Roll Call
            </Button>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent 
        className="bg-slate-900 border-slate-700 text-white sm:max-w-[450px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-500">
            <FaUserPlus /> <span>Manage Daily Fleet</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* SECTION 1: ADD NEW DRIVER */}
          <div className="grid gap-4 p-4 bg-slate-950 rounded border border-slate-800">
             <div className="flex items-center justify-between">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add to Schedule</h4>
               
               <div className="flex items-center gap-2">
                 <label htmlFor="show-all" className="text-[10px] text-slate-400 cursor-pointer select-none">Show Unscheduled</label>
                 <Switch 
                   id="show-all"
                   checked={showAllStaff}
                   onCheckedChange={setShowAllStaff}
                   className="scale-75 data-[state=checked]:bg-yellow-500"
                 />
               </div>
             </div>

             <div className="grid gap-2">
               <select
                 className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                 value={selectedDriverId}
                 onChange={(e) => { setSelectedDriverId(e.target.value); e.target.blur(); }}
               >
                 <option value="">
                   {filteredDrivers.length === 0 ? '-- No Scheduled Drivers Found --' : '-- Choose Driver --'}
                 </option>
                 {filteredDrivers.map((d) => (
                   <option key={d.id} value={d.id}>{d.full_name}</option>
                 ))}
               </select>

               {/* UPDATED VEHICLE SELECT */}
               <select
                 className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                 value={selectedVehicleId}
                 onChange={(e) => { setSelectedVehicleId(e.target.value); e.target.blur(); }}
               >
                 <option value="">-- Choose Vehicle --</option>
                 {realFleet.map((v) => (
                   <option key={v.id} value={v.id}>
                     {/* DISPLAY: Name - Pet Name (Seats) */}
                     {v.name} {v.pet_name ? `- ${v.pet_name}` : ''} ({v.seats} Seats)
                   </option>
                 ))}
               </select>

               <Button 
                 onClick={handlePair} 
                 disabled={isSubmitting} 
                 className="mt-2 bg-yellow-500 text-black hover:bg-yellow-400 w-full"
               >
                 {isSubmitting ? 'Saving...' : 'Add Driver'}
               </Button>
             </div>
          </div>

          {/* SECTION 2: CURRENT ROSTER LIST */}
          {activeFleet && activeFleet.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Current Roster ({activeFleet.length})
              </h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                {activeFleet.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                    <div>
                      <div className="text-sm font-bold text-slate-200">{item.driverName}</div>
                      {/* Displays the vehicle name we saved earlier (e.g. sh013 - Dundee) */}
                      <div className="text-xs text-slate-500">{item.vehicleName}</div>
                    </div>
                    <button 
                      onClick={() => handleRemove(item.id, item.driverName)}
                      disabled={isSubmitting}
                      className="text-slate-500 hover:text-red-500 p-2 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}