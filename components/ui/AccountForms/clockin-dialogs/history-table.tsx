import React from 'react';
import { TimeClockEventsType } from '../ClockinForm';

const HistoryTable = ({
  timeClockHistoryData
}: {
  timeClockHistoryData: TimeClockEventsType[];
}) => {
  return (
    <div>
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
    </div>
  );
};

export default HistoryTable;
