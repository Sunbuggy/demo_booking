'use client';
import React from 'react';
import { PopoverGroups } from './popover_group';
import { PopoverClose } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { deleteGroup } from '@/utils/old_db/actions';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

const DeleteGroup = ({ groupId }: { groupId: string }) => {
  const [yesDelete, setYesDelete] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (yesDelete) {
      deleteGroup(groupId)
        .then((res) => {
          if (res.error) {
            toast({
              title: 'Error',
              description: 'An error occurred while deleting the group.',
              duration: 5000,
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Group Deleted',
              description: 'The group has been deleted.',
              duration: 5000,
              variant: 'success'
            });
          }
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: 'An error occurred while deleting the group.',
            duration: 5000
          });
        });
    }
    setYesDelete(false);
  }, [yesDelete]);

  return (
    <PopoverGroups openText={<Trash2 className="h-4 w-4" />}>
      <h1>Are you sure you want to delete this group?</h1>
      <div className="flex justify-between">
        <PopoverClose>
          <Button
            size={'icon'}
            variant={'ghost'}
            className="text-xs p-1 h-[1em]"
          >
            No
          </Button>
        </PopoverClose>
        <div>
          <Button
            variant={'ghost'}
            className="text-red-500 text-xs p-1 h-[1em]"
            onClick={() => {
              setYesDelete(true);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </PopoverGroups>
  );
};

export default DeleteGroup;