import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CheckCheckIcon, ChevronsUpDown } from 'lucide-react';
import React, { Dispatch, SetStateAction } from 'react';
import { HotelType } from '../app/(booking)/book/serve-bookings';
import { cn } from '@/utils/cn';

const ComboBox = ({
  hotelsMemo,
  open,
  setOpen,
  selectedHotel,
  setSelectedHotel
}: {
  hotelsMemo: HotelType[];
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  selectedHotel: string;
  setSelectedHotel: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          {selectedHotel
            ? hotelsMemo?.find(
                (hotel) => String(hotel?.Hotel_Name) === selectedHotel
              )?.Hotel_Name
            : 'Select hotel...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search hotel..." />
          <CommandList>
            <CommandEmpty>No Hotel found.</CommandEmpty>
            <CommandGroup>
              {hotelsMemo.map((hotel) => (
                <CommandItem
                  key={hotel.Hotel_ID}
                  value={String(hotel.Hotel_Name)}
                  onSelect={(currentValue) => {
                    setSelectedHotel(
                      currentValue === selectedHotel ? '' : currentValue
                    );
                    setOpen(false);
                  }}
                >
                  <CheckCheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedHotel === String(hotel.Hotel_Name)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {hotel.Hotel_Name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ComboBox;
