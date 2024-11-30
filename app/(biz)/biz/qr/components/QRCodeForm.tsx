import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { FormData } from './QRCodeGenerator';

interface QRCodeFormProps {
  form: UseFormReturn<FormData>;
  onSubmit: (values: FormData) => Promise<void>;
}

export default function QRCodeForm({ form, onSubmit }: QRCodeFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Top Text</FormLabel>
              <FormControl>
                <Input placeholder="Enter top text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bottomText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bottom Text</FormLabel>
              <FormControl>
                <Input placeholder="Enter bottom text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="count"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormLabel>Number of QR Codes</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of QR codes" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Generate QR Code
        </Button>
      </form>
    </Form>
  );
}
