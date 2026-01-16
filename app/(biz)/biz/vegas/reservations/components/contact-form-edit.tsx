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
import { ContactFom } from './server-booking';

interface ContactFormProps {
  form: any;
  FormSchema: any;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  contactForm: ContactFom;
  setShowPricing: Dispatch<SetStateAction<boolean>>;
  setShowContactForm: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
}

// Semantic Classes for consistent reuse
// Ensures inputs match the dark/light mode definition automatically
const INPUT_SEMANTIC_CLASS = "bg-background text-foreground border-input placeholder:text-muted-foreground focus-visible:ring-primary";
const LABEL_SEMANTIC_CLASS = "text-right text-muted-foreground font-medium";

export function ContactForm({
  form,
  FormSchema,
  setContactForm,
  contactForm,
  setShowPricing,
  setShowContactForm,
  disabled = false
}: ContactFormProps) {
  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (disabled) return;
    setContactForm(data);
    setShowPricing(true);
    setShowContactForm(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full p-2">
        <div className="space-y-4"> {/* Increased spacing for better readability */}
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0"> {/* space-y-0 to fix grid alignment */}
                <FormLabel className={LABEL_SEMANTIC_CLASS}>
                  First and Last Name
                </FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className={`w-full ${INPUT_SEMANTIC_CLASS}`}
                    placeholder="eg: Luke Skywalker"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="col-start-2 col-span-2 text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                <FormLabel className={LABEL_SEMANTIC_CLASS}>Email</FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className={`w-full ${INPUT_SEMANTIC_CLASS}`}
                    placeholder="eg: luke@theforce.com"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="col-start-2 col-span-2 text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                <FormLabel className={LABEL_SEMANTIC_CLASS}>Phone</FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className={`w-full ${INPUT_SEMANTIC_CLASS}`}
                    placeholder="eg: 555-555-5555"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="col-start-2 col-span-2 text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="groupName"
            render={({ field }) => (
              <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                <FormLabel className={LABEL_SEMANTIC_CLASS}>
                  Group Name <span className="text-xs opacity-70">(optional)</span>
                </FormLabel>
                <FormControl className="col-span-2">
                  <Input
                    className={`w-full ${INPUT_SEMANTIC_CLASS}`}
                    placeholder="eg: Team Jedi"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="col-start-2 col-span-2 text-xs" />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end pt-4">
          {/* Button uses semantic 'default' variant (bg-primary text-primary-foreground) automatically */}
          <Button type="submit" disabled={disabled}>
            Next
          </Button>
        </div>
      </form>
    </Form>
  );
}