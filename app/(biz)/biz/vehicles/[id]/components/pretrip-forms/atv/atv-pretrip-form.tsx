'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  changeVehicleStatusToMaintenance,
  createVehicleTag,
  insertIntoAtvPretripForm
} from '@/utils/supabase/queries';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types_db';

export const formSchema = z.object({
  axle_nuts_intact: z.boolean(),
  brakes_front_intact: z.boolean(),
  brakes_rear_intact: z.boolean(),
  ca_reg_valid: z.boolean(),
  ca_sticker: z.boolean(),
  chain_intact: z.boolean(),
  gas_level: z.enum(['quarter', 'half', 'three_quarters', 'full']),
  good_oil_level: z.boolean(),
  lug_nuts_intact: z.boolean(),
  notes: z.string().optional(),
  nv_reg_valid: z.boolean(),
  nv_sticker: z.boolean(),
  tire_left_intact: z.boolean(),
  tire_right_intact: z.boolean()
});

// all booleans are radio buttons, all enums are select dropdowns, numbers are inputs, and all strings are text inputs
export const fields: FieldConfig[] = [
  {
    type: 'radio',
    name: 'gas_level',
    label: 'Gas Level',
    description: 'The gas level of the vehicle.',
    options: [
      { value: 'quarter', label: 'Quarter' },
      { value: 'half', label: 'Half' },
      { value: 'three_quarters', label: 'Three Quarters' },
      { value: 'full', label: 'Full' }
    ]
  },
  {
    type: 'radio',
    name: 'good_oil_level',
    label: 'Good Oil Level',
    description: 'Is the oil level good?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'axle_nuts_intact',
    label: 'Axle Nuts Intact',
    description: 'Are the axle nuts intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'brakes_front_intact',
    label: 'Brakes Front Intact',
    description: 'Are the front brakes intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'brakes_rear_intact',
    label: 'Brakes Rear Intact',
    description: 'Are the rear brakes intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'chain_intact',
    label: 'Chain Intact',
    description: 'Is the chain intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'lug_nuts_intact',
    label: 'Lug Nuts Intact',
    description: 'Are the lug nuts intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'tire_left_intact',
    label: 'Tire Left Intact',
    description: 'Is the left tire intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'tire_right_intact',
    label: 'Tire Right Intact',
    description: 'Is the right tire intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'nv_reg_valid',
    label: 'NV Reg Valid',
    description: 'Is the NV registration valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'nv_sticker',
    label: 'NV Sticker',
    description: 'Is the NV sticker present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'ca_reg_valid',
    label: 'CA Reg Valid',
    description: 'Is the CA registration valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'ca_sticker',
    label: 'CA Sticker',
    description: 'Is the CA sticker present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'textarea',
    name: 'notes',
    label: 'Notes',
    placeholder: 'Enter Any additional notes',
    description: 'Any additional notes...'
  }
];

const ATVPretripForm = ({
  vehicle_id,
  user_id
}: {
  vehicle_id?: string;
  user_id: string;
}) => {
  const [formData, setFormData] = React.useState<
    z.infer<typeof formSchema> | undefined
  >(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    if (formData !== undefined) {
      const supabase = createClient();
      const data = {
        ...formData,
        vehicle_id: vehicle_id,
        created_at: new Date().toISOString(),
        created_by: user_id
      };
      const noAnswers = Object.keys(data).filter(
        (key) =>
          key !== 'is_check_engine_on' &&
          key !== 'visible_leaks' &&
          key !== 'shuttles_plugged_in_winter' &&
          data[key as keyof typeof data] === false
      );
      if (noAnswers.length > 0) {
        console.log('No answers:', noAnswers);
        noAnswers.forEach((answer) => {
          const vehicleTag: Database['public']['Tables']['vehicle_tag']['Insert'] =
            {
              vehicle_id: vehicle_id,
              created_at: new Date().toISOString(),
              created_by: user_id,
              notes: `Pretrip form failed, ${answer}`,
              tag_type: 'maintenance',
              tag_status: 'open'
            };
          createVehicleTag(supabase, vehicleTag)
            .then((res) => {
              if (vehicle_id) {
                changeVehicleStatusToMaintenance(supabase, vehicle_id).then(
                  (res) => {
                    toast({
                      title: 'Vehicle status changed',
                      description: 'Vehicle status changed to maintenance',
                      variant: 'success',
                      duration: 2000
                    });
                  }
                );
              }
              toast({
                title: 'Vehicle tag created',
                description:
                  'A vehicle tag has been created for the failed pretrip form',
                variant: 'success',
                duration: 2000
              });
            })
            .catch((error) => {
              console.error('Error creating vehicle tag', error);
              toast({
                title: 'Error creating vehicle tag',
                description: 'There was an error creating the vehicle tag',
                variant: 'destructive',
                duration: 2000
              });
            });
        });
      }

      insertIntoAtvPretripForm(supabase, data, 'vehicle_pretrip_atv')
        .then((res) => {
          // clear the form
          setFormData(undefined);
          toast({
            title: 'Success',
            description: 'Pretrip form submitted successfully',
            variant: 'success',
            duration: 5000
          });
          window.location.reload();
        })
        .catch((error) => {
          console.error('Error inserting into pretrip form', error);
          toast({
            title: 'Error',
            description: 'There was an error submitting the form',
            variant: 'destructive',
            duration: 5000
          });
        });
    }
  }, [formData]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
  };

  return (
    <FactoryForm
      onSubmit={onSubmit}
      formSchema={formSchema}
      fields={fields}
      hideFilterBoxField={true}
    />
  );
};

export default ATVPretripForm;
