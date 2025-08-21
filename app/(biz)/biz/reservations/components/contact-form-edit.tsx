'use client';
import { z } from 'zod';
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
import { Dispatch, SetStateAction } from 'react';
import { ContactFom } from './booking-type/mbj/server-booking';

interface ContactFormProps {
  form: any;
  FormSchema: any;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  contactForm: ContactFom;
  setShowPricing: Dispatch<SetStateAction<boolean>>;
  setShowContactForm: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean; // Add disabled prop
}

export function ContactForm({
  form,
  FormSchema,
  setContactForm,
  contactForm,
  setShowPricing,
  setShowContactForm,
  disabled = false // Default to false
}: ContactFormProps) {
  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (disabled) return; // Prevent submission if disabled
    setContactForm(data);
    setShowPricing(true);
    setShowContactForm(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full p-2">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4">
                <FormLabel className="text-right">
                  First and Last Name
                </FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className="w-full"
                    placeholder="eg: Luke Skywalker"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4">
                <FormLabel className="text-right">Email</FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className="w-full"
                    placeholder="eg: luke@theforce.com"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4">
                <FormLabel className="text-right">Phone</FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className="w-full"
                    placeholder="eg: 555-555-5555"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="groupName"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4">
                <FormLabel className="text-right">
                  Group Name (optional)
                </FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className="w-full"
                    placeholder="eg: Team Jedi"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="mt-4" disabled={disabled}>
            Next
          </Button>
        </div>
      </form>
    </Form>
  );
}