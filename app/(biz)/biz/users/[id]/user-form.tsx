'use client';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types_db';
import React from 'react';
import { z } from 'zod';

type User = Database['public']['Tables']['users']['Row'];

export const formSchema = z.object({
  avatar_url: z.string().nullable(),
  bg_image: z.string().nullable(),
  bg_position: z.string().nullable(),
  bg_repeat: z.string().nullable(),
  bg_size: z.string().nullable(),
  email: z.string().nullable(),
  full_name: z.string().nullable(),
  id: z.string(),
  phone: z.string().nullable(),
  time_entry_status: z.string().nullable(),
  user_level: z.number().nullable(),
  emp_id: z.string().nullable()
});

export const fields: FieldConfig[] = [
  {
    type: 'input',
    name: 'full_name',
    label: 'Full Name',
    placeholder: 'Full Name',
    description: 'The full name of the user.'
  },
  {
    type: 'input',
    name: 'email',
    label: 'Email',
    placeholder: 'Email',
    description: 'The email of the user.'
  },
  {
    type: 'input',
    name: 'phone',
    label: 'Phone',
    placeholder: 'Phone',
    description: 'The phone number of the user.'
  },
  {
    type: 'input',
    name: 'avatar_url',
    label: 'Avatar URL',
    placeholder: 'Avatar URL',
    description: 'The avatar URL of the user.'
  },
  {
    type: 'input',
    name: 'user_level',
    label: 'User Level',
    placeholder: 'User Level',
    description: 'The user level of the user.'
  },
  {
    type: 'input',
    name: 'time_entry_status',
    label: 'Time Entry Status',
    placeholder: 'Time Entry Status',
    description: 'The time entry status of the user.'
  },
  {
    type: 'input',
    name: 'emp_id',
    label: 'Employee ID',
    placeholder: 'Employee ID',
    description: 'The employee ID of the user.'
  }
];

const UserForm = ({ user }: { user: User }) => {
  const [formData, setFormData] = React.useState<
    z.infer<typeof formSchema> | undefined
  >(undefined);
  const [initialData, setInitialData] = React.useState<
    Record<string, any> | undefined
  >(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    setInitialData(user);
  }, []);
  React.useEffect(() => {
    if (formData) {
      console.log(formData);
    }
  }, [formData]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
  };
  if (user)
    return (
      <FactoryForm
        fields={fields}
        formSchema={formSchema}
        onSubmit={onSubmit}
        hideFilterBoxField={true}
        data={initialData}
      />
    );
};

export default UserForm;
