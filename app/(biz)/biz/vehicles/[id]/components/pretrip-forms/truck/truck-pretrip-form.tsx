'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import { insertIntoTruckPretripForm } from '@/utils/supabase/queries';
import { randomUUID } from 'crypto';

export const formSchema = z.object({
  ac_working: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  all_tire_pressure_within_5_psi_of_spec: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  battery_in_working_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  blm_permit_present: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  body_damage: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  brake_fluid_full: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  brakes_hold_in_good_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  brakes_in_good_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  buggy_on_roof_secured: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  cabin_heater_working: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  check_engine_light_off: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  coolant_level_at_proper_level: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  created_at: z.string(),
  did_you_need_to_open_new_tag: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  drive_shaft_exhaust_frame_good_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  emergency_brake_works: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  engine_belts_not_cracked_or_frayed: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  fire_extinguisher_present_and_mounted: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  first_aid_kit_mounted_and_fully_stocked: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  free_fluid_leaks: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  fuel_cap_present: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  fuel_card_present: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  fuel_level: z.enum(['full', 'half', 'quarter', 'three_quarters']),
  gas_tanks_strapped_on_securely: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  horn_operational: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  hoses_you_can_see_in_good_working_order: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  if_trailer_will_be_used_enter_no: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  inspection_valid: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  insurance_valid: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  light_indicators_work: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  lights_working: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  mileage: z.coerce.number({
    required_error: 'Mileage is required'
  }),
  mirror_working: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  no_flat_tire: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  no_visible_leaks_of_any_fluids: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  notes: z.string(),
  other_dash_light_on: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  power_steering_fluid_at_proper_level: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  proper_oil_level: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  registration_valid: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  rims_and_lugs_good_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  seat_belts_in_working_order: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  seat_belts_working_not_frayed_or_worn: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  springs_and_ubolts_in_proper_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  triangles_present: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  vehicle_clean_or_dirty: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  vehicle_id: z.string(),
  windshield_in_working_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  windshield_washer_fluid_full: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ]),
  windshield_wipers_condition: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true')
  ])
});

export const fields: FieldConfig[] = [
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
    name: 'all_tire_pressure_within_5_psi_of_spec',
    label: 'All Tire Pressure Within 5 PSI of Spec',
    description: 'Is the tire pressure within 5 PSI of spec?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'radio',
    name: 'battery_in_working_condition',
    label: 'Battery in Working Condition',
    description: 'Is the battery in working condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'blm permit present',
    label: 'buerau of land management permit present',
    description: 'Is the permit present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'body damage',
    label: 'body damage',
    description: 'Is there any body damage?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brake fluid full',
    label: 'brake fluid full',
    description: 'Is the brake fluid full?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes hold in good condition',
    label: 'brakes hold in good condition',
    description: 'Are the brakes in good condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes in good condition',
    label: 'brakes in good condition',
    description: 'Are the brakes in good condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'buggy on roof secured',
    label: 'buggy on roof secured',
    description: 'Is the buggy on the roof secured?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'cabin heater working',
    label: 'cabin heater working',
    description: 'Is the cabin heater working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'check engine light off',
    label: 'check engine light off',
    description: 'Is the check engine light off?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'coolant level at proper level',
    label: 'coolant level at proper level',
    description: 'Is the coolant level at the proper level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'did you need to open new tag',
    label: 'did you need to open new tag',
    description: 'Did you need to open a new tag?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'drive shaft exhaust frame good condition',
    label: 'drive shaft exhaust frame good condition',
    description: 'Is the drive shaft exhaust frame in good condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'emergency brake works',
    label: 'emergency brake works',
    description: 'Does the emergency brake work?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'engine belts not cracked or frayed',
    label: 'engine belts not cracked or frayed',
    description: 'Are the engine belts not cracked or frayed?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fire extinguisher present and mounted',
    label: 'fire extinguisher present and mounted',
    description: 'Is the fire extinguisher present and mounted?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'first aid kit mounted and fully stocked',
    label: 'first aid kit mounted and fully stocked',
    description: 'Is the first aid kit mounted and fully stocked?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'free fluid leaks',
    label: 'free fluid leaks',
    description: 'Are there any free fluid leaks?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fuel cap present',
    label: 'fuel cap present',
    description: 'Is the fuel cap present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fuel card present',
    label: 'fuel card present',
    description: 'Is the fuel card present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'select',
    name: 'fuel level',
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
    name: 'gas tanks strapped on securely',
    label: 'gas tanks strapped on securely',
    description: 'Are the gas tanks strapped on securely?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'horn operational',
    label: 'horn operational',
    description: 'Is the horn operational?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'hoses you can see in good working order',
    label: 'hoses you can see in good working order',
    description: 'Are the hoses you can see in good working order?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'if trailer will be used enter no',
    label: 'if trailer will be used enter no',
    description: 'If a trailer will be used, enter no',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'inspection valid',
    label: 'inspection valid',
    description: 'Is the inspection valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'insurance valid',
    label: 'insurance valid',
    description: 'Is the insurance valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'light indicators work',
    label: 'light indicators work',
    description: 'Do the light indicators work?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'lights working',
    label: 'lights working',
    description: 'Are the lights working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
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
    name: 'mirror working',
    label: 'mirror working',
    description: 'Is the mirror working?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'no flat tire',
    label: 'no flat tire',
    description: 'Is there no flat tire?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'no visible leaks of any fluids',
    label: 'no visible leaks of any fluids',
    description: 'Are there no visible leaks of any fluids?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'other dash light on',
    label: 'other dash light on',
    description: 'Is there another dash light on?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'power steering fluid at proper level',
    label: 'power steering fluid at proper level',
    description: 'Is the power steering fluid at the proper level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'proper oil level',
    label: 'proper oil level',
    description: 'Is the proper oil level?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'registration valid',
    label: 'registration valid',
    description: 'Is the registration valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'rims and lugs good condition',
    label: 'rims and lugs good condition',
    description: 'Are the rims and lugs in good condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'seat belts in working order',
    label: 'seat belts in working order',
    description: 'Are the seat belts in working order?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'seat belts working not frayed or worn',
    label: 'seat belts working not frayed or worn',
    description: 'Are the seat belts working and not frayed or worn?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'springs and ubolts in proper condition',
    label: 'springs and ubolts in proper condition',
    description: 'Are the springs and ubolts in proper condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'triangles present',
    label: 'triangles present',
    description: 'Are the triangles present?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'vehicle clean or dirty',
    label: 'vehicle clean or dirty',
    description: 'Is the vehicle clean or dirty?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'windshield in working condition',
    label: 'windshield in working condition',
    description: 'Is the windshield in working condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'windshield washer fluid full',
    label: 'windshield washer fluid full',
    description: 'Is the windshield washer fluid full?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'windshield wipers condition',
    label: 'windshield wipers condition',
    description: 'Are the windshield wipers in good condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },
  {
    type: 'textarea',
    name: 'notes',
    label: 'notes',
    description: 'Enter any additional notes',
    placeholder: 'Enter notes'
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

  React.useEffect(() => {
    if (formData !== undefined) {
      const supabase = createClient();
      const data = {
        ...formData,
        vehicle_id: vehicle_id,
        created_at: new Date().toISOString(),
        created_by: user_id
      };
      console.log(data);
      insertIntoTruckPretripForm(supabase, data, 'vehicle_pretrip_truck')
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
    console.log('logging some data....');
    console.log(data);
    // setFormData(data);
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
