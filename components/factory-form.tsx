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
  options?: { value: string | boolean; label: string }[];
  hidden?: boolean;
};

const FieldComponent = ({
  field,
  fieldConfig,
  allDisabled
}: {
  field: any;
  fieldConfig: FieldConfig;
  allDisabled?: boolean;
}) => {
  switch (fieldConfig.type) {
    case 'input':
      return (
        <Input
          {...field}
          placeholder={fieldConfig.placeholder}
          value={field.value || ''}
          disabled={allDisabled}
        />
      );
case 'select':
  return (
    <Select
      onValueChange={field.onChange}
      value={String(field.value)}
      disabled={allDisabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {fieldConfig.options?.map((option, idx) => (
          <SelectItem key={idx} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
    case 'checkbox':
      return (
        <>
          {fieldConfig.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <Checkbox
                checked={
                  Array.isArray(field.value)
                    ? field.value.includes(option.value)
                    : false
                }
                onCheckedChange={(checked) => {
                  const newValue = Array.isArray(field.value)
                    ? [...field.value]
                    : [];
                  if (checked) {
                    newValue.push(option.value);
                  } else {
                    const index = newValue.indexOf(option.value);
                    if (index > -1) {
                      newValue.splice(index, 1);
                    }
                  }
                  field.onChange(newValue);
                }}
                disabled={allDisabled}
              />
              <label>{option.label}</label>
            </div>
          ))}
        </>
      );
    case 'textarea':
      return (
        <Textarea
          {...field}
          placeholder={fieldConfig.placeholder}
          disabled={allDisabled}
        />
      );
    case 'radio':
      return (
        <RadioGroup
          onValueChange={(value) =>
            field.onChange(
              value === 'true' ? true : value === 'false' ? false : value
            )
          }
          value={String(field.value)}
          disabled={allDisabled}
        >
          {fieldConfig.options?.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <RadioGroupItem
                value={String(option.value)}
                id={String(option.value)}
                disabled={allDisabled}
              />
              <label htmlFor={String(option.value)}>{option.label}</label>
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
  data?: Record<string, any>;
  hideFilterBoxField?: boolean;
  allDisabled?: boolean;
};

export function FactoryForm({
  fields,
  formSchema,
  onSubmit,
  initialData,
  data,
  hideFilterBoxField,
  allDisabled
}: FactoryFormProps) {
  const [showAllFields, setShowAllFields] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_status: undefined,
      ...(initialData || data || {})
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const visibleFields = fields.filter(
    (field) => !field.hidden || showAllFields
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-8 grid grid-cols-1 md:grid-cols-2 gap-8`}
      >
        {!hideFilterBoxField && (
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
        )}
        {visibleFields.map((fieldConfig) => (
          <FormField
            key={fieldConfig.name}
            control={form.control}
            name={fieldConfig.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldConfig.label}</FormLabel>
                {fieldConfig.description && (
                  <FormDescription>{fieldConfig.description}</FormDescription>
                )}
                <FormControl>
                  <FieldComponent
                    field={field}
                    fieldConfig={fieldConfig}
                    allDisabled={allDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        {!allDisabled && <Button type="submit">Submit</Button>}
      </form>
    </Form>
  );
}
