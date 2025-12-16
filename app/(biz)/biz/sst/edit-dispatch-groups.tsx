'use client';

import { createClient } from '@/utils/supabase/client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trash, Plus, Search, MapPin } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AddToGroup from './add-to-group';

type Users = {
  id: string;
  full_name: string;
  user_level: number;
};

type DispatchGroup = {
  user: string;
  location: 'NV' | 'CA' | 'MI';
};

const locations = ['NV', 'CA', 'MI'] as const;

export default function EditDispatchGroups() {
  const [users, setUsers] = useState<Users[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dispatchGroups, setDispatchGroups] = useState<DispatchGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = await createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: usersData, error: usersError },
        { data: dispatchGroupsData, error: dispatchGroupsError },
        {
          data: { user }
        }
      ] = await Promise.all([
        supabase.from('users').select('id, full_name, user_level'),
        supabase.from('dispatch_groups').select('user, location'),
        supabase.auth.getUser()
      ]);

      if (!user) {
        return router.push('/login');
      }

      setCurrentUser(user);

      if (usersError) {
        console.error(usersError);
      } else {
        setUsers(
          usersData?.map((user) => ({
            ...user,
            full_name: user.full_name ?? '',
            user_level: user.user_level ?? 100
          })) ?? []
        );
      }

      if (dispatchGroupsError) {
        console.error(dispatchGroupsError);
      } else {
        setDispatchGroups(
          dispatchGroupsData?.map((group) => ({
            user: group.user ?? '',
            location: group.location ?? 'NV'
          })) ?? []
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime dispatch groups')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch_groups' },
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

  const handleDelete = async (userId: string, location: 'NV' | 'CA' | 'MI') => {
    const { error } = await supabase
      .from('dispatch_groups')
      .delete()
      .eq('user', userId)
      .eq('location', location);

    if (error) {
      console.error('Error deleting dispatch group:', error);
    } else {
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

  const handleAddToGroup = async (
    userId: string,
    location: 'NV' | 'CA' | 'MI'
  ) => {
    const { error } = await supabase
      .from('dispatch_groups')
      .insert({ user: userId, location });

    if (error) {
      console.error('Error adding to dispatch group:', error);
    } else {
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

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <div className="flex space-x-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Dispatch Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-users"
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div>
            <Label className="text-base">Filter by Location</Label>
            <div className="flex flex-wrap gap-4 mt-2">
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
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                      {user.full_name}({user.user_level})
                    </span>
                    <div className="flex gap-2 items-center">
                      {userGroups.map((group) => (
                        <Badge
                          key={group.location}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          {group.location}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={() =>
                              handleDelete(user.id, group.location)
                            }
                          >
                            <Trash className="h-3 w-3" />
                            <span className="sr-only">
                              Remove from {group.location}
                            </span>
                          </Button>
                        </Badge>
                      ))}
                      {userGroups.length < 3 && <AddToGroup user={user.id} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}