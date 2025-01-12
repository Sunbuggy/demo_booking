import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface LocationSelectorProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
}

export function LocationSelector({
  selectedLocation,
  setSelectedLocation
}: LocationSelectorProps) {
  return (
    <Select onValueChange={setSelectedLocation} defaultValue={selectedLocation}>
      <SelectTrigger className="w-[180px] z-50">
        <SelectValue placeholder="Select location" />
      </SelectTrigger>
      <SelectContent className="z-50">
        <SelectItem value="all">All Locations</SelectItem>
        <SelectGroup>
          <SelectItem value="vegas" className="font-bold text-lg">
            Vegas
          </SelectItem>
          <SelectItem value="vegas shop">Vegas Shop</SelectItem>
          <SelectItem value="vegas nellis">Vegas Nellis</SelectItem>
          <SelectItem value="vegas valley of fire">
            Vegas Valley of Fire
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectItem value="pismo" className="font-bold text-lg">
            Pismo
          </SelectItem>
          <SelectItem value="pismo shop">Pismo Shop</SelectItem>
          <SelectItem value="pismo beach">Pismo Beach</SelectItem>
          <SelectItem value="pismo dunes">Pismo Dunes</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectItem value="Silver Lake" className="font-bold text-lg">
            Silver Lake
          </SelectItem>
          <SelectItem value="silver lake shop">Silver Lake Shop</SelectItem>
          <SelectItem value="silver lake dunes">Silver Lake Dunes</SelectItem>
        </SelectGroup>
        <SelectItem value="no location">No Location</SelectItem>
      </SelectContent>
    </Select>
  );
}
