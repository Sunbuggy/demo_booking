import React from 'react';
import PreviousRequests from './previous-requests';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { DateTimePicker } from '../../datetime-picker';
import { Label } from '../../label';
import { Textarea } from '../../textarea';
import { Button } from '../../button';
import { TimeSheet, TimeSheetRequestType } from '../ClockinForm';
import { DateRange } from 'react-day-picker';

const TimeAdjustment = ({
  timeSheetRequest,
  setTimeSheetRequest,
  setSubmitTimeSheet,
  historyTimeSheet,
  setGetTimesheets,
  setHistoryDateRange,
  historyDateRange
}: {
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
      <h1 className="text-2xl font-bold mb-5">Advanced</h1>
      <Dialog>
        <DialogTrigger className="green_button">
          Request Time Adjustment
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Time Adjustment Request </DialogTitle>
            <DialogDescription>
              Please provide a times and reason for your time adjustment
              request.
            </DialogDescription>
          </DialogHeader>

          <div>
            <PreviousRequests
              historyTimeSheets={historyTimeSheet}
              setGetTimesheets={setGetTimesheets}
              setHistoryDateRange={setHistoryDateRange}
              historyDateRange={historyDateRange}
            />

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clockIn">Clock In Time</Label>
                <DateTimePicker
                  hourCycle={12}
                  value={timeSheetRequest.clockInTime || undefined}
                  onChange={(e) =>
                    setTimeSheetRequest({
                      ...timeSheetRequest,
                      clockInTime: e || null
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="clockOut">Clock Out Time</label>
                <DateTimePicker
                  hourCycle={12}
                  value={timeSheetRequest.clockOutTime || undefined}
                  onChange={(e) =>
                    setTimeSheetRequest({
                      ...timeSheetRequest,
                      clockOutTime: e || null
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  className=""
                  value={timeSheetRequest.reason}
                  onChange={(e) =>
                    setTimeSheetRequest({
                      ...timeSheetRequest,
                      reason: e.target.value
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" onClick={() => setSubmitTimeSheet(true)}>
                Submit Request
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeAdjustment;
