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
import { DatePickerWithRange } from '../../date-range';
import {
  TimeClockEventsType,
  TimeSheet,
  TimeSheetRequestType
} from '../ClockinForm';
import TimeAdjustment from './time-adjustments';
import { createClient } from '@/utils/supabase/client';
import {
  createTimeSheetRequest,
  fetchEmployeeTimeClockEntryData,
  fetchTimeSheetRequests
} from '@/utils/supabase/queries';
import { useToast } from '../../use-toast';
import { addDays } from 'date-fns';
import HistoryTable from './history-table';
const HistoryTimeClockEvents = ({ user_id }: { user_id: string }) => {
  const supabase = createClient();
  const { toast } = useToast();
  const [getTimesheets, setGetTimesheets] = React.useState(false);

  const [submitTimeSheet, setSubmitTimeSheet] = React.useState(false);
  const [historyTimeSheets, setHistoryTimeSheets] = React.useState<TimeSheet[]>(
    []
  );
  const [timeClockEventHistoryDateRange, setTimeClockEventHistoryDateRange] =
    React.useState<DateRange | undefined>({
      // From day of last week to today
      from: addDays(new Date(), -7),
      to: new Date()
    });

  const [timeClockHistoryData, setTimeClockHistoryData] = React.useState<
    TimeClockEventsType[]
  >([]);
  const [timeSheetRequest, setTimeSheetRequest] =
    React.useState<TimeSheetRequestType>({
      clockInTime: null,
      clockOutTime: null,
      reason: ''
    });

  const [historyDateRange, setHistoryDateRange] = React.useState<
    DateRange | undefined
  >({
    // Initial date range should be from last week to this week
    from: addDays(new Date(), -7),
    to: new Date()
  });

  // TimeSheet Request effect
  React.useEffect(() => {
    if (submitTimeSheet) {
      if (timeSheetRequest.clockInTime && timeSheetRequest.clockOutTime) {
        createTimeSheetRequest(
          createClient(),
          user_id,
          timeSheetRequest.clockInTime,
          timeSheetRequest.clockOutTime,
          timeSheetRequest.reason
        )
          .then((data) => {
            toast({
              title: 'Success',
              description: 'Your time adjustment request has been submitted.',
              duration: 4000,
              variant: 'success'
            });
          })
          .catch((error) => {
            toast({
              title: 'Error',
              description:
                'An error occurred while submitting your time adjustment request.',
              duration: 4000,
              variant: 'destructive'
            });
          });
      }
      setSubmitTimeSheet(false);
    }
  }, [submitTimeSheet]);

  // Fetch timesheets
  React.useEffect(() => {
    if (getTimesheets) {
      fetchTimeSheetRequests(
        createClient(),
        user_id,
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
      setGetTimesheets(false);
    }
  }, [getTimesheets]);

  // Fetch time clock history data
  React.useEffect(() => {
    if (
      timeClockEventHistoryDateRange?.from !== undefined &&
      timeClockEventHistoryDateRange?.to !== undefined
    ) {
      fetchEmployeeTimeClockEntryData(
        supabase,
        user_id,
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
  }, [timeClockEventHistoryDateRange]);
  return (
    <div className="m-4">
      <Dialog>
        <DialogTrigger className="green_button">
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
          <HistoryTable timeClockHistoryData={timeClockHistoryData} />

          <TimeAdjustment
            historyTimeSheet={historyTimeSheets}
            setGetTimesheets={setGetTimesheets}
            setHistoryDateRange={setHistoryDateRange}
            setSubmitTimeSheet={setSubmitTimeSheet}
            setTimeSheetRequest={setTimeSheetRequest}
            timeSheetRequest={timeSheetRequest}
            historyDateRange={historyDateRange}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryTimeClockEvents;
