import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import React from 'react';
import { Label } from './ui/label';

const TimePicker = ({
  selectValue,
  setSelectValue,
  timeArray
}: {
  selectValue: string;
  setSelectValue: (value: string) => void;
  timeArray: string[];
}) => {
  return (
    <div className="flex flex-col gap-5">
      <Select onValueChange={setSelectValue} value={selectValue}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="pick a time" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Hour</SelectLabel>
            {timeArray.map((time, index) => (
              <SelectItem
                value={time} // Use time as value
                key={`${time}-${index}`} // Ensure key is unique by combining time and index
              >
                {time}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimePicker;
