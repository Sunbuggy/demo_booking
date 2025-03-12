'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Adventure } from './adventures-dashboard';
import { createClient } from '@/utils/supabase/client';

interface AdventuresListProps {
  adventures: Adventure[];
  onEdit: (adventure: Adventure) => void;
  fetchAdventures: () => void;
}
const supabase = createClient();

export function AdventuresList({
  adventures,
  onEdit,
  fetchAdventures
}: AdventuresListProps) {
  const { toast } = useToast();

  async function deleteAdventure(id: string) {
    const { error } = await supabase.from('adventure').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting adventure',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Adventure deleted',
        description: 'The adventure has been successfully deleted.'
      });
      // Fetch adventures again after deletion
      fetchAdventures();
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Duration (minutes)</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adventures.map((adventure) => (
          <TableRow key={adventure.id}>
            <TableCell>{adventure.title}</TableCell>
            <TableCell>{adventure.duration_minutes}</TableCell>
            <TableCell>
              <Button variant="ghost" onClick={() => onEdit(adventure)}>
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => deleteAdventure(adventure.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
