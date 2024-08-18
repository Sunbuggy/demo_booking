'use client';
import React from 'react';
import Card from '@/components/ui/Card';
import { useState } from 'react';
import { Button } from '../button';
import { createClient } from '@/utils/supabase/client';
import {
  insertIntoClockIn,
  insertIntoClockOut
} from '@/utils/supabase/queries';
import { useRouter } from 'next/navigation';
import { useToast } from '../use-toast';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';

const ClockinForm = ({
  user_role,
  user_id,
  status,
  clockInTimeStamp
}: {
  user_role: number;
  status: string;
  clockInTimeStamp?: string;
  user_id: string;
}) => {
  const [clock_in, setClockIn] = useState(false);
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [clockInTime, setClockinTime] = useState(
    clockInTimeStamp ? new Date(clockInTimeStamp) : undefined
  );
  const [clockOutTime, setClockOutTime] = useState<Date | undefined>(undefined);
  const [clockOut, setClockOut] = useState(false);
  const [nowTime, setNowTime] = useState('');
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      });
      setNowTime(timeString);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  });

  React.useEffect(() => {
    const channel = supabase
      .channel('clockin tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
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
    if ('geolocation' in navigator) {
      // Retrieve latitude & longitude coordinates from `navigator.geolocation` Web API
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ latitude, longitude });
      });
    }
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    if (clock_in) {
      insertIntoClockIn(
        supabase,
        user_id,
        location.latitude,
        location.longitude
      )
        .then((data) => {
          setClockIn(false);
          setClockinTime(new Date());
          toast({
            title: 'Success',
            description: `You have successfully clocked in.`,
            duration: 2000,
            variant: 'success'
          });
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: 'An error occurred while clocking in.',
            duration: 4000,
            variant: 'destructive'
          });
        });
    }
  }, [clock_in]);

  React.useEffect(() => {
    if (clockOut) {
      const totalClockinHours = calculateTimeSinceTimeElapsedInHours();
      insertIntoClockOut(
        createClient(),
        user_id,
        location.latitude,
        location.longitude,
        Number(totalClockinHours)
      )
        .then((data) => {
          setClockOut(false);
          setClockOutTime(new Date());
          toast({
            title: 'Success',
            description: `You have successfully clocked out at ${new Date().toLocaleTimeString()} .`,
            duration: 2000,
            variant: 'success'
          });
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: 'An error occurred while clocking out.',
            duration: 4000,
            variant: 'destructive'
          });
        });
    }
  }, [clockOut]);

  function calculateTimeElapsed() {
    if (clockInTime) {
      const currentTime = new Date();
      const difference = currentTime.getTime() - clockInTime.getTime();
      // Display in hh:mm format if the difference is less than 24 hours
      if (difference < 86400000) {
        const hours = Math.floor(difference / 3600000);
        const minutes = Math.floor((difference % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
      } else {
        return '24h+ Please adjust your time entry';
      }
    }
  }

  function calculateTimeSinceTimeElapsedInHours() {
    if (clockInTime) {
      const currentTime = new Date();
      const difference = currentTime.getTime() - clockInTime.getTime();
      const hours = (difference / 3600000).toFixed(2);
      return Number(hours);
    }
  }

  function clockInFn() {
    setClockIn(true);
    if (!location.latitude || !location.longitude) {
      alert('Please enable location services to clock in');
      setClockIn(false);
      return;
    }
  }

  function clockOutFn() {
    setClockOut(true);
    if (!location.latitude || !location.longitude) {
      alert('Please enable location services to clock out');
      setClockOut(false);
      return;
    }
  }

  if (user_role > 284)
    return (
      <Card title="Your Timeclock" description="TimeSheet Status:">
        <div
          className={
            status === 'clocked_in'
              ? 'text-green-500'
              : status === 'clocked_out'
                ? 'text-red-500'
                : status === 'on_break'
                  ? 'text-amber-500'
                  : ''
          }
        >
          {status === 'clocked_in' && (
            <div className="flex gap-3">
              <p> Clocked In For:</p>
              <span className="text-purple-500">{calculateTimeElapsed()}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Clocked in since
                      <span className="m-1 text-purple-500">
                        {clockInTime?.toLocaleTimeString()},
                      </span>
                      <span className="m-1 text-purple-500">
                        {clockInTime?.toLocaleDateString()}
                      </span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {status === 'clocked_out' && 'Clocked Out'}
          {status === 'on_break' && 'On Break'}
        </div>
        <div className="flex justify-end">
          {status === 'clocked_out' && (
            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-green-500  text-zinc-50 hover:bg-green-500/90 dark:bg-green-900 dark:text-zinc-50 dark:hover:bg-green-900/90 h-10 px-4 py-2">
                {' '}
                Clock In
              </PopoverTrigger>
              <PopoverContent>
                <div>
                  <h1>
                    The time is <span className="m-2">{nowTime}</span> Do you
                    want to clock in?
                  </h1>
                </div>
                <PopoverClose asChild>
                  <Button variant="positive" onClick={clockInFn}>
                    Clock in
                  </Button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          )}
          {status === 'clocked_in' && (
            <div className="flex gap-5">
              <Button variant="secondary">Take Break</Button>
              <Popover>
                <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-red-500  text-zinc-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90 h-10 px-4 py-2">
                  {' '}
                  Clock Out
                </PopoverTrigger>

                <PopoverContent>
                  <div className="mb-5">
                    <h1>
                      The time is <span className="m-2">{nowTime}</span> Do you
                      want to clock Out?
                    </h1>
                  </div>
                  <div className="flex flex-row-reverse justify-between">
                    <PopoverClose asChild>
                      <Button variant="destructive" onClick={clockOutFn}>
                        Clockout
                      </Button>
                    </PopoverClose>
                    <PopoverClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </Card>
    );
};

export default ClockinForm;
