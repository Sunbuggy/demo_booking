'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import { insertIntoForkliftPretripForm } from '@/utils/supabase/queries';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  no_hydraulic_fluid_leaks: z.boolean(),
  back_up_alarm_operational: z.boolean(),
  battery_intact: z.boolean(),
  no_broken_or_loose_part: z.boolean(),
  controls_and_levers_work: z.boolean(),
  electrical_lines_intact: z.boolean(),
  emergency_stop_and_brakes_work: z.boolean(),
  extension_cylinders_intact: z.boolean(),
  foot_controls_work: z.boolean(),
  fuel_gas_level: z.enum(['full', 'half', 'quarter', 'three_quarters']),
  motor_condition_intact: z.boolean(),
  notes: z.string().optional(),
  oil_level_correct: z.boolean(),
  pivot_pins_intact: z.boolean(),
  seat_belts_intact: z.boolean(),
  tires_good_shape: z.boolean(),
  vert_mast_sliding_chains_parts_operational: z.boolean(),
  window_clean: z.boolean()
});

export const fields: FieldConfig[] = [
  {
    type: 'radio',
    name: 'no_hydraulic_fluid_leaks',
    label: 'No hydraulic fluid leaks?',
    description: 'Check for any hydraulic fluid leaks under the vehicle',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'back_up_alarm_operational',
    label: 'Back up alarm operational?',
    description: 'Check if the back up alarm is operational',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'battery_intact',
    label: 'Battery?',
    description: 'Check the battery',
    options: [
      { value: true, label: 'Good' },
      { value: false, label: 'Bad' }
    ]
  },

  {
    type: 'radio',
    name: 'no_broken_or_loose_part',
    label: 'No broken or loose part?',
    description: 'Check for no broken or loose parts on the vehicle',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'controls_and_levers_work',
    label: 'Controls and levers work?',
    description: 'Check if the controls and levers are working properly',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'electrical_lines_intact',
    label: 'Electrical lines intact?',
    description: 'Check if the electrical lines are intact',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'emergency_stop_and_brakes_work',
    label: 'Emergency stop and brakes work?',
    description: 'Check if the emergency stop and brakes are working properly',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'extension_cylinders_intact',
    label: 'Extension cylinders intact?',
    description: 'Check if the extension cylinders are intact',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'foot_controls_work',
    label: 'Foot controls work?',
    description: 'Check if the foot controls are working properly',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fuel_gas_level',
    label: 'Fuel gas level',
    description: 'Check the fuel gas level',
    options: [
      { value: 'full', label: 'Full' },
      { value: 'half', label: 'Half' },
      { value: 'quarter', label: 'Quarter' },
      { value: 'three_quarters', label: 'Three Quarters' }
    ]
  },

  {
    type: 'radio',
    name: 'motor_condition_intact',
    label: 'Motor condition?',
    description: 'Check the motor condition',
    options: [
      { value: true, label: 'Good' },
      { value: false, label: 'Bad' }
    ]
  },

  {
    type: 'textarea',
    name: 'notes',
    label: 'Notes',
    description: 'Add any additional notes here'
  },

  {
    type: 'radio',
    name: 'oil_level_correct',
    label: 'Oil level correct?',
    description: 'Check if the oil level is correct',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'pivot_pins_intact',
    label: 'Pivot pins intact?',
    description: 'Check if the pivot pins are intact',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'seat_belts_intact',
    label: 'Seat belts intact?',
    description: 'Check if the seat belts are intact',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'tires_good_shape',
    label: 'Tires in good shape?',
    description: 'Check if the tires are in good shape',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'vert_mast_sliding_chains_parts_operational',
    label: 'Vert mast sliding chains parts operational?',
    description: 'Check if the vert mast sliding chains parts are operational',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'window_clean',
    label: 'Window clean?',
    description: 'Check if the window is clean',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  }
];

const ForkliftPretripForm = ({
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
        vehicle_id: String(vehicle_id),
        created_at: new Date().toISOString(),
        created_by: user_id
      };
      insertIntoForkliftPretripForm(supabase, data, 'vehicle_pretrip_forklift')
        .then((res) => {
          // clear the form
          setFormData(undefined);
          toast({
            title: 'Form submitted successfully',
            variant: 'success',
            duration: 5000,
            description: 'The form has been submitted successfully'
          });
          // console.log(res);
          window.location.reload();
        })
        .catch((error) => {
          console.error('Error inserting into pretrip form', error);
          toast({
            title: 'Error submitting form',
            variant: 'destructive',
            duration: 5000,
            description: 'There was an error submitting the form'
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

export default ForkliftPretripForm;
