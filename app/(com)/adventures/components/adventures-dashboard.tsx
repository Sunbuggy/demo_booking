'use client';

import { useState, useEffect } from 'react';
import { AdventuresList } from './adventures-list';
import { AdventureForm } from './adventure-form';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Define the Adventure type
export interface Adventure {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  imageUrl: string;
  videoUrl?: string;
}

export function AdventuresDashboard() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAdventure, setEditingAdventure] = useState<Adventure | null>(
    null
  );
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const supabase = createClient();

  const fetchAdventures = async () => {
    const { data, error } = await supabase
      .from('adventure')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching adventures',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setAdventures(data as Adventure[]);
    }
  };

  useEffect(() => {
    fetchAdventures();
  }, []);

  return (
    <div>
      {!isCreating && !editingAdventure && (
        <Button onClick={() => setIsCreating(true)} className="mb-4">
          <PlusIcon className="mr-2 h-4 w-4" /> Add Adventure
        </Button>
      )}
      {(isCreating || editingAdventure) && (
        <AdventureForm
          adventure={editingAdventure}
          onCancel={() => {
            setIsCreating(false);
            setEditingAdventure(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingAdventure(null);
            fetchAdventures(); // Refresh the list after saving
          }}
        />
      )}
      <AdventuresList
        adventures={adventures}
        onEdit={setEditingAdventure}
        fetchAdventures={fetchAdventures}
      />
    </div>
  );
}
