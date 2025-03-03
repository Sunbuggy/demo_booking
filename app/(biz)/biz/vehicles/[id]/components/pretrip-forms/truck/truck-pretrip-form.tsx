'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React, { cache } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  changeVehicleStatusToMaintenance,
  createVehicleTag,
  insertIntoTruckPretripForm
} from '@/utils/supabase/queries';
import { randomUUID } from 'crypto';
import { useToast } from '@/components/ui/use-toast';
import { VehicleTagType } from '../../../../admin/page';
import { Database } from '@/types_db';
import { SupabaseClient } from '@supabase/supabase-js';

export const formSchema = z.object({
  ac_working: z.boolean(),
  all_tire_pressure_within_5_psi_of_spec: z.boolean(),
  battery_in_working_condition: z.boolean(),
  blm_permit_present: z.boolean(),
  no_body_damage: z.boolean(),
  brake_fluid_full: z.boolean(),
  brakes_hold_in_good_condition: z.boolean(),
  brakes_in_good_condition: z.boolean(),
  buggy_on_roof_secured: z.boolean(),
  cabin_heater_working: z.boolean(),
  check_engine_light_off: z.boolean(),
  coolant_level_at_proper_level: z.boolean(),
  did_you_need_to_open_new_tag: z.boolean(),
  drive_shaft_exhaust_frame_good_condition: z.boolean(),
  emergency_brake_works: z.boolean(),
  engine_belts_not_cracked_or_frayed: z.boolean(),
  fire_extinguisher_present_and_mounted: z.boolean(),
  first_aid_kit_mounted_and_fully_stocked: z.boolean(),
  free_fluid_leaks: z.boolean(),
  fuel_cap_present: z.boolean(),
  fuel_card_present: z.boolean(),
  fuel_level: z.enum(['full', 'half', 'quarter', 'three_quarters']),
  gas_tanks_strapped_on_securely: z.boolean(),
  horn_operational: z.boolean(),
  hoses_you_can_see_in_good_working_order: z.boolean(),
  if_trailer_will_be_used_enter_no: z.boolean(),
  inspection_valid: z.boolean(),
  insurance_valid: z.boolean(),
  light_indicators_work: z.boolean(),
  lights_working: z.boolean(),
  mileage: z.coerce.number({
    required_error: 'Mileage is required'
  }),
  mirror_working: z.boolean(),
  no_flat_tire: z.boolean(),
  no_visible_leaks_of_any_fluids: z.boolean(),
  notes: z.string(),
  other_dash_light_on: z.boolean(),
  power_steering_fluid_at_proper_level: z.boolean(),
  proper_oil_level: z.boolean(),
  registration_valid: z.boolean(),
  rims_and_lugs_good_condition: z.boolean(),
  seat_belts_in_working_order: z.boolean(),
  seat_belts_working_not_frayed_or_worn: z.boolean(),
  springs_and_ubolts_in_proper_condition: z.boolean(),
  triangles_present: z.boolean(),
  vehicle_clean_or_dirty: z.boolean(),
  windshield_in_working_condition: z.boolean(),
  windshield_washer_fluid_full: z.boolean(),
  windshield_wipers_condition: z.boolean()
});

