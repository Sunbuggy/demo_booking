'use client';
import React from 'react';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../button';
const ClockinForm = ({
  user_role,
  status
}: {
  user_role: number;
  status: string;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  //   const router = useRouter();
  //     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  // setIsSubmitting(true);

  //     }
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
          {status === 'clocked_in' && 'Clocked In'}
          {status === 'clocked_out' && 'Clocked Out'}
          {status === 'on_break' && 'On Break'}
        </div>
        <div className="flex justify-end">
          {status === 'clocked_out' && (
            <Button variant="positive" form="checkinForm">
              Clockin
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
