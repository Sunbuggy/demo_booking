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
import { ContactFom } from './serve-bookings/mbj';

export function ContactForm({
  form,
  FormSchema,
  setContactForm,
  setShowPricing,
  setShowContactForm
}: {
  form: any;
  FormSchema: any;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  contactForm: ContactFom;
  setShowPricing: Dispatch<SetStateAction<boolean>>;
  setShowContactForm: Dispatch<SetStateAction<boolean>>;
}) {
  function onSubmit(data: z.infer<typeof FormSchema>) {
    setContactForm(data);
    setShowPricing(true);
    setShowContactForm(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className=" flex gap-2 w-full  items-end justify-between">
              <FormLabel>First and Last Name</FormLabel>
              <FormControl>
                <Input
                  className="w-[75%]"
                  placeholder="eg: Luke Skywalker"
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
            <FormItem className=" flex gap-2 w-full  items-end justify-between">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  className="w-[75%]"
                  placeholder="eg: luke@theforce.com"
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
            <FormItem className=" flex gap-2 w-full  items-end justify-between">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  className="w-[75%]"
                  placeholder="eg: 555-555-5555"
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
            <FormItem className=" flex gap-2 w-full  items-end justify-between">
              <FormLabel>Group Name(optional)</FormLabel>
              <FormControl>
                <Input
                  className="w-[55%]"
                  placeholder="eg: Team Jedi"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Next</Button>
      </form>
    </Form>
  );
}
