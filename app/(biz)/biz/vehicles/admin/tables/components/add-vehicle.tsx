'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { insertIntoVehicles } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  name: z.string(),
  type: z.enum([
    'shuttle',
    'buggy',
    'atv',
    'utv',
    'sedan',
    'truck',
    'trailer',
    'tram',
    'forktruck'
  ]),
  make: z.string(),
  model: z.string(),
  year: z.union([
    z.number().min(1970).max(new Date().getFullYear()),
    z.string().transform((val) => parseInt(val))
  ]),
  seats: z.union([
    z.number().max(500),
    z.string().transform((val) => parseInt(val))
  ]),
  color: z.string().optional(),
  notes: z.string().optional(),
  vin: z.string().optional(),
  licenseplate: z.string().optional(),
  state: z.string().optional(),
  pet_name: z.string().optional()
});

const fields: FieldConfig[] = [
  {
    type: 'input',
    name: 'name',
    label: 'Internal Name',
    placeholder: 'Enter the internal name',
    description: 'The internal name of the vehicle.'
  },
  {
    type: 'input',
    name: 'pet_name',
    label: 'Name',
    placeholder: 'Enter the  name',
    description: 'The  name of the vehicle.',
    hidden: true
  },
  {
    type: 'select',
    name: 'type',
    label: 'Type',
    options: [
      { value: 'shuttle', label: 'Shuttle' },
      { value: 'buggy', label: 'Buggy' },
      { value: 'atv', label: 'ATV' },
      { value: 'utv', label: 'UTV' },
      { value: 'sedan', label: 'Sedan' },
      { value: 'truck', label: 'Truck' },
      { value: 'trailer', label: 'Trailer' },
      { value: 'tram', label: 'Tram' },
      { value: 'forktruck', label: 'Forktruck' }
    ]
  },
  {
    type: 'input',
    name: 'make',
    label: 'Make',
    placeholder: 'Enter the make',
    description: 'The make of the vehicle.'
  },
  {
    type: 'input',
    name: 'model',
    label: 'Model',
    placeholder: 'Enter the model',
    description: 'The model of the vehicle.'
  },
  {
    type: 'input',
    name: 'year',
    label: 'Year',
    placeholder: 'Enter the year',
    description: 'The year of the vehicle.'
  },
  {
    type: 'input',
    name: 'seats',
    label: 'Seats',
    placeholder: 'Enter the number of seats',
    description: 'The number of seats in the vehicle.'
  },
  {
    type: 'input',
    name: 'color',
    label: 'Color',
    placeholder: 'Enter the color',
    description: 'The color of the vehicle.',
    hidden: true
  },
  {
    type: 'input',
    name: 'notes',
    label: 'Notes',
    placeholder: 'Enter the notes',
    description: 'The notes of the vehicle.',
    hidden: true
  },
  {
    type: 'input',
    name: 'vin',
    label: 'VIN',
    placeholder: 'Enter the VIN',
    description: 'The VIN of the vehicle.',
    hidden: true
  },
  {
    type: 'input',
    name: 'licenseplate',
    label: 'License Plate',
    placeholder: 'Enter the license plate',
    description: 'The license plate of the vehicle.',
    hidden: true
  },
  {
    type: 'input',
    name: 'state',
    label: 'State',
    placeholder: 'Enter the state',
    description: 'The state of the vehicle.',
    hidden: true
  }
];

const AddVehicle = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<
    z.infer<typeof formSchema> | undefined
  >(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    if (formData !== undefined) {
      const supabase = createClient();
      insertIntoVehicles(supabase, formData)
        .then((res) => {
          toast({
            title: 'Success',
            description: 'User has been deleted',
            duration: 2000,
            variant: 'success'
          });
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: 'Error deleting user',
            duration: 2000,
            variant: 'destructive'
          });
          console.error(err);
        })
        .finally(() => {
          setFormData(undefined);
          setIsModalOpen(false);
        });
    }
  }, [formData]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
  };
  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant={'ghost'}
        className="underline text-green-500 font-bold"
      >
        +Add New Vehicle
      </Button>
      <Dialog
        open={isModalOpen}
        onOpenChange={(isOpen) => setIsModalOpen(isOpen)}
      >
        <DialogContent
          className={'lg:max-w-screen-lg overflow-y-scroll max-h-screen'}
        >
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
