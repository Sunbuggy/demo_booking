'use client';
import React from 'react';
import Card from '@/components/ui/Card';
import { useState } from 'react';
import { Button } from '../button';
import { createClient } from '@/utils/supabase/client';
import { insertIntoClockIn } from '@/utils/supabase/queries';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clock_in, setClockIn] = useState(false);
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [clockInTime, setClockinTime] = useState(
    clockInTimeStamp ? new Date(clockInTimeStamp) : undefined
  );
  //   const router = useRouter();
  //     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  // setIsSubmitting(true);

  //     }
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
      ).then((data) => {
        setClockIn(false);
        setClockinTime(new Date());
        console.log('data', data);
      });
    }
  }, [clock_in]);

  function clockInFn() {
    setClockIn(true);
    if (!location.latitude || !location.longitude) {
      alert('Please enable location services to clock in');
      setClockIn(false);
      return;
    }
  }

  if (user_role > 284)
    return (
      <Card title="Your Timeclock" description="Clocked in Status:">
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
            </div>
          )}
          {status === 'clocked_out' && 'Clocked Out'}
          {status === 'on_break' && 'On Break'}
        </div>
        <div className="flex justify-end">
          {status === 'clocked_out' && (
            <Button variant="positive" onClick={clockInFn}>
              Clock in
            </Button>
          )}
          {status === 'clocked_in' && (
            <div className="flex gap-5">
              <Button variant="secondary">Take Break</Button>
              <Button variant="destructive" form="checkoutForm">
                Clockout
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
};

export default ClockinForm;
