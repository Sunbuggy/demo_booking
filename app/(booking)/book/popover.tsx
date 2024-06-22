import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { NumberPicker } from './select';

export function AddVehicleDemo({
  name,
  setAmount
}: {
  name: string;
  setAmount: number;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Add</Button>
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
              <NumberPicker setAmount={setAmount} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
