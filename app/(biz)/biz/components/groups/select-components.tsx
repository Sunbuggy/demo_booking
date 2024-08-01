import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
export const SelectAlphabet = ({
  setSelectedAlphabet
}: {
  setSelectedAlphabet: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function onSelect(value: string) {
    setSelectedAlphabet(value);
  }

  return (
    <Select onValueChange={(value) => onSelect(value)}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="A to Z"></SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={String(undefined)}></SelectItem>
          {alphabets.map((alphabet) => (
            <SelectItem key={alphabet} value={alphabet}>
              {alphabet}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export const SelectNums = ({
  setSelectedNum,
  selectedNum
}: {
  setSelectedNum: React.Dispatch<React.SetStateAction<string>>;
  selectedNum: string;
}) => {
  const numbers = '123456789'.split('');

  function onSelect(value: string) {
    setSelectedNum(value);
  }

  return (
    <Select onValueChange={(value) => onSelect(value)}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="1 to 9"></SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>1 to 9</SelectLabel>
          {selectedNum && (
            <>
              <Button
                className="w-full px-2"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNum('');
                }}
              >
                Clear
              </Button>
              <SelectSeparator />
            </>
          )}
          {numbers.map((number) => (
            <SelectItem key={number} value={number}>
              {number}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
