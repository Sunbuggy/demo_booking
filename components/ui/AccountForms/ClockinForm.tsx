'use client';
import React from 'react';
import Card from '@/components/ui/Card';
import HistoryTimeClockEvents from './clockin-dialogs/history-time-clock-events';
import ClockinButton from './clockin-dialogs/clockin-button';

export interface TimeSheet {
  created_at: string;
  end_time: string;
  id: string;
  reason: string;
  start_time: string;
  status: string;
  updated_at: string;
  user_id: string;
}

export interface TimeSheetRequestType {
  clockInTime: Date | null;
  clockOutTime: Date | null;
  reason: string;
}

export interface TimeClockEventsType {
  id: string;
  date: Date;
  user_id: string;
  clock_in: {
    clock_in_time: Date;
    lat: number | null;
    long: number | null;
  };
  clock_out: {
    clock_out_time: Date;
    lat: number | null;
    long: number | null;
  };
}
[];

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
  if (user_role > 284)
    return (
      <Card title="Your Timeclock" description="TimeSheet Status:">
        <ClockinButton
          clockInTimeStamp={clockInTimeStamp}
          status={status}
          user_id={user_id}
        />

        <HistoryTimeClockEvents user_id={user_id} />
        <div className="m-4"></div>
      </Card>
    );
};

export default ClockinForm;
