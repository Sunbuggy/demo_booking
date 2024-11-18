'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { createClient } from '@/utils/supabase/client';
import { PopoverClose } from '@radix-ui/react-popover';

export default function AddToGroup({ user }: { user: string }) {
  const supabase = createClient();
  const [locations, setLocations] = useState<('NV' | 'CA' | 'MI')[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function fetchUserLocations() {
      const { data, error } = await supabase
        .from('dispatch_groups')
        .select('location')
        .eq('user', user);
      if (error) {
        console.error(error);
        return;
      }
      setLocations(
        data
          .filter(
            (item: { location: 'NV' | 'CA' | 'MI' | null }) =>
              item.location !== null
          )
          .map(
            (item: { location: 'NV' | 'CA' | 'MI' | null }) =>
              item.location as 'NV' | 'CA' | 'MI'
          )
      );
    }
    fetchUserLocations();
  }, [supabase, user]);

  const addToGroupMutation = useMutation({
    mutationFn: async (
      newGroups: {
        user: string;
        location: 'NV' | 'CA' | 'MI';
      }[]
    ) => {
      const { data, error } = await supabase
        .from('dispatch_groups')
        .upsert(newGroups);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchGroups'] });
    }
  });

  function onSubmit() {
    if (locations.length > 0) {
      const newGroups = locations.map((location) => ({ user, location }));
      addToGroupMutation.mutate(newGroups);
      window.location.reload();
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Add to dispatch group">
          +
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Label htmlFor="location-group">Locations</Label>
        <div className="space-y-2">
          {(['CA', 'NV', 'MI'] as const).map((location) => (
            <div key={location} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location}`}
                checked={locations.includes(location)}
                onCheckedChange={(checked) => {
                  setLocations((prev) =>
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
        <PopoverClose asChild>
          <Button
            onClick={onSubmit}
            className="mt-4"
            disabled={addToGroupMutation.isPending || locations.length === 0}
          >
            {addToGroupMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
