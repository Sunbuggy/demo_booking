'use client';
import { z } from 'zod';
import { FactoryForm, FieldConfig } from './factory-form';
import React from 'react';
import { fetchVehicleInfo, updateVehicle } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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
  state: z.string().optional()
});

const fields: FieldConfig[] = [
  {
    type: 'input',
    name: 'name',
    label: 'Name',
    placeholder: 'Enter the name',
    description: 'The name of the vehicle.'
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

const EditVehicle = ({ id, cols }: { id: string; cols?: number }) => {
  const [formData, setFormData] = React.useState<
    z.infer<typeof formSchema> | undefined
  >(undefined);
  const [initialData, setInitialData] = React.useState<
    Record<string, any> | undefined
  >(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (formData !== undefined) {
      const supabase = createClient();

      updateVehicle(supabase, formData, id)
        .then((res) => {
          toast({
            title: 'Success',
            description: 'User has been updated',
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
        });
    }
  }, [formData]);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const data = await fetchVehicleInfo(supabase, id);
        setInitialData(data);
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
  };
  return (
    <div>
      {initialData ? (
        <FactoryForm
          fields={fields}
          formSchema={formSchema}
          onSubmit={onSubmit}
          initialData={initialData}
          cols={cols}
        />
      ) : (
        <Skeleton className="w-[798] h-[648]" />
      )}
    </div>
  );
};

export default EditVehicle;
