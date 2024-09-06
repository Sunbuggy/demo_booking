'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import { z } from 'zod';
import { FactoryForm, FieldConfig } from './factory-form';
import React from 'react';

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' }),
  role: z.string(),
  bio: z.string().max(200, { message: 'Bio must not exceed 200 characters.' }),
  newsletter: z.boolean(),
  notification: z.enum(['email', 'sms', 'push'])
});

const fields: FieldConfig[] = [
  {
    type: 'input',
    name: 'username',
    label: 'Username',
    placeholder: 'Enter your username',
    description: 'This is your public display name.'
  },
  {
    type: 'select',
    name: 'role',
    label: 'Role',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
      { value: 'moderator', label: 'Moderator' }
    ]
  },
  {
    type: 'textarea',
    name: 'bio',
    label: 'Bio',
    placeholder: 'Tell us about yourself',
    description: 'A brief description about yourself (max 200 characters).'
  },
  {
    type: 'checkbox',
    name: 'newsletter',
    label: 'Subscribe to newsletter'
  },
  {
    type: 'radio',
    name: 'notification',
    label: 'Preferred notification method',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'push', label: 'Push Notification' }
    ]
  }
];

const AddVehicle = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };
  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant={'ghost'}
        className="underline"
      >
        +Add
      </Button>
      <Dialog open={isModalOpen}>
        <DialogContent>
          <DialogTitle>Add a Vehicle</DialogTitle>
          <DialogDescription>
            Plese Enter the most accurate info you can find for this vehicle
          </DialogDescription>
          <FactoryForm
            fields={fields}
            formSchema={formSchema}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddVehicle;
