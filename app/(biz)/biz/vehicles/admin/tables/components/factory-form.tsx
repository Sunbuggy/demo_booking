'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type FieldConfig = {
  type: 'input' | 'select' | 'checkbox' | 'textarea' | 'radio';
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  hidden?: boolean;
};

const FieldComponent = ({
  field,
  fieldConfig
}: {
  field: any;
  fieldConfig: FieldConfig;
}) => {
  switch (fieldConfig.type) {
    case 'input':
      return (
        <Input
          {...field}
          placeholder={fieldConfig.placeholder}
          value={field.value || ''}
        />
      );
    case 'select':
      return (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder={fieldConfig.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {fieldConfig.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'checkbox':
      return (
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      );
    case 'textarea':
      return <Textarea {...field} placeholder={fieldConfig.placeholder} />;
    case 'radio':
      return (
        <RadioGroup onValueChange={field.onChange} value={field.value}>
          {fieldConfig.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value}>{option.label}</label>
            </div>
          ))}
        </RadioGroup>
      );
    default:
      return null;
  }
};

type FactoryFormProps = {
  fields: FieldConfig[];
  formSchema: z.ZodObject<any>;
  onSubmit: (data: any) => void;
  initialData?: Record<string, any>;
  cols?: number;
};

export function FactoryForm({
  fields,
  formSchema,
  onSubmit,
  initialData,
  cols
}: FactoryFormProps) {
  const [showAllFields, setShowAllFields] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {}
  });
  // Log initialData before useEffect

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData[0]).forEach((key) => {
        form.setValue(key, initialData[0][key]);
      });
      // Log form values after setting them
    }
  }, [initialData, form]);

  // Log form values during rendering

  const visibleFields = fields.filter(
    (field) => !field.hidden || showAllFields
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-8 grid grid-cols-1 md:grid-cols-2 gap-8`}
      >
        <FormField
          control={form.control}
          name="showAllFields"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={showAllFields}
                  onCheckedChange={(checked) => {
                    setShowAllFields(checked as boolean);
                    field.onChange(checked);
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show all fields</FormLabel>
                <FormDescription>
                  Check this box to reveal all hidden fields.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        {visibleFields.map((fieldConfig) => (
          <FormField
            key={fieldConfig.name}
            control={form.control}
            name={fieldConfig.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldConfig.label}</FormLabel>
                <FormControl>
                  <FieldComponent field={field} fieldConfig={fieldConfig} />
                </FormControl>
                {fieldConfig.description && (
                  <FormDescription>{fieldConfig.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
