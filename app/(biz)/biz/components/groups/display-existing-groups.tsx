'use client';
import React from 'react';
import { GroupVehiclesType } from '../../types';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import DeleteGroup from './delete-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Edit } from 'lucide-react';
import { updateGroupName } from '@/utils/old_db/actions'; 
import { GuideSelector } from './guide-selector';

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

  // --- REMOVED REALTIME LISTENER ---

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
          router.refresh(); // Manual refresh on action
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
      router.refresh(); // Manual refresh on action
    }
  };
  
  const handleUpdate = () => {
    if (newLead !== lead || newSweep !== sweep) {
      setInitiateUpdate(true);
    }
  };

  return (
    <div>
      <span className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {isEditingGroupName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-40"
              />
              <Button size="sm" onClick={handleSaveGroupName}>Save</Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditingGroupName(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold">
                Group: <span className="text-cyan-400">{groupName}</span>
              </h1>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingGroupName(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <span className="ml-2">
          <DeleteGroup groupId={groupId} />
        </span>
      </span>

      <div className="bg-slate-900/50 p-3 rounded border border-slate-800 mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Assign Guides</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium w-12">Lead:</span>
            <GuideSelector label="Lead" value={newLead} guides={availableGuides} onChange={setNewLead} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium w-12 text-amber-500">Sweep:</span>
            <GuideSelector label="Sweep" value={newSweep} guides={availableGuides} onChange={setNewSweep} />
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
      <div className="flex gap-1 text-xs flex-wrap">
        {Object.entries(
          nameFilteredGroups.reduce((acc, group) => {
              if (!acc[group.old_booking_id]) acc[group.old_booking_id] = [];
              acc[group.old_booking_id].push(`${group.quantity}-${group.old_vehicle_name}`);
              return acc;
            }, {} as Record<string, string[]>)
        ).map(([bookingId, details]) => (
          <div key={bookingId} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded">
            <span className="text-pink-500 font-mono">{bookingId}</span> 
            <span className="text-slate-500 mx-1">•</span>
            <span className="text-orange-400">{details.join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  // --- REMOVED REALTIME LISTENER ---
  return (
    <div>
      {nameFilteredGroups ? (
        <div className="flex gap-1 w-fit item-start">
          <div className="flex gap-1 flex-col">
            <div>
              <span className="text-cyan-500">{groupName}</span>{' '}
              <span className="text-orange-500">({groupQty})</span>
            </div>
          </div>
          <div className="flex gap-1 text-sm flex-wrap">
            {Object.entries(
              nameFilteredGroups.reduce((acc, group) => {
                  if (!acc[group.old_vehicle_name]) acc[group.old_vehicle_name] = 0;
                  acc[group.old_vehicle_name] += Number(group.quantity);
                  return acc;
                }, {} as Record<string, number>)
            ).map(([vehicleName, totalQuantity]) => (
              <div key={vehicleName}>
                <span className="text-orange-500">{`${totalQuantity}-${vehicleName}`}</span>
              </div>
            ))}
            <div className="pl-2">
              {lead && <div className="text-xs">Lead: {lead}</div>}
              {sweep && <div className="text-amber-500 text-xs">Sweep: {sweep}</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-lime-500">edit</div>
      )}
    </div>
  );
};