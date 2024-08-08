'use client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { launchGroup, unLaunchGroup } from '@/utils/old_db/actions';
import React from 'react';
import { PopoverGroups } from './popover_group';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PopoverClose } from '@radix-ui/react-popover';

const LaunchGroup = ({
  groupId,
  launched,
  groupName
}: {
  groupId: string;
  launched: boolean;
  groupName: string;
}) => {
  const [initLaunch, setInitLaunch] = React.useState(launched);
  const [unlounch, setUnlaunch] = React.useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime groups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
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

  React.useEffect(() => {
    if (initLaunch && !launched) {
      console.log('launching group');
      launchGroup(groupId).then((res) => {
        res.error
          ? toast({
              title: 'Error',
              description: 'An error occurred while launching group.',
              duration: 4000,
              variant: 'destructive'
            })
          : toast({
              title: 'Group Launched',
              description: `Group ${groupId} has been launched.`,
              duration: 2000,
              variant: 'success'
            });
      });
    }
    if (unlounch && launched) {
      console.log('unlaunching group');
      unLaunchGroup(groupId).then((res) => {
        res.error
          ? toast({
              title: 'Error',
              description: 'An error occurred while unlaunching group.',
              duration: 4000,
              variant: 'destructive'
            })
          : toast({
              title: 'Group Unlaunched',
              description: `Group ${groupId} has been unlaunched.`,
              duration: 2000,
              variant: 'success'
            });
      });
    }
    setUnlaunch(false);
    setInitLaunch(false);
  }, [initLaunch, unlounch]);

  return (
    <div>
      <PopoverGroups
        openText={
          launched ? <span className="text-green-500">Launched</span> : 'Launch'
        }
      >
        <h1>
          {launched
            ? 'Are you sure you want to remove the launch status from this group?'
            : `Are you sure you want to launch Group ${groupName}?`}
        </h1>
        <div className="flex justify-between mt-4">
          <PopoverClose asChild>
            <Button
              variant={launched ? 'destructive' : 'positive'}
              onClick={() => {
                !launched && setInitLaunch(true);
                launched && setUnlaunch(true);
                console.log('launched', initLaunch);
              }}
            >
              Yes
            </Button>
          </PopoverClose>
          <PopoverClose asChild>
            <Button>No</Button>
          </PopoverClose>
        </div>
      </PopoverGroups>
    </div>
  );
};

export default LaunchGroup;
