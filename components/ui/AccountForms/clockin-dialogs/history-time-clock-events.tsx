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
const HistoryTimeClockEvents = ({
  timeClockEventHistoryDateRange,
  setTimeClockEventHistoryDateRange,
  timeClockHistoryData,
  timeSheetRequest,
  setTimeSheetRequest,
  setSubmitTimeSheet,
  historyTimeSheet,
  setGetTimesheets,
  setHistoryDateRange,
  historyDateRange
}: {
  timeClockEventHistoryDateRange: DateRange | undefined;
  setTimeClockEventHistoryDateRange: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  timeClockHistoryData: TimeClockEventsType[];
  timeSheetRequest: TimeSheetRequestType;
  setTimeSheetRequest: React.Dispatch<
    React.SetStateAction<TimeSheetRequestType>
  >;
  setSubmitTimeSheet: React.Dispatch<React.SetStateAction<boolean>>;
  historyTimeSheet: TimeSheet[];
  setGetTimesheets: React.Dispatch<React.SetStateAction<boolean>>;
  setHistoryDateRange: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  historyDateRange: DateRange | undefined;
}) => {
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
          {timeClockHistoryData.length > 0 && (
            <div>
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
                    // sort by date
                    .sort((a, b) => {
                      return (
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                      );
                    })
                    .map((timeClockEvent) => (
                      <tr key={timeClockEvent?.id}>
                        <td className="border p-2">
                          {new Date(timeClockEvent.date).toLocaleDateString()}
                        </td>
                        <td className="border p-2">
                          {new Date(
                            timeClockEvent.clock_in.clock_in_time
                          ).toLocaleTimeString()}
                        </td>
                        <td className="border p-2">
                          {new Date(
                            timeClockEvent.clock_out.clock_out_time
                          ).toLocaleTimeString()}
                        </td>
                        <td className="border p-2">
                          {(
                            (new Date(
                              timeClockEvent.clock_out.clock_out_time
                            ).getTime() -
                              new Date(
                                timeClockEvent.clock_in.clock_in_time
                              ).getTime()) /
                            3600000
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <TimeAdjustment
            historyTimeSheet={historyTimeSheet}
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
