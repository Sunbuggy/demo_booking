'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserType } from '../../../../types';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { createClient } from '@/utils/supabase/client';
import { getClockedInTime, insertIntoClockOut } from '@/utils/supabase/queries';
import { useToast } from '@/components/ui/use-toast';

const ClockOut = ({ user }: { user?: UserType }) => {
  const supabase = await createClient();
  const { toast } = useToast();
  const [clockOut, setClockOut] = React.useState<boolean>(false);
  const [clockedInTime, setClockedInTime] = React.useState<Date | undefined>(
    undefined
  );
  const [clockOutTime, setClockOutTime] = React.useState<Date | undefined>(
    new Date(new Date().toISOString())
  );

  React.useEffect(() => {
    if (user) {
      getClockedInTime(supabase, user.id).then((res) => {
        if (res[0].clock_in_time) {
          setClockedInTime(res[0].clock_in_time);
        }
      });
    }
  }, []);

  React.useEffect(() => {
    if (clockOut) {
      if (clockOutTime && clockedInTime) {
        const isoClockOutTime = clockOutTime.toISOString();
        const totalClockInHours = Math.abs(
          (clockOutTime.getTime() - new Date(clockedInTime).getTime()) /
            (1000 * 60 * 60)
        );

        if (user) {
          insertIntoClockOut(
            supabase,
            user?.id,
            0,
            0,
            Number(totalClockInHours.toFixed(2)),
            isoClockOutTime
          )
            .then((res) => {
              toast({
                title: 'Success',
                description: 'User has been clocked out',
                duration: 2000,
                variant: 'success'
              });
            })
            .catch((err) => {
              console.error(err);
            });
        }
      }
    }
    setClockOut(false);
  }, [clockOut]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={'destructive'}>
          Clock Out User {/** Clock out wizard should open */}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you Sure You want to clock out {user?.full_name}?
          </DialogTitle>
          <DialogDescription>
            Choose time for clock out or just clockout now
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <DateTimePicker
            hourCycle={12}
            value={clockOutTime}
            onChange={(e) => {
              setClockOutTime(e);
            }}
          />
          <Button onClick={() => setClockOut(true)}>Clockout</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClockOut;
