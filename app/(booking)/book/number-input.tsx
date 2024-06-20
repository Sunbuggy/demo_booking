import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import React from 'react';

const NumberInput = ({ form }: { form: any }) => {
  return (
    <>
      {' '}
      <FormField
        control={form.control}
        name="howManyPeople"
        render={({ field }) => (
          <FormItem className="flex gap-2 items-baseline">
            <FormLabel>Group Size</FormLabel>
            <FormControl>
              <Input
                className={cn(
                  'w-[60px] pl-3 text-left font-normal',
                  !field.value && 'text-muted-foreground'
                )}
                type="number"
                {...field}
                value={field.value || 0}
                placeholder="#Group Size"
                min={0}
                max={2000}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default NumberInput;
