import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose
} from '@/components/ui/popover';
import { NumberPicker } from './select';
import { AddedBookingsType } from './serve-bookings';

export function AddVehicleDemo({
  name,
  totlalPeople,
  setAddedBookings,
  selectedTabValue,
  addedBookings,
  pricing,
  seats
}: {
  name: string;
  totlalPeople: number;
  setAddedBookings: React.Dispatch<React.SetStateAction<AddedBookingsType>>;
  selectedTabValue: 'mb30' | 'mb60' | 'mb120';
  addedBookings: AddedBookingsType;
  pricing: number;
  seats: number;
}) {
  const quantity = addedBookings[selectedTabValue]?.find(
    (item) => item.vehicle === name
  )?.quantity;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {/* if name and pricing are the same show quantity from addedBookings array of objects */}
          {quantity ? `Added (${quantity})` : 'Add'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Add to my booking</h4>
            <p className="text-sm text-muted-foreground">
              How many {name} would you like to add to your booking?
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="no_of_vehs">{name}</Label>
              <NumberPicker
                totlalPeople={totlalPeople}
                name={name}
                setAddedBookings={setAddedBookings}
                selectedTabValue={selectedTabValue}
                addedBookings={addedBookings}
                pricing={pricing}
                seats={seats}
              />
            </div>
            Taken Seats: {seats * (quantity || 0)}
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="default">
            <PopoverClose>Done</PopoverClose>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