export const fields: FieldConfig[] = [
  {
    type: 'radio',
    name: 'ac_working',
    label: 'AC Working',
    description: 'Is the AC working?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'all_tire_pressure_within_5_psi_of_spec',
    label: 'All Tire Pressure Within 5 PSI of Spec',
    description: 'Is the tire pressure within 5 PSI of spec?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'battery_in_working_condition',
    label: 'Battery in Working Condition',
    description: 'Is the battery in working condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'blm_permit_present',
    label: 'buerau of land management permit present',
    description: 'Is the permit present?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'no_body_damage',
    label: 'body damage',
    description: 'Is there any body damage?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brake_fluid_full',
    label: 'brake fluid full',
    description: 'Is the brake fluid full?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes_hold_in_good_condition',
    label: 'brakes hold in good condition',
    description: 'Are the brakes in good condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes_in_good_condition',
    label: 'brakes in good condition',
    description: 'Are the brakes in good condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'buggy_on_roof_secured',
    label: 'buggy on roof secured',
    description: 'Is the buggy on the roof secured?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'cabin_heater_working',
    label: 'cabin heater working',
    description: 'Is the cabin heater working?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'check_engine_light_off',
    label: 'check engine light off',
    description: 'Is the check engine light off?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'coolant_level_at_proper_level',
    label: 'coolant level at proper level',
    description: 'Is the coolant level at the proper level?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'did_you_need_to_open_new_tag',
    label: 'did you need to open a new tag',
    description: 'Did you need to open a new tag?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'drive_shaft_exhaust_frame_good_condition',
    label: 'drive shaft exhaust frame good condition',
    description: 'Is the drive shaft exhaust frame in good condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'emergency_brake_works',
    label: 'emergency brake works',
    description: 'Does the emergency brake work?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'engine_belts_not_cracked_or_frayed',
    label: 'engine belts not cracked or frayed',
    description: 'Are the engine belts not cracked or frayed?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fire_extinguisher_present_and_mounted',
    label: 'fire extinguisher present and mounted',
    description: 'Is the fire extinguisher present and mounted?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'first_aid_kit_mounted_and_fully_stocked',
    label: 'first aid kit mounted and fully stocked',
    description: 'Is the first aid kit mounted and fully stocked?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'free_fluid_leaks',
    label: 'free fluid leaks',
    description: 'Are there any fluid leaks?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'fuel_cap_present',
    label: 'fuel cap present',
    description: 'Is the fuel cap present?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'fuel_card_present',
    label: 'fuel card present',
    description: 'Is the fuel card present?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fuel_level',
    label: 'fuel level',
    description: 'What is the fuel level?',
    options: [
      { value: 'full', label: 'Full' },
      { value: 'half', label: 'Half' },
      { value: 'quarter', label: 'Quarter' },
      { value: 'three_quarters', label: 'Three Quarters' }
    ]
  },

  {
    type: 'radio',
    name: 'gas_tanks_strapped_on_securely',
    label: 'gas tanks strapped on securely',
    description: 'Are the gas tanks strapped on securely?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'horn_operational',
    label: 'horn operational',
    description: 'Is the horn operational?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'hoses_you_can_see_in_good_working_order',
    label: 'hoses you can see in good working order',
    description: 'Are the hoses you can see in good working order?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'if_trailer_will_be_used_enter_no',
    label: 'if trailer will be used enter no',
    description: 'If a trailer will be used, enter the number of trailers',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'inspection_valid',
    label: 'inspection valid',
    description: 'Is the inspection valid?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'insurance_valid',
    label: 'insurance valid',
    description: 'Is the insurance valid?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'light_indicators_work',
    label: 'light indicators work',
    description: 'Do the light indicators work?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'lights_working',
    label: 'lights working',
    description: 'Are the lights working?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'input',
    name: 'mileage',
    label: 'mileage',
    description: 'What is the mileage?',
    placeholder: 'Enter mileage'
  },
  {
    type: 'radio',
    name: 'mirror_working',
    label: 'mirror working',
    description: 'Is the mirror working?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'no_flat_tire',
    label: 'no flat tire',
    description: 'Are there any flat tires?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'no_visible_leaks_of_any_fluids',
    label: 'no visible leaks of any fluids',
    description: 'Are there any visible leaks of any fluids?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },

  {
    type: 'textarea',
    name: 'notes',
    label: 'notes',
    description: 'Enter any notes'
  },
  {
    type: 'radio',
    name: 'other_dash_light_on',
    label: 'other dash light on',
    description: 'Is there any other dash light on?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'power_steering_fluid_at_proper_level',
    label: 'power steering fluid at proper level',
    description: 'Is the power steering fluid at the proper level?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'proper_oil_level',
    label: 'proper oil level',
    description: 'Is the oil level proper?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'registration_valid',
    label: 'registration valid',
    description: 'Is the registration valid?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'rims_and_lugs_good_condition',
    label: 'rims and lugs good condition',
    description: 'Are the rims and lugs in good condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'seat_belts_in_working_order',
    label: 'seat belts in working order',
    description: 'Are the seat belts in working order?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'seat_belts_working_not_frayed_or_worn',
    label: 'seat belts working not frayed or worn',
    description: 'Are the seat belts working and not frayed or worn?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'springs_and_ubolts_in_proper_condition',
    label: 'springs and ubolts in proper condition',
    description: 'Are the springs and ubolts in proper condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'triangles_present',
    label: 'triangles present',
    description: 'Are the triangles present?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'vehicle_clean_or_dirty',
    label: 'vehicle clean',
    description: 'Is the vehicle clean?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'windshield_in_working_condition',
    label: 'windshield in working condition',
    description: 'Is the windshield in working condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'windshield_washer_fluid_full',
    label: 'windshield washer fluid full',
    description: 'Is the windshield washer fluid full?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'windshield_wipers_condition',
    label: 'windshield wipers condition',
    description: 'Are the windshield wipers in good condition?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  }
];

const TruckPretripForm = ({
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

  const [prevData, setPrevData] = React.useState<
    Database['public']['Tables']['vehicle_pretrip_atv']['Row'][]
  >([]);

  React.useEffect(() => {
    cache(async (supabase: SupabaseClient, veh_table: string) => {
      const { data, error } = await supabase.from(veh_table).select('*');
      if (error) {
        console.error(error);
        return [];
      }
      setPrevData(
        data as Database['public']['Tables']['vehicle_pretrip_atv']['Row'][]
      );
    });
  }, []);

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
      // Filter out answers that already exist
      const newFailedAnswers = noAnswers.filter((answer) => {
        if (prevData.length === 0) {
          return noAnswers;
        }
        return !prevData.some(
          (prev) => prev[answer as keyof typeof prev] === false
        );
      });

      if (newFailedAnswers.length > 0) {
        console.log('New failed answers:', newFailedAnswers);
        newFailedAnswers.forEach((answer) => {
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

      insertIntoTruckPretripForm(supabase, data, 'vehicle_pretrip_truck')
        .then((res) => {
          // clear the form
          setFormData(undefined);
          toast({
            title: 'Form submitted',
            description: 'Your form has been submitted successfully',
            variant: 'success',
            duration: 2000
          });
          window.location.reload();
        })
        .catch((error) => {
          console.error('Error inserting into pretrip form', error);
          toast({
            title: 'Error submitting form',
            description: 'There was an error submitting the form',
            variant: 'destructive',
            duration: 2000
          });
        });
    }
  }, [formData, prevData]);

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

export default TruckPretripForm;
