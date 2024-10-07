'use client';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { insertIntoVehicleFutureLocation } from '@/utils/supabase/queries';
import { DialogClose } from '@radix-ui/react-dialog';
import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
const SchedulePopup = ({
  vehicle_id,
  user_id,
  date,
  onClose
}: {
  user_id: string;
  vehicle_id: string;
  date: Date;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [futureLocation, setFutureLocation] = React.useState('');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  async function handleSave() {
    if (futureLocation === '') {
      toast({
        title: 'Error',
        description: 'Please select a location',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }
    const supabase = createClient();

    const location = {
      created_at: dayjs().tz(dayjs.tz.guess()).format('YYYY-MM-DDTHH:mm:ssZ'),
      created_by: user_id,
      future_date: dayjs(date)
        .tz(dayjs.tz.guess())
        .format('YYYY-MM-DDTHH:mm:ssZ'),
      vehicle_id: vehicle_id,
      future_location: futureLocation
    };
    console.log(location);
    return;

    await insertIntoVehicleFutureLocation(supabase, { ...location })
      .then((data) => {
        toast({
          title: 'Success',
          description: 'Vehicle Future Location inserted successfully',
          variant: 'success',
          duration: 3000
        });
        onClose();
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Error inserting Vehicle Future Location',
          variant: 'destructive',
          duration: 3000
        });
      });
  }

  return (
    <div className="p-4 rounded-lg shadow-md flex flex-col">
      <div className="mb-4 text-lg font-semibold">
        Selected Date: {date.toDateString()}
      </div>
      <div className="mb-4 flex flex-col">
        <label
          htmlFor="location"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Select Location
        </label>
        <select
          value={futureLocation}
          onChange={(e) => setFutureLocation(e.target.value)}
          id="location"
          className="block w-full px-3 py-2 text-base leading-6 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Location</option>
          <option value="Vegas">Las Vegas NV</option>
          <option value="Silver Lake">Silver Lake MI</option>
          <option value="Pismo">Pismo Ca</option>
        </select>
      </div>
      <DialogClose asChild>
        <button
          onClick={handleSave}
          className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </DialogClose>
    </div>
  );
};

export default SchedulePopup;
