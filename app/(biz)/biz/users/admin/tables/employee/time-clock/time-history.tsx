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
import { DateRange } from 'react-day-picker';
import { TimeClockEventsType } from '@/components/ui/AccountForms/ClockinForm';
import { addDays } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-range';
import { UserType } from '../../../../types';
import { createClient } from '@/utils/supabase/client';
import { fetchEmployeeTimeClockEntryData } from '@/utils/supabase/queries';
import TimeSheetAdjustment from './time-sheet';

const HistoryTimeClockEvents = ({ user }: { user: UserType }) => {
  const [timeClockHistoryData, setTimeClockHistoryData] = React.useState<
    TimeClockEventsType[]
  >([]);
  const [timeClockEventHistoryDateRange, setTimeClockEventHistoryDateRange] =
    React.useState<DateRange | undefined>({
      // From day of last week to today
      from: addDays(new Date(), -7),
      to: new Date()
    });
  const supabase = await createClient();

  React.useEffect(() => {
    if (
      timeClockEventHistoryDateRange?.from !== undefined &&
      timeClockEventHistoryDateRange?.to !== undefined
    ) {
      if (user) {
        fetchEmployeeTimeClockEntryData(
          supabase,
          user.id,
          timeClockEventHistoryDateRange.from.toISOString() || '',
          timeClockEventHistoryDateRange.to.toISOString() || ''
        )
          .then((data) => {
            setTimeClockHistoryData(data as unknown as TimeClockEventsType[]);
          })
          .catch((error) => {
            console.error(error);
          });
      }
    }
  }, [timeClockEventHistoryDateRange]);

  return (
    <div>
      <Dialog>
        <DialogTrigger className="white_button">
          View Previous TimeClock Events
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>TimeClock Events History</DialogTitle>
            <DialogDescription>
              TimeClock Event History Between{' '}
              {timeClockEventHistoryDateRange?.from?.toLocaleDateString()} and{' '}
              {timeClockEventHistoryDateRange?.to?.toLocaleDateString()}
            </DialogDescription>
            <DatePickerWithRange
              historyDateRange={timeClockEventHistoryDateRange}
              setHistoryDateRange={setTimeClockEventHistoryDateRange}
            />
          </DialogHeader>
          {timeClockHistoryData.length > 0 && (
            <table className="border">
              <thead>
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Clock In</th>
                  <th className="border p-2">Clock Out</th>
                  <th className="border p-2">Duration (hr)</th>
                </tr>
              </thead>
              <tbody>
                {timeClockHistoryData
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((timeClockEvent) => (
                    <tr key={timeClockEvent?.id}>
                      <td className="border p-2">
                        {new Date(timeClockEvent.date).toLocaleDateString()}
                      </td>
                      <td className="border p-2">
                        {new Date(
                          timeClockEvent.clock_in?.clock_in_time ?? ''
                        ).toLocaleTimeString()}
                      </td>
                      <td className="border p-2">
                        {isNaN(
                          new Date(
                            timeClockEvent.clock_out?.clock_out_time ?? ''
                          ).getTime()
                        )
                          ? 'None'
                          : new Date(
                              timeClockEvent.clock_out?.clock_out_time ?? ''
                            ).toLocaleTimeString()}
                      </td>
                      <td className="border p-2">
                        {isNaN(
                          (new Date(
                            timeClockEvent.clock_out?.clock_out_time ?? ''
                          ).getTime() -
                            new Date(
                              timeClockEvent.clock_in?.clock_in_time ?? ''
                            ).getTime()) /
                            3600000
                        )
                          ? 'None'
                          : (
                              (new Date(
                                timeClockEvent.clock_out?.clock_out_time ?? ''
                              ).getTime() -
                                new Date(
                                  timeClockEvent.clock_in?.clock_in_time ?? ''
                                ).getTime()) /
                              3600000
                            ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          <TimeSheetAdjustment user={user} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTimeClockEvents;
