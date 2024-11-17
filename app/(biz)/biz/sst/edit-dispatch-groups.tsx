'use client';

import { createClient } from '@/utils/supabase/client';
import React, { useEffect, useState, useMemo } from 'react';
import AddToGroup from './add-to-group';
import { useRouter } from 'next/navigation';
import { TrashIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type Users = {
  id: string;
  full_name: string;
};

type DispatchGroup = {
  user: string;
  location: 'NV' | 'CA' | 'MI';
};

const EditDispatchGroups = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dispatchGroups, setDispatchGroups] = useState<DispatchGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: usersData, error: usersError },
        { data: dispatchGroupsData, error: dispatchGroupsError }
      ] = await Promise.all([
        supabase.from('users').select('id, full_name'),
        supabase.from('dispatch_groups').select('user, location')
      ]);
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        return router.push('/login');
      }
      if (user) {
        setCurrentUser(user);
      }

      if (usersError) {
        console.error(usersError);
      } else {
        setUsers(
          usersData.map((user) => ({
            ...user,
            full_name: user.full_name ?? ''
          }))
        );
      }

      if (dispatchGroupsError) {
        console.error(dispatchGroupsError);
      } else {
        setDispatchGroups(
          dispatchGroupsData.map((group) => ({
            user: group.user ?? '',
            location: group.location ?? 'NV'
          }))
        );
      }
    };

    fetchData();
  }, [supabase, router]);

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime dispatch groups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatch_groups'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedLocations.length === 0 ||
          selectedLocations.some((location) =>
            dispatchGroups
              .filter((group) => group.user === user.id)
              .map((group) => group.location)
              .includes(location as 'NV' | 'CA' | 'MI')
          ))
    );
  }, [users, searchTerm, selectedLocations, dispatchGroups]);

  const locations = ['NV', 'CA', 'MI'];

  const handleDelete = async (userId: string, location: string) => {
    const { error } = await supabase
      .from('dispatch_groups')
      .delete()
      .eq('user', userId)
      .eq('location', location);

    if (error) {
      console.error('Error deleting dispatch group:', error);
    } else {
      // Refresh the dispatch groups data
      const { data, error } = await supabase
        .from('dispatch_groups')
        .select('user, location');
      if (error) {
        console.error('Error fetching updated dispatch groups:', error);
      } else {
        setDispatchGroups(
          data.map((group) => ({
            user: group.user ?? '',
            location: group.location ?? 'NV'
          }))
        );
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="search-users">Search Users</Label>
          <Input
            id="search-users"
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label>Filter by Location</Label>
          <div className="flex space-x-4 mt-2">
            {locations.map((location) => (
              <div key={location} className="flex items-center space-x-2">
                <Checkbox
                  id={`location-${location}`}
                  checked={selectedLocations.includes(location)}
                  onCheckedChange={(checked) => {
                    setSelectedLocations((prev) =>
                      checked
                        ? [...prev, location]
                        : prev.filter((loc) => loc !== location)
                    );
                  }}
                />
                <Label htmlFor={`location-${location}`}>{location}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const userGroups = dispatchGroups.filter(
            (group) => group.user === user.id
          );
          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 shadow rounded"
            >
              <span className="text-lg font-medium">{user.full_name}</span>
              <div className="flex gap-2 items-center">
                {userGroups.map((group) => (
                  <div key={group.location} className="flex items-center gap-1">
                    <span className="text-purple-600">{group.location}</span>
                    <TrashIcon
                      className="cursor-pointer w-4 h-4"
                      onClick={() => handleDelete(user.id, group.location)}
                      aria-label={`Delete ${user.full_name} from ${group.location}`}
                    />
                  </div>
                ))}
                {userGroups.length < 3 && <AddToGroup user={user.id} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EditDispatchGroups;
