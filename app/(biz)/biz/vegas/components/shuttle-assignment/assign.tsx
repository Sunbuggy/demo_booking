'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchShuttleAssignment, fetchGroups, updateGroup } from '@/utils/supabase/queries';

interface Group {
  id: string;
  group_name: string;
  group_date: string;
  shuttle_assignment_id: string | null;
}

interface ShuttleAssignment {
  id: string;
  vehicle_id: string;
  employee_id: string;
  vehicle_name?: string;
  employee_name?: string;
}

export default function GroupShuttleAssignment({ date }: { date: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [shuttleAssignments, setShuttleAssignments] = useState<ShuttleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedShuttle, setSelectedShuttle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Fetch groups for the selected date with shuttle assignments
        const groupsData = await fetchGroups(supabase, new Date(date));
        setGroups(groupsData || []);
        
        // Fetch shuttle assignments with vehicle and user details
const { data: assignments, error } = await supabase
  .from('shuttle_assignment')
  .select(`
    id,
    vehicle_id,
    employee_id,
    vehicles (name),
    users (full_name)
  `);
        if (error) throw error;
        
        // The joined data comes as arrays, so we need to access the first element
        setShuttleAssignments(assignments?.map(a => ({
          id: a.id,
          vehicle_id: a.vehicle_id,
          employee_id: a.employee_id,
          // vehicle_name: Array.isArray(a.vehicles) ? a.vehicles[0]?.name : a.vehicles?.name,
          // employee_name: Array.isArray(a.users) ? a.users[0]?.full_name : a.users?.full_name
        })) || []);
        
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      loadData();
    }
  }, [supabase, open, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update the group with the shuttle assignment
      const { error } = await supabase
        .from('groups')
        .update({ shuttle_assignment_id: selectedShuttle } as any)
        .eq('id', selectedGroup);
      
      if (error) throw error;
      
      // Update local state to reflect the change
      setGroups(groups.map(group => 
        group.id === selectedGroup 
          ? { ...group, shuttle_assignment_id: selectedShuttle } 
          : group
      ));
      
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Reset selections
        setSelectedGroup('');
        setSelectedShuttle('');
      }, 1500);
    } catch (err) {
      console.error('Error assigning shuttle', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          Assign Shuttle to Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Shuttle to Group</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
                Shuttle assigned successfully!
              </div>
            )}

            {/* Group Selection */}
            <div>
              <label htmlFor="group" className="block mb-2 font-medium">
                Select Group:
              </label>
              <select
                id="group"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full p-2 border rounded"
                required
                disabled={isSubmitting}
              >
                <option value="">-- Select a group --</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.group_name} ({group.group_date})
                    {group.shuttle_assignment_id && ' (Already assigned)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Shuttle Assignment Selection */}
            <div>
              <label htmlFor="shuttle" className="block mb-2 font-medium">
                Select Shuttle Assignment:
              </label>
              <select
                id="shuttle"
                value={selectedShuttle}
                onChange={(e) => setSelectedShuttle(e.target.value)}
                className="w-full p-2 border rounded"
                required
                disabled={isSubmitting}
              >
                <option value="">-- Select a shuttle assignment --</option>
                {shuttleAssignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.vehicle_name || assignment.vehicle_id} - 
                    {assignment.employee_name || assignment.employee_id}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedGroup || !selectedShuttle}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Shuttle to Group'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}