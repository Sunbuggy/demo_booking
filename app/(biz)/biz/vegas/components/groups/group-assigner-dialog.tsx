'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FaLayerGroup } from 'react-icons/fa';
import { assignReservationToGroup } from '@/app/actions/group-operations';

interface Props {
  reservationId: string;
  reservationVehicles: Record<string, number>;
  hour: string;
  date: string;
  existingGroups: any[];
  guides: any[]; 
  trigger?: React.ReactNode;
}

export default function GroupAssignerDialog({
  reservationId,
  reservationVehicles,
  hour,
  date,
  existingGroups,
  guides, 
  trigger
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedGroupId, setSelectedGroupId] = useState<string>('NEW');
  const [newGroupSuffix, setNewGroupSuffix] = useState<string>('A'); 
  const [leadGuideId, setLeadGuideId] = useState<string>('');
  const [sweepGuideId, setSweepGuideId] = useState<string>('');
  
  // Vehicle Counts
  const [assignCounts, setAssignCounts] = useState<Record<string, number>>({});

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setAssignCounts(reservationVehicles);
      
      // Smart Suffix: Find the first unused letter
      if (existingGroups.length > 0) {
        const usedLetters = existingGroups.map(g => g.group_name.replace(/\d+/g, ''));
        const candidates = ['A','B','C','D','E','F'];
        const next = candidates.find(L => !usedLetters.includes(L)) || 'Z';
        setNewGroupSuffix(next);
      }
    }
  }, [isOpen, reservationVehicles, existingGroups]);

  // Handle Mode Switch
  useEffect(() => {
    if (selectedGroupId !== 'NEW') {
      const group = existingGroups.find(g => g.id === selectedGroupId);
      if (group) {
        setLeadGuideId(group.lead_guide_id || '');
        setSweepGuideId(group.sweep_guide_id || '');
      }
    } else {
      setLeadGuideId('');
      setSweepGuideId('');
    }
  }, [selectedGroupId, existingGroups]);

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      const groupHour = hour.split(':')[0]; 
      const groupName = selectedGroupId === 'NEW' ? `${groupHour}${newGroupSuffix}` : undefined;

      await assignReservationToGroup(
        date,
        hour,
        reservationId,
        selectedGroupId,
        assignCounts,
        leadGuideId,
        sweepGuideId, 
        groupName
      );
      toast.success("Group Assigned");
      setIsOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
             <FaLayerGroup /> Group
          </Button>
        )}
      </DialogTrigger>
      
      {/* Ensure Dialog text is readable */}
      <DialogContent className="bg-popover border-border text-popover-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <FaLayerGroup /> <span>Assign to Tour Group</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          
          {/* 1. SELECT GROUP */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-muted-foreground uppercase">Target Group</label>
             <div className="flex gap-2">
               <select 
                 // FIX: Added text-foreground and option styling for dark mode
                 className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground [&>option]:bg-background [&>option]:text-foreground"
                 value={selectedGroupId}
                 onChange={(e) => setSelectedGroupId(e.target.value)}
               >
                 <option value="NEW">+ Create New Group</option>
                 {existingGroups.map(g => (
                   <option key={g.id} value={g.id}>
                     {g.group_name} ({g.total_vehicles || 0} veh currently)
                   </option>
                 ))}
               </select>

               {selectedGroupId === 'NEW' && (
                  <div className="flex items-center gap-1 bg-muted px-2 rounded border border-border">
                     <span className="text-sm font-bold text-muted-foreground">{hour.split(':')[0]}</span>
                     <select 
                       // FIX: Added text-foreground and forced background for options
                       className="bg-transparent font-bold text-foreground focus:outline-none [&>option]:bg-background [&>option]:text-foreground"
                       value={newGroupSuffix}
                       onChange={(e) => setNewGroupSuffix(e.target.value)}
                     >
                       {['A','B','C','D','E','F','A1','A2'].map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
               )}
             </div>
          </div>

          {/* 2. SELECT VEHICLES */}
          <div className="space-y-2 p-3 bg-muted/30 rounded border border-border">
             <label className="text-xs font-bold text-muted-foreground uppercase flex justify-between">
               <span>Vehicles to Assign</span>
               <span className="text-[10px] italic">Adjust numbers to split group</span>
             </label>
             <div className="grid grid-cols-2 gap-2">
                {Object.entries(reservationVehicles).map(([type, max]) => (
                  <div key={type} className="flex items-center justify-between bg-card p-2 rounded border border-border">
                     <span className="font-bold text-sm text-foreground">{type}</span>
                     <div className="flex items-center gap-2">
                       <span className="text-xs text-muted-foreground">/ {max}</span>
                       <input 
                         type="number" 
                         min="0" 
                         max={max}
                         // FIX: Added text-foreground so the number "8" is visible in dark mode
                         className="w-12 h-8 text-center bg-background text-foreground border border-input rounded focus:ring-1 focus:ring-primary"
                         value={assignCounts[type] || 0}
                         onChange={(e) => setAssignCounts({...assignCounts, [type]: Number(e.target.value)})}
                       />
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* 3. ASSIGN GUIDES */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-muted-foreground uppercase">Assign Guides</label>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               {/* LEAD */}
               <div className="space-y-1">
                 <span className="text-[10px] font-bold text-green-600 dark:text-green-400">LEAD GUIDE</span>
                 <select 
                    // FIX: Added text-foreground and option styling
                    className="w-full h-9 rounded border border-input bg-background text-foreground text-xs [&>option]:bg-background [&>option]:text-foreground"
                    value={leadGuideId}
                    onChange={(e) => setLeadGuideId(e.target.value)}
                 >
                    <option value="">-- No Lead --</option>
                    {guides.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                 </select>
               </div>

               {/* SWEEP */}
               <div className="space-y-1">
                 <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">SWEEP (Tail)</span>
                 <select 
                    // FIX: Added text-foreground and option styling
                    className="w-full h-9 rounded border border-input bg-background text-foreground text-xs [&>option]:bg-background [&>option]:text-foreground"
                    value={sweepGuideId}
                    onChange={(e) => setSweepGuideId(e.target.value)}
                 >
                    <option value="">-- No Sweep --</option>
                    {guides.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                 </select>
               </div>
             </div>
          </div>

        </div>

        <DialogFooter>
          <Button onClick={handleAssign} disabled={isSubmitting} className="w-full bg-yellow-600 text-white hover:bg-yellow-500 dark:text-black dark:bg-yellow-500">
            {isSubmitting ? 'Saving...' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}