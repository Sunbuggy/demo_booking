'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  changeVehicleStatusToMaintenance,
  createVehicleTag,
  insertIntoShuttlePretripForm
} from '@/utils/supabase/queries';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types_db';

export const formSchema = z.object({
  milage: z.string(),
  ac_working: z.boolean(),
  all_light_bulbs_intact: z.boolean(),
  all_tire_pressure_within_5_psi_of_spec: z.boolean(),
  annual_inspection_all_shuttles: z.boolean(),
  antifreeze_level_proper_level: z.boolean(),
  battery_working: z.boolean(),
  body_damage: z.string().optional(),
  brake_fluid_level: z.boolean(),
  buggy_on_roof_secured: z.boolean(),
  fire_extinguisher_present: z.boolean(),
  first_aid_kit_mounted: z.boolean(),
  first_aid_kit_stocked: z.boolean(),
  fuel_level: z.enum(['quarter', 'half', 'three_quarters', 'full']),
  heater_working: z.boolean(),
  ice_chest_in_shuttle: z.boolean(),
  insurance_valid: z.boolean(),
  is_check_engine_on: z.boolean(),
  is_horn_working: z.boolean(),
  is_vehicle_clean: z.boolean(),
  light_indicators_work: z.boolean(),
  mirror_working: z.boolean(),
  notes: z.string().optional(),
  oil_proper_level: z.boolean(),
  power_steering_fluid_proper_level: z.boolean(),
  registration_valid: z.boolean(),
  shuttles_plugged_in_winter: z.boolean(),
  triangles_present: z.boolean(),
  visible_hoses_intact: z.boolean(),
  visible_leaks: z.boolean(),
  wind_shield_washer_fluid_full: z.boolean(),
  engine_belts_intact: z.boolean(),
  seat_belts_intact: z.boolean()
});

// all booleans are radio buttons, all enums are select dropdowns, numbers are inputs, and all strings are text inputs
export const fields: FieldConfig[] = [
  {
    type: 'input',
    name: 'milage',
    label: 'Milage',
    placeholder: 'Enter the milage',
    description: 'The milage of the vehicle.'
  },
  {
    type: 'radio',
    name: 'ac_working',
    label: 'AC Working',
    description: 'Is the AC working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'all_light_bulbs_intact',
    label: 'All Light Bulbs Intact',
    description: 'Are all light bulbs intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'all_tire_pressure_within_5_psi_of_spec',
    label: 'All Tire Pressure Within 5 PSI of Spec',
    description: 'Is all tire pressure within 5 PSI of spec?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'annual_inspection_all_shuttles',
    label: 'Annual Inspection All Shuttles',
    description: 'Has the annual inspection been completed on all shuttles?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'antifreeze_level_proper_level',
    label: 'Antifreeze Level Proper Level',
    description: 'Is the antifreeze level at the proper level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'battery_working',
    label: 'Battery Working',
    description: 'Is the battery working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'engine_belts_intact',
    label: 'Belts Intact',
    description: 'Are the belts intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'seat_belts_intact',
    label: 'Belts Intact',
    description: 'Are the belts intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'textarea',
    name: 'body_damage',
    label: 'Body Damage',
    placeholder: 'Enter the body damage',
    description: '(IF ANY) The body damage of the vehicle.'
  },
  {
    type: 'radio',
    name: 'brake_fluid_level',
    label: 'Brake Fluid Level',
    description: 'Is the brake fluid level at the proper level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'buggy_on_roof_secured',
    label: 'Buggy on Roof Secured',
    description: 'Is the buggy on the roof secured?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fire_extinguisher_present',
    label: 'Fire Extinguisher Present',
    description: 'Is the fire extinguisher present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'first_aid_kit_mounted',
    label: ' First Aid Kit Mounted',
    description: 'Is the first aid kit mounted?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'first_aid_kit_stocked',
    label: 'First Aid Kit Stocked',
    description: 'Is the first aid kit stocked?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'fuel_level',
    label: 'Fuel Level',
    options: [
      { value: 'quarter', label: 'Quarter' },
      { value: 'half', label: 'Half' },
      { value: 'three_quarters', label: 'Three Quarters' },
      { value: 'full', label: 'Full' }
    ]
  },
  {
    type: 'radio',
    name: 'heater_working',
    label: 'Heater Working',
    description: 'Is the heater working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'ice_chest_in_shuttle',
    label: 'Ice Chest in Shuttle',
    description: 'Is the ice chest in the shuttle?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'insurance_valid',
    label: 'Insurance Valid',
    description: 'Is the insurance valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'is_check_engine_on',
    label: 'Is Check Engine On',
    description: 'Is the check engine light on?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'is_horn_working',
    label: 'Is Horn Working',
    description: 'Is the horn working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'is_vehicle_clean',
    label: 'Is Vehicle Clean',
    description: 'Is the vehicle clean?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'light_indicators_work',
    label: 'Light Indicators Work',
    description: 'Do the light indicators work?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'mirror_working',
    label: 'Mirror Working',
    description: 'Is the mirror working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'oil_proper_level',
    label: 'Oil Proper Level',
    description: 'Is the oil at the proper level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'power_steering_fluid_proper_level',
    label: 'Power Steering Fluid Proper Level',
    description: 'Is the power steering fluid at the proper level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'registration_valid',
    label: 'Registration Valid',
    description: 'Is the registration valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'shuttles_plugged_in_winter',
    label: 'Shuttles Plugged in Winter',
    description: 'Are the shuttles plugged in for the winter?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'triangles_present',
    label: 'Triangles Present',
    description: 'Are the triangles present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'visible_hoses_intact',
    label: 'Visible Hoses Intact',
    description: 'Are the visible hoses intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'visible_leaks',
    label: 'Visible Leaks',
    description: 'Are there any visible leaks?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'wind_shield_washer_fluid_full',
    label: 'Wind Shield Washer Fluid Full',
    description: 'Is the wind shield washer fluid full?',
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

const ShuttlePretripForm = ({
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
      // gather all the results and if there is any 'no' answer then grab all the 'no' answers and console.log them
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

      insertIntoShuttlePretripForm(supabase, data, 'vehicle_pretrip_shuttle')
        .then((res) => {
          // clear the form
          setFormData(undefined);
          toast({
            title: 'Form submitted',
            description: 'The form has been submitted successfully',
            variant: 'success',
            duration: 5000
          });
          // reload the page
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

export default ShuttlePretripForm;
