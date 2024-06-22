import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function NumberPicker({ setAmount }: { setAmount: number }) {
  // create a range of numbers from  1 to 100
  const numbers = Array.from({ length: setAmount }, (_, i) => i + 1);
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a number" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel></SelectLabel>
          {numbers.map((number) => (
            <SelectItem key={number} value={String(number)}>
              {number}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
