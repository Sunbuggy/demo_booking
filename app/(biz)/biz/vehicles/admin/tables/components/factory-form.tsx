'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

// Define the field configuration type
export type FieldConfig = {
  type: 'input' | 'select' | 'checkbox' | 'textarea' | 'radio';
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
};

// Component to render different field types
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
        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
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
};

export function FactoryForm({
  fields,
  formSchema,
  onSubmit
}: FactoryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((fieldConfig) => (
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
