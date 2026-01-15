'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react'; // Assuming you use Lucide icons
import { deleteGroup } from '@/app/actions/group-operations';
import { Button } from '@/components/ui/button'; // Assuming you have a shadcn/ui button

export default function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Simple confirmation dialog
    const confirmed = window.confirm("Are you sure? This will disband the group and unassign all vehicles.");
    
    if (confirmed) {
      startTransition(async () => {
        try {
          await deleteGroup(groupId);
        } catch (error) {
          alert("Failed to delete group. Check console.");
          console.error(error);
        }
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={isPending}
      className="text-red-400 hover:text-red-600 hover:bg-red-50"
      title="Delete Group"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}