'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchVehicles } from '@/utils/supabase/queries';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ShaCreate() {
  const [allShuttles, setAllShuttles] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Search states
  const [shuttleSearch, setShuttleSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Fetch all shuttles (not just fine ones) but filter non-former
        const vehicles = await fetchVehicles(supabase);
        const filteredShuttles = vehicles.filter(vehicle => 
          vehicle.vehicle_status !== 'former' && 
          vehicle.type === 'shuttle'
        );
        setAllShuttles(filteredShuttles);

        // Fetch all users with level >= 300
        const userDetails = await getUserDetails(supabase);
        const filteredUsers = userDetails?.filter(user => 
          user.user_level >= 300
        ) || [];
        setAllUsers(filteredUsers);

      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      loadData();
    }
  }, [supabase, open]);

  // Filter shuttles based on search
  const filteredShuttles = useMemo(() => {
    if (!shuttleSearch) return allShuttles;
    const searchLower = shuttleSearch.toLowerCase();
    return allShuttles.filter(shuttle => 
      shuttle.name.toLowerCase().includes(searchLower) ||
      shuttle.id.toLowerCase().includes(searchLower)
    );
  }, [allShuttles, shuttleSearch]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!userSearch) return allUsers;
    const searchLower = userSearch.toLowerCase();
    return allUsers.filter(user => 
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }, [allUsers, userSearch]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const shuttleId = formData.get('shuttle') as string;
    const userId = formData.get('user') as string;
    
    try {
      // Get current user (the one creating the assignment)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error(authError?.message || 'No authenticated user found');
      }

      // Check if user already has an assignment
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('shuttle_assignment')
        .select('id')
        .eq('employee_id', userId)
        .maybeSingle();

      let operation;
      if (existingAssignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('shuttle_assignment')
          .update({
            vehicle_id: shuttleId,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', existingAssignment.id);
        
        operation = "updated";
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('shuttle_assignment')
          .insert({
            vehicle_id: shuttleId,
            employee_id: userId,
            created_by: user.id,
            date_assigned_for: new Date().toISOString().split('T')[0] // Today's date
          });
        
        operation = "created";
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Reset form and searches
        setShuttleSearch('');
        setUserSearch('');
      }, 1500);
      
      return operation;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign shuttle');
      console.error('Error creating shuttle assignment:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="">
          Assign Shuttle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Shuttle</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
                Shuttle assignment updated successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Shuttle Selection */}
              <div>
                <label htmlFor="shuttle" className="block mb-2 font-medium">
                  Select Shuttle:
                </label>
                <Input
                  type="text"
                  placeholder="Search shuttles..."
                  value={shuttleSearch}
                  onChange={(e) => setShuttleSearch(e.target.value)}
                  className="mb-2"
                />
                <select
                  id="shuttle"
                  name="shuttle"
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting}
                  size={Math.min(5, Math.max(3, filteredShuttles.length))}
                >
                  <option value="">-- Select a shuttle --</option>
                  {filteredShuttles.map(shuttle => (
                    <option key={shuttle.id} value={shuttle.id}>
                      {shuttle.name}
                    </option>
                  ))}
                </select>
                {filteredShuttles.length === 0 && shuttleSearch && (
                  <p className="text-sm text-gray-500 mt-1">No matching shuttles found</p>
                )}
              </div>

              {/* User Selection */}
              <div>
                <label htmlFor="user" className="block mb-2 font-medium">
                  Select User:
                </label>
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mb-2"
                />
                <select
                  id="user"
                  name="user"
                  className="w-full p-2 border rounded"
                  required
                  disabled={isSubmitting}
                  size={Math.min(5, Math.max(3, filteredUsers.length))}
                >
                  <option value="">-- Select a user --</option>
                  {filteredUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} 
                    </option>
                  ))}
                </select>
                {filteredUsers.length === 0 && userSearch && (
                  <p className="text-sm text-gray-500 mt-1">No matching users found</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Update Shuttle Assignment'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}