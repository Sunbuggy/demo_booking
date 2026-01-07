'use client';
import React from 'react';
import { GroupVehiclesType } from '../../../types';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import DeleteGroup from './delete-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Edit } from 'lucide-react';
import { updateGroupName } from '@/utils/old_db/actions'; 
import { GuideSelector } from './guide-selector';

/**
 * COMPONENT: DisplayExistingGroups
 * Used inside the "Edit Group" Sheet/Modal
 */
export const DisplayExistingGroups = ({
  groupId,
  groupName,
  groupQty,
  nameFilteredGroups,
  lead,
  sweep,
  availableGuides = [] 
}: {
  groupId: string;
  groupName: string;
  groupQty: number;
  nameFilteredGroups: GroupVehiclesType[];
  lead?: string;
  sweep?: string;
  availableGuides?: { id: string, full_name: string }[];
}) => {
  const supabase = createClient();
  const router = useRouter();
  const [newLead, setNewLead] = React.useState(lead || '');
  const [newSweep, setNewSweep] = React.useState(sweep || '');
  const [initiateUpdate, setInitiateUpdate] = React.useState(false);
  const { toast } = useToast();
  const [isEditingGroupName, setIsEditingGroupName] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState(groupName);

  React.useEffect(() => {
    setNewGroupName(groupName);
  }, [groupName]);

  React.useEffect(() => {
    if (initiateUpdate) {
      supabase
        .from('groups')
        .update({ lead: newLead, sweep: newSweep })
        .eq('id', groupId)
        .then((res) => {
          res.error
            ? toast({ title: 'Error', description: 'Update failed', variant: 'destructive' })
            : toast({ title: 'Group Updated', description: 'Assignments saved.', variant: 'success' });
          setInitiateUpdate(false);
          router.refresh(); 
        });
    }
  }, [initiateUpdate, newLead, newSweep, groupId, supabase, groupName, toast, router]);

  const handleSaveGroupName = async () => {
    if (newGroupName.trim() === groupName) {
      setIsEditingGroupName(false);
      return;
    }

    const { error } = await updateGroupName(groupId, newGroupName.trim());
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: `Group renamed to ${newGroupName}.`, variant: 'success' });
      setIsEditingGroupName(false);
      router.refresh(); 
    }
  };
  
  const handleUpdate = () => {
    if (newLead !== lead || newSweep !== sweep) {
      setInitiateUpdate(true);
    }
  };

  return (
    // [FIX] Ensure container doesn't overflow width
    <div className="w-full max-w-full">
      <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
        <div className="flex items-center gap-2 max-w-full">
          {isEditingGroupName ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-40"
              />
              <Button size="sm" onClick={handleSaveGroupName}>Save</Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditingGroupName(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 max-w-full">
              <h1 className="text-lg font-bold break-words min-w-0">
                Group: <span className="text-cyan-400 break-all">{groupName}</span>
              </h1>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingGroupName(true)} className="shrink-0">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <span className="ml-auto shrink-0">
          <DeleteGroup groupId={groupId} />
        </span>
      </div>

      <div className="bg-slate-900/50 p-3 rounded border border-slate-800 mb-4 w-full">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Assign Guides</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium w-12">Lead:</span>
            <div className="flex-1 min-w-[150px]">
               <GuideSelector label="Lead" value={newLead} guides={availableGuides} onChange={setNewLead} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium w-12 text-amber-500">Sweep:</span>
            <div className="flex-1 min-w-[150px]">
               <GuideSelector label="Sweep" value={newSweep} guides={availableGuides} onChange={setNewSweep} />
            </div>
          </div>
          <Button 
            size={'sm'} variant={'secondary'} onClick={handleUpdate}
            disabled={newLead === lead && newSweep === sweep} className="w-full mt-1"
          >
            Confirm Assignments
          </Button>
        </div>
      </div>

      <p className="mb-1 text-sm font-medium">
        <span className="text-orange-500"> Vehicles:</span>{' '}
        <span className="text-xl text-orange-500 font-bold">{groupQty}</span>
      </p>
      
      {/* [FIX] Vehicle Badges List - Added flex-wrap */}
      <div className="flex flex-wrap gap-1 text-xs w-full">
        {Object.entries(
          nameFilteredGroups.reduce((acc, group) => {
              if (!acc[group.old_booking_id]) acc[group.old_booking_id] = [];
              acc[group.old_booking_id].push(`${group.quantity}-${group.old_vehicle_name}`);
              return acc;
            }, {} as Record<string, string[]>)
        ).map(([bookingId, details]) => (
          <div key={bookingId} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded max-w-full break-words">
            <span className="text-pink-500 font-mono">{bookingId}</span> 
            <span className="text-slate-500 mx-1">â€¢</span>
            <span className="text-orange-400">{details.join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * COMPONENT: DisplayGroupsInHourCard
 * Used inside the Main Dashboard Hour Card (The "Active Groups" list)
 * This was likely the cause of the page blowout.
 */
export const DisplayGroupsInHourCard = ({
  groupName,
  groupQty,
  nameFilteredGroups,
  lead,
  sweep 
}: {
  groupName: string;
  groupQty: number;
  nameFilteredGroups: GroupVehiclesType[];
  lead?: string;
  sweep?: string; 
}) => {
  return (
    <div className="w-full max-w-full overflow-hidden">
      {nameFilteredGroups ? (
        // [FIX] Removed 'w-fit', added 'w-full flex-wrap' to allow breaking
        <div className="flex flex-wrap gap-x-3 gap-y-1 w-full items-baseline">
          
          {/* Group Name & Qty */}
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-cyan-500 font-bold truncate max-w-[150px]">{groupName}</span>{' '}
            <span className="text-orange-500 font-mono text-xs">({groupQty})</span>
          </div>

          {/* Vehicle List - Now Wraps properly */}
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
            {Object.entries(
              nameFilteredGroups.reduce((acc, group) => {
                  if (!acc[group.old_vehicle_name]) acc[group.old_vehicle_name] = 0;
                  acc[group.old_vehicle_name] += Number(group.quantity);
                  return acc;
                }, {} as Record<string, number>)
            ).map(([vehicleName, totalQuantity]) => (
              <span key={vehicleName} className="text-orange-400/90 whitespace-nowrap">
                {totalQuantity}-{vehicleName}
              </span>
            ))}
          </div>

          {/* Leads/Sweeps - Wraps to next line if needed */}
          {(lead || sweep) && (
             <div className="flex items-center gap-2 text-[10px] pl-0 sm:pl-2 w-full sm:w-auto mt-0.5 sm:mt-0 border-t sm:border-t-0 border-slate-800/50 pt-0.5 sm:pt-0">
                {lead && <span className="text-slate-400">L: <span className="text-slate-200">{lead}</span></span>}
                {sweep && <span className="text-slate-400">S: <span className="text-amber-500">{sweep}</span></span>}
             </div>
          )}
        </div>
      ) : (
        <div className="text-lime-500 text-xs">edit</div>
      )}
    </div>
  );
};