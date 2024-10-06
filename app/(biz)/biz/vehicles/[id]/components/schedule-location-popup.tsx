'use client';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { insertIntoVehicleFutureLocation } from '@/utils/supabase/queries';
import { DialogClose } from '@radix-ui/react-dialog';
import React from 'react';

const SchedulePopup = ({
  vehicle_id,
  user_id,
  date
}: {
  user_id: string;
  vehicle_id: string;
  date: Date;
}) => {
  const { toast } = useToast();

  async function handleSave() {
    const supabase = createClient();
    await insertIntoVehicleFutureLocation(supabase, {
      created_at: new Date().toISOString(),
      created_by: user_id,
      future_date: date.toISOString(),
      vehicle_id: vehicle_id
    })
      .then((data) => {
        toast({
          title: 'Success',
          description: 'Vehicle Future Location inserted successfully',
          variant: 'success',
          duration: 3000
        });
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
    <div>
      Selected Date: {date.toDateString()}
      {/* Select element with 3 values Vegas, SL MI, Pismo Ca */}
      <select>
        <option value="Vegas">Las Vegas NV</option>
        <option value="Silver Lake">Silver Lake MI</option>
        <option value="Pismo">Pismo Ca</option>
      </select>
      <DialogClose asChild>
        <button onClick={handleSave}>Save</button>
      </DialogClose>
    </div>
  );
};

export default SchedulePopup;
