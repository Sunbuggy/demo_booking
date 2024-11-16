'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { createClient } from '@/utils/supabase/client';
import { PopoverClose } from '@radix-ui/react-popover';

export default function AddToGroup({ user }: { user: string }) {
  const supabase = createClient();
  const [location, setLocation] = useState<'NV' | 'CA' | 'MI' | null>(null);
  const queryClient = useQueryClient();

  const addToGroupMutation = useMutation({
    mutationFn: async (newGroup: {
      user: string;
      location: 'NV' | 'CA' | 'MI';
    }) => {
      const { data, error } = await supabase
        .from('dispatch_groups')
        .upsert([newGroup]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatchGroups'] });
    }
  });

  function onSubmit() {
    if (location) {
      addToGroupMutation.mutate({ user, location });
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
        <Label htmlFor="location-group">Location</Label>
        <RadioGroup
          id="location-group"
          defaultValue="CA"
          onValueChange={(value) => setLocation(value as 'NV' | 'CA' | 'MI')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="CA" id="r1" />
            <Label htmlFor="r1">CA</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="NV" id="r2" />
            <Label htmlFor="r2">NV</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MI" id="r3" />
            <Label htmlFor="r3">MI</Label>
          </div>
        </RadioGroup>
        <PopoverClose asChild>
          <Button
            onClick={onSubmit}
            className="mt-4"
            disabled={addToGroupMutation.isPending}
          >
            {addToGroupMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
