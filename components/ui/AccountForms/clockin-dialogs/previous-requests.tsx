'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '../../button';
import { DatePickerWithRange } from '../../date-range';
import { DateRange } from 'react-day-picker';
import { TimeSheet } from '../ClockinForm';

const PreviousRequests = ({
  setHistoryDateRange,
  historyTimeSheets,
  setGetTimesheets,
  historyDateRange
}: {
  setHistoryDateRange: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  historyTimeSheets: TimeSheet[];
  setGetTimesheets: React.Dispatch<React.SetStateAction<boolean>>;
  historyDateRange: DateRange | undefined;
}) => {
  return (
    <div className="m-4">
      <Dialog>
        <DialogTrigger className="green_button">
          Display Previous Requests
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
    </div>
  );
};

export default PreviousRequests;
