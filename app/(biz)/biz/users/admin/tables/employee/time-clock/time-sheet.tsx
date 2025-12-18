'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range';
import { DateRange } from 'react-day-picker';
import { TimeSheet } from '@/components/ui/AccountForms/ClockinForm';
import { createClient } from '@/utils/supabase/client';
import { UserType } from '../../../../types';
import { fetchTimeSheetRequests } from '@/utils/supabase/queries';

const TimeSheetAdjustment = ({ user }: { user?: UserType }) => {
  const daylastWeek = new Date().getDate() - 7;
  const today = new Date().getDate();
  const [historyDateRange, setHistoryDateRange] = React.useState<
    DateRange | undefined
  >({
    from: new Date(new Date().setDate(daylastWeek)), // set to: lastWeek
    to: new Date(new Date().setDate(today)) // set to: today
  });
  const [historyTimeSheets, setHistoryTimeSheets] = React.useState<TimeSheet[]>(
    []
  );
  const [getTimesheets, setGetTimesheets] = React.useState(false);

  React.useEffect(() => {
    if (getTimesheets) {
      if (user) {
        fetchTimeSheetRequests(
          createClient(),
          user.id,
          historyDateRange?.from?.toISOString() || '',
          historyDateRange?.to?.toISOString() || ''
        )
          .then((data) => {
            const timeSheets = data as TimeSheet[];
            setHistoryTimeSheets(timeSheets);
          })
          .catch((error) => {
            console.error(error);
          });
      }
      setGetTimesheets(false);
    }
  }, [getTimesheets]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Time Sheet Requests</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-full">
        <DialogHeader>
          <DialogTitle>Timesheet History </DialogTitle>
          <DialogDescription>
            Choose a date range to view your timesheet history.
          </DialogDescription>
        </DialogHeader>

        <DatePickerWithRange
          setHistoryDateRange={setHistoryDateRange}
          historyDateRange={historyDateRange}
        />
        {historyTimeSheets.length === 0 && (
          <p>No timesheets found for this range</p>
        )}
        {historyTimeSheets.length > 0 && (
          <div>
            <h2>TimeSheet History:</h2>
            {historyTimeSheets.map((timesheet) => (
              <table
                key={timesheet.id}
                style={{
                  border: '1px solid black',
                  padding: '5px',
                  fontSize: '12px'
                }}
              >
                <thead>
                  <tr>
                    <th className="p-1 border-1">Start Date</th>
                    <th className="p-1 border-1">In by</th>
                    <th className="p-1 border-1">End Date</th>
                    <th className="p-1 border-1">Out By</th>
                    <th className="p-1 border-1">Reason</th>
                    <th className="p-1 border-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1 border-1">
                      {new Date(timesheet.start_time).toLocaleDateString()}
                    </td>
                    <td className="p-1 border-1">
                      {/* eliminate seconds by removing the second occurence of : */}
                      {new Date(timesheet.start_time)
                        .toLocaleTimeString()
                        .slice(0, -3)}
                    </td>
                    <td className="p-1 border-1">
                      {new Date(timesheet.end_time).toLocaleDateString()}
                    </td>
                    <td className="p-1 border-1">
                      {new Date(timesheet.end_time)
                        .toLocaleTimeString()
                        .slice(0, -3)}
                    </td>
                    <td className="p-1 border-1">{timesheet.reason}</td>
                    <td
                      className={`p-1 border-1 ${timesheet.status == 'pending' ? ' text-amber-500' : timesheet.status === 'accepted' ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {timesheet.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={() => setGetTimesheets(true)}>
            Display Timesheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSheetAdjustment;
