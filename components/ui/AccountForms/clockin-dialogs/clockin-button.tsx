'use client';
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../../tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from '../../popover';
import { Button } from '../../button';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '../../use-toast';
import {
  getSessionBreakStartTime,
  insertIntoBreak,
  insertIntoBreakEnd,
  insertIntoClockIn,
  insertIntoClockOut
} from '@/utils/supabase/queries';
import ToggleShowRev from './toggle-show-rev';
const ClockinButton = ({
  clockInTimeStamp,
  user_id,
  status,
  user_level
}: {
  clockInTimeStamp: string | undefined;
  user_id: string;
  status: string;
  user_level?: number;
}) => {
  const [clock_in, setClockIn] = React.useState(false);
  const [location, setLocation] = React.useState({ latitude: 0, longitude: 0 });
  const [clockInTime, setClockinTime] = React.useState(
    clockInTimeStamp ? new Date(clockInTimeStamp) : undefined
  );
  const [clockOutTime, setClockOutTime] = React.useState<Date | undefined>(
    undefined
  );
  const [clockOut, setClockOut] = React.useState(false);
  const [onBreak, setOnBreak] = React.useState(status === 'on_break');
  const [freshBreak, setFreshBreak] = React.useState(false);
  const [endBreak, setEndBreak] = React.useState(false);
  const [nowTime, setNowTime] = React.useState('');
  const [timeSinceBreak, setTimeSinceBreak] = React.useState<string | null>(
    'loading...'
  );
  const supabase = createClient();
  const router = useRouter();

  const { toast } = useToast();
  // if route contains dcos, display cost
  // get path from router
  const path = usePathname();
  // pathname consists of /biz/date where date is in the format of yyyy-mm-dd checked with regex
  const dateFormatRegex = /\d{4}-\d{2}-\d{2}/;
  const isCorrectPath = path.match(
    new RegExp(`^/biz/${dateFormatRegex.source}$`)
  );

  // Update the real time every second
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

  // Subscribe to changes in the users table
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

  // Get location coordinates
  React.useEffect(() => {
    if ('geolocation' in navigator) {
      // Retrieve latitude & longitude coordinates from `navigator.geolocation` Web API
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude, longitude } = coords;
        setLocation({ latitude, longitude });
      });
    }
  }, []);

  // Clockin effect
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

  // Clockout effect
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

  // Fresh Break effect
  React.useEffect(() => {
    if (freshBreak) {
      // if fresh break, insert into break table
      insertIntoBreak(createClient(), user_id)
        .then((data) => {
          toast({
            title: 'Success',
            description: `You have successfully taken a break at ${new Date().toLocaleTimeString()} .`,
            duration: 2000,
            variant: 'success'
          });
          setFreshBreak(false);
          setOnBreak(true);
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: 'An error occurred while taking a break.',
            duration: 4000,
            variant: 'destructive'
          });
          console.error(error);
        });
    }
  }, [freshBreak]);

  // Count time since break
  React.useEffect(() => {
    if (onBreak) {
      getSessionBreakStartTime(supabase, user_id)
        .then((data) => {
          if (clockInTime) {
            // show every second
            const timer = setInterval(() => {
              const breakStartTime = data[0].break_start;
              // get difference between clockintime and breakStartTime
              const difference =
                new Date().getTime() - new Date(breakStartTime).getTime();
              // hh:mm:ss format
              const hours = Math.floor(difference / 3600000);
              const minutes = Math.floor((difference % 3600000) / 60000);
              const seconds = Math.floor((difference % 60000) / 1000);
              setTimeSinceBreak(` ${hours}:${minutes}:${seconds}`);
            }, 1000);

            return () => {
              clearInterval(timer);
            };
          }
        })
        .catch((error) => console.error(error));
    }
  }, [onBreak]);

  // End Break effect
  React.useEffect(() => {
    if (endBreak) {
      insertIntoBreakEnd(createClient(), user_id)
        .then((data) => {
          setEndBreak(false);
          setTimeSinceBreak('');
          toast({
            title: 'Success',
            description: `You have successfully ended your break.`,
            duration: 2000,
            variant: 'success'
          });
        })
        .catch((error) => {
          toast({
            title: 'Error',
            description: 'An error occurred while ending your break.',
            duration: 4000,
            variant: 'destructive'
          });
          console.error(error);
        });
    }
  }, [endBreak]);

  // Time since break should be updated every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (timeSinceBreak) {
        setTimeSinceBreak(timeSinceBreak);
      }
    }, 60000); // 1 minute interval

    return () => clearInterval(interval);
  });

  function calculateTimeElapsedSinceClockIn() {
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

  function takeBreakFn() {
    setFreshBreak(true);

    if (!location.latitude || !location.longitude) {
      alert('Please enable location services to take a break');
      setOnBreak(false);
      return;
    }
  }

  function endBreakFn() {
    setEndBreak(true);
    if (!location.latitude || !location.longitude) {
      alert('Please enable location services to end break');
      setEndBreak(false);
      return;
    }
  }
  return (
    <div className="flex flex-col gap-4 items-center">
      <div
        className={`
        ${status === 'clocked_in' ? 'text-green-500' : ''}
        ${status === 'clocked_out' ? 'text-red-500' : ''}
        ${status === 'on_break' ? 'text-amber-500' : ''} text-sm
      `}
      >
        {status === 'clocked_in' && (
          <div>
            <div className="flex gap-2 mb-5">
              <p> Clocked In For:</p>
              <span className="text-purple-500 ">
                {calculateTimeElapsedSinceClockIn()}
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
              </span>
            </div>
          </div>
        )}
        {status === 'clocked_out' && 'Clocked Out'}
        {status === 'on_break' && `On Break for: ${timeSinceBreak}`}
      </div>
      <div className="flex justify-center">
        {status === 'clocked_out' && (
          <Popover>
            <PopoverTrigger className="green_button"> Clock In</PopoverTrigger>
            <PopoverContent>
              <div>
                <h1>
                  The time is <span className="m-2">{nowTime}</span> Do you want
                  to clock in?
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
            <Button variant="secondary" onClick={takeBreakFn}>
              Take Break
            </Button>
            <Popover>
              <PopoverTrigger className="red_button"> Clock Out</PopoverTrigger>

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
        {status === 'on_break' && (
          <Button variant="secondary" onClick={endBreakFn}>
            End Break
          </Button>
        )}
      </div>
      <div>
        {isCorrectPath && user_level && user_level > 899 && <ToggleShowRev />}
      </div>
    </div>
  );
};

export default ClockinButton;
