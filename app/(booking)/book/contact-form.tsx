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
import { ContactFom } from './serve-bookings';

export function ContactForm({
  form,
  FormSchema,
  setContactForm,
  contactForm,
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
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="eg: Luke Skywalker" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="eg: luke@theforce.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="eg: 555-555-5555" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name(optional)</FormLabel>
              <FormControl>
                <Input placeholder="eg: Team Jedi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
