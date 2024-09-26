'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import { insertIntoAtvPretripForm } from '@/utils/supabase/queries';

export const formSchema = z.object({
  axle_nuts_intact: z.boolean(),
  brakes_front_intact: z.boolean(),
  brakes_rear_intact: z.boolean(),
  ca_reg_valid: z.boolean(),
  ca_sticker: z.boolean(),
  chain_intact: z.boolean(),
  created_at: z.string(),
  created_by: z.string(),
  gas_level: z.enum(['quarter', 'half', 'three_quarters', 'full']),
  good_oil_level: z.boolean(),
  lug_nuts_intact: z.boolean(),
  notes: z.string(),
  nv_reg_valid: z.boolean(),
  nv_sticker: z.boolean(),
  tire_left_intact: z.boolean(),
  tire_right_intact: z.boolean(),
  vehicle_id: z.string()
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

  React.useEffect(() => {
    if (formData !== undefined) {
      const supabase = createClient();
      const data = {
        ...formData,
        vehicle_id: vehicle_id,
        created_at: new Date().toISOString(),
        created_by: user_id
      };
      insertIntoAtvPretripForm(supabase, data, 'vehicle_pretrip_atv')
        .then((res) => {
          // clear the form
          setFormData(undefined);
        })
        .catch((error) => {
          console.error('Error inserting into pretrip form', error);
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
