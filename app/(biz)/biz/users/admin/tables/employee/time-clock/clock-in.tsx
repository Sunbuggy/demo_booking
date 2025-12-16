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
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getClockedInTime, insertIntoClockIn } from '@/utils/supabase/queries';
import { UserType } from '../../../../types';
import { DateTimePicker } from '@/components/ui/datetime-picker';
const ClockIn = ({ user }: { user?: UserType }) => {
  const supabase = await createClient();
  const { toast } = useToast();
  const [clockIn, setClockIn] = React.useState<boolean>(false);
  const [clockedInTime, setClockedInTime] = React.useState<Date | undefined>(
    undefined
  );
  const [nowTime, setNowTime] = React.useState<Date | undefined>(
    new Date(new Date().toISOString())
  );
  React.useEffect(() => {
    if (user) {
      if (clockIn) {
        getClockedInTime(supabase, user.id).then((res) => {
          if (res[0].clock_in_time) {
            setClockedInTime(res[0].clock_in_time);
          }
        });
      }
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      if (clockIn) {
        insertIntoClockIn(supabase, user.id, 0, 0)
          .then((res) => {
            toast({
              title: 'Success',
              description: 'Clocked in successfully',
              variant: 'success'
            });
          })
          .catch((err) => {
            toast({
              title: 'Error',
              description: 'Error clocking in',
              variant: 'destructive'
            });
          });
      }
    }

    setClockIn(false);
  }, [clockIn]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={'positive'}>
          Clock In User {/** Clock in wizard should open */}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you Sure You want to clock in {user?.full_name}?
          </DialogTitle>
          <DialogDescription>
            Choose time for clock out or just clockin now
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <DateTimePicker
            hourCycle={12}
            value={nowTime}
            onChange={(e) => {
              setNowTime(e);
            }}
          />
          <Button onClick={() => setClockIn(true)}>Clock In</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClockIn;
