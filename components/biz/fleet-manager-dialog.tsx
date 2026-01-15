'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createFleetPairing, removeFleetPairing } from '@/app/actions/shuttle-operations';
import { toast } from 'sonner';
import { FaBus, FaUserPlus, FaTrash, FaLock, FaUsers } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch'; 
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';

/**
 * UPDATED INTERFACE
 */
interface Props { 
  date: string; 
  drivers: { 
    id: string; 
    full_name: string; 
    stage_name?: string | null; 
  }[]; 
  activeFleet: any[]; 
  todaysShifts: any[];
  realFleet: VehicleType[];
  role?: number; 
  trigger?: React.ReactNode; 
}

export default function FleetManagerDialog({ 
  date, 
  drivers = [], 
  activeFleet, 
  todaysShifts, 
  realFleet, 
  role = 0, 
  trigger 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  // Default to FALSE (Show only scheduled)
  const [showAllStaff, setShowAllStaff] = useState(false); 

  const canEdit = role >= 400;

  /**
   * HELPER: GET DISPLAY NAME
   */
  const getDriverName = (driver: any) => {
    if (!driver) return 'Unknown';
    return driver.stage_name && driver.stage_name.trim() !== '' 
      ? driver.stage_name 
      : driver.full_name;
  };

  /**
   * MEMOIZED FILTER LOGIC
   */
  const filteredDrivers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];

    // STEP 1: Deduplicate drivers by ID
    const uniqueDrivers = Object.values(
      drivers.reduce((acc, driver) => {
        acc[driver.id] = driver;
        return acc;
      }, {} as Record<string, typeof drivers[0]>)
    );

    // STEP 2: Filter based on Schedule
    if (showAllStaff || !todaysShifts || todaysShifts.length === 0) {
      return uniqueDrivers;
    }
    
    const scheduled = uniqueDrivers.filter(d => 
      todaysShifts.some(shift => shift.user_id === d.id)
    );

    // Failsafe: if schedule exists but nobody matches, show everyone.
    if (scheduled.length === 0) return uniqueDrivers;
    
    return scheduled;
  }, [drivers, todaysShifts, showAllStaff]);

  // --- HANDLER: ADD ---
  const handlePair = async () => {
    if (!canEdit) return;
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error('Please select both a driver and a vehicle');
      return;
    }
    
    setIsSubmitting(true);

    const vehicle = realFleet.find(v => v.id === selectedVehicleId);
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
        vehicleDisplayName,
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
    if (!canEdit) return;
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
            // SEMANTIC: Updated Trigger Button
            <Button className="bg-popover border border-border text-yellow-600 dark:text-yellow-500 hover:bg-accent hover:text-yellow-700 dark:hover:text-yellow-400 transition-all gap-2 shadow-sm">
              <FaBus /> Morning Roll Call
            </Button>
          )}
        </div>
      </DialogTrigger>
      
      {/* SEMANTIC: Using theme variables for Dialog Content */}
      <DialogContent 
        className="bg-popover border-border text-popover-foreground sm:max-w-[450px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <FaUserPlus /> <span>Manage Daily Fleet</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          
          {/* --- SECTION 1: ADD NEW DRIVER --- */}
          {canEdit ? (
            // SEMANTIC: Using 'bg-card' or 'bg-muted' for the form container
            <div className="grid gap-4 p-4 bg-muted/40 rounded border border-border">
               <div className="flex items-center justify-between">
                 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add to Schedule</h4>
                 
                 <div className="flex items-center gap-2">
                   <label htmlFor="show-all" className="text-[10px] text-muted-foreground cursor-pointer select-none">
                     {showAllStaff ? 'Showing All Staff' : 'Scheduled Only'}
                   </label>
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
                   // SEMANTIC: Standard Input Styling
                   className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                   value={selectedDriverId}
                   onChange={(e) => { setSelectedDriverId(e.target.value); e.target.blur(); }}
                 >
                   <option value="">
                     {drivers.length === 0 
                        ? 'Error: No Drivers Loaded' 
                        : filteredDrivers.length === 0 
                          ? '-- No Scheduled Drivers Found --' 
                          : `-- Choose Driver (${filteredDrivers.length}) --`
                     }
                   </option>
                   {filteredDrivers.map((d) => (
                     <option key={d.id} value={d.id}>
                       {getDriverName(d)}
                     </option>
                   ))}
                 </select>

                 <select
                   // SEMANTIC: Standard Input Styling
                   className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                   value={selectedVehicleId}
                   onChange={(e) => { setSelectedVehicleId(e.target.value); e.target.blur(); }}
                 >
                   <option value="">-- Choose Vehicle --</option>
                   {realFleet.map((v) => (
                     <option key={v.id} value={v.id}>
                       {v.name} {v.pet_name ? `- ${v.pet_name}` : ''} ({v.seats} Seats)
                     </option>
                   ))}
                 </select>

                 <Button 
                   onClick={handlePair} 
                   disabled={isSubmitting} 
                   className="mt-2 bg-yellow-600 hover:bg-yellow-500 text-white dark:text-black dark:bg-yellow-500 dark:hover:bg-yellow-400 w-full"
                 >
                   {isSubmitting ? 'Saving...' : 'Add Driver'}
                 </Button>
               </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/20 rounded border border-dashed border-border text-center flex flex-col items-center gap-2">
              <FaLock className="text-muted-foreground text-xl" /> 
              <p className="text-sm text-muted-foreground">Editing is restricted to Managers.</p>
            </div>
          )}

          {/* --- SECTION 2: CURRENT ROSTER LIST --- */}
          <div>
             <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Current Roster ({activeFleet ? activeFleet.length : 0})
                </h4>
             </div>
             
             {activeFleet && activeFleet.length > 0 ? (
               <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                 {activeFleet.map((item) => {
                   
                   // MATCHING LOGIC
                   const matchedDriver = drivers.find(d => d.id === item.driverId);
                   const displayName = getDriverName(matchedDriver) || item.driverName || 'Unknown';

                   return (
                     // SEMANTIC: List Item
                     <div key={item.id} className="flex items-center justify-between p-2 rounded bg-card border border-border shadow-sm">
                       <div className="flex items-center gap-3">
                         <div className="bg-muted p-1.5 rounded-full text-muted-foreground">
                           <FaUsers size={12} />
                         </div>
                         <div>
                           <div className="text-sm font-bold text-foreground">{displayName}</div>
                           <div className="text-xs text-muted-foreground">{item.vehicleName}</div>
                         </div>
                       </div>
                       
                       {canEdit && (
                         <button 
                           onClick={() => handleRemove(item.id, displayName)}
                           disabled={isSubmitting}
                           className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 p-2 transition-colors rounded-full hover:bg-muted"
                         >
                           <FaTrash size={14} />
                           <span className="sr-only">Remove {displayName}</span>
                         </button>
                       )}
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-6 text-muted-foreground text-sm bg-muted/20 rounded border border-border border-dashed">
                 No drivers assigned yet.
               </div>
             )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}