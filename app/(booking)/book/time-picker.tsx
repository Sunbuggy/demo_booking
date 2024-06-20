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
import { timeArray } from '@/utils/helpers';

const TimePicker = ({
  selectValue,
  setSelectValue
}: {
  selectValue: string;
  setSelectValue: (value: string) => void;
  disabledTime: number[];
  timeArray: string[];
}) => {
  const disabledTime = [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23];
  return (
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
              hidden={disabledTime.includes(index)}
            >
              {time}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default TimePicker;
