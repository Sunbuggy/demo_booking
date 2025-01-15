'use client';

import { z } from 'zod';
import { FactoryForm, FieldConfig } from '@/components/factory-form';
import React from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  changeVehicleStatusToMaintenance,
  createVehicleTag,
  insertIntoBuggyPretripForm
} from '@/utils/supabase/queries';
import { Database } from '@/types_db';
import { useToast } from '@/components/ui/use-toast';

export const formSchema = z.object({
  axle_sleeves_intact: z.boolean(),
  ball_joints_intact: z.boolean(),
  brake_pads_intact: z.boolean(),
  brakes_calliper_intact: z.boolean(),
  brakes_intact: z.boolean(),
  brakes_stop: z.boolean(),
  buggy_washed: z.boolean(),
  clean_of_trash: z.boolean(),
  created_at: z.string(),
  drive_belt_intact: z.boolean(),
  drive_test_pass: z.boolean(),
  frame_intact: z.boolean(),
  front_bumper_intact: z.boolean(),
  fuel_filters_clean: z.boolean(),
  good_lug_nuts: z.boolean(),
  good_oil_level: z.boolean(),
  hyme_joints_tight: z.boolean(),
  notes: z.string(),
  passes_light_bar_test: z.boolean(),
  passes_recovery_hitch_test: z.boolean(),
  performance_drive: z.boolean(),
  rear_bumper_black: z.boolean(),
  rear_bumper_paint: z.boolean(),
  recovery_hitch_intact: z.boolean(),
  reg_ca_valid: z.boolean(),
  reg_nv_valid: z.boolean(),
  rims_intact: z.boolean(),
  seat_belts_all_in_place: z.boolean(),
  seat_belts_all_work_properly: z.boolean(),
  shocks_intact: z.boolean(),
  side_panes_intact: z.boolean(),
  steering_intact: z.boolean(),
  steering_left: z.boolean(),
  steering_right: z.boolean(),
  steering_wheel_padded: z.boolean(),
  suspension_jam_nuts_intact: z.boolean(),
  suspension_quick_check: z.boolean(),
  throttle_intact: z.boolean(),
  throttle_springs_intact: z.boolean(),
  tire_pressure_front: z.boolean(),
  tire_pressure_rear: z.boolean(),
  vehicle_id: z.string(),
  wires_condition_intact: z.boolean(),
  wires_in_place: z.boolean()
});

export const fields: FieldConfig[] = [
  {
    type: 'radio',
    name: 'axle_sleeves_intact',
    label: 'Axle Sleeves Intact',
    description: 'Are the axle sleeves intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'ball_joints_intact',
    label: 'Ball Joints Intact',
    description: 'Are the ball joints intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brake_pads_intact',
    label: 'Brake Pads Intact',
    description: 'Are the brake pads intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes_calliper_intact',
    label: 'Brakes Calliper Intact',
    description: 'Are the brakes calliper intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes_intact',
    label: 'Brakes Intact',
    description: 'Are the brakes intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'brakes_stop',
    label: 'Brakes Stop',
    description: 'Do the brakes stop?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'buggy_washed',
    label: 'Buggy Washed',
    description: 'Was the buggy washed?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'clean_of_trash',
    label: 'Clean of Trash',
    description: 'Is the buggy clean of trash?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'drive_belt_intact',
    label: 'Drive Belt Intact',
    description: 'Is the drive belt intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'drive_test_pass',
    label: 'Drive Test Pass',
    description: 'Did the drive test pass?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'frame_intact',
    label: 'Frame Intact',
    description: 'Is the frame intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'front_bumper_intact',
    label: 'Front Bumper Intact',
    description: 'Is the front bumper intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'fuel_filters_clean',
    label: 'Fuel Filters Clean',
    description: 'Are the fuel filters clean?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'good_lug_nuts',
    label: 'Good Lug Nuts',
    description: 'Are the lug nuts good?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
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
    name: 'hyme_joints_tight',
    label: 'Hyme Joints Tight',
    description: 'Are the hyme joints tight?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'notes',
    label: 'Notes',
    description: 'Any notes?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'passes_light_bar_test',
    label: 'Passes Light Bar Test',
    description: 'Does the buggy pass the light bar test?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'passes_recovery_hitch_test',
    label: 'Passes Recovery Hitch Test',
    description: 'Does the buggy pass the recovery hitch test?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'performance_drive',
    label: 'Performance Drive',
    description: 'Is the buggy performing well on the drive?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'rear_bumper_black',
    label: 'Rear Bumper Black',
    description: 'Is the rear bumper black?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'rear_bumper_paint',
    label: 'Rear Bumper Paint',
    description: 'Is the rear bumper painted?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'recovery_hitch_intact',
    label: 'Recovery Hitch Intact',
    description: 'Is the recovery hitch intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'reg_ca_valid',
    label: 'Reg CA Valid',
    description: 'Is the CA registration valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'reg_nv_valid',
    label: 'Reg NV Valid',
    description: 'Is the NV registration valid?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'rims_intact',
    label: 'Rims Intact',
    description: 'Are the rims intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'seat_belts_all_in_place',
    label: 'Seat Belts All In Place',
    description: 'Are all the seat belts in place?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'seat_belts_all_work_properly',
    label: 'Seat Belts All Work Properly',
    description: 'Do all the seat belts work properly?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'shocks_intact',
    label: 'Shocks Intact',
    description: 'Are the shocks intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'side_panes_intact',
    label: 'Side Panes Intact',
    description: 'Are the side panes intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'steering_intact',
    label: 'Steering Intact',
    description: 'Is the steering intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'steering_left',
    label: 'Steering Left',
    description: 'Does the steering turn left?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: ' steering_right',
    label: ' Steering Right',
    description: 'Does the steering turn right?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'steering_wheel_padded',
    label: 'Steering Wheel Padded',
    description: 'Is the steering wheel padded?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'suspension_jam_nuts_intact',
    label: 'Suspension Jam Nuts Intact',
    description: 'Are the suspension jam nuts intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'suspension_quick_check',
    label: 'Suspension Quick Check',
    description: 'Did the suspension pass the quick check?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'throttle_intact',
    label: 'Throttle Intact',
    description: 'Is the throttle intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'throttle_springs_intact',
    label: 'Throttle Springs Intact',
    description: 'Are the throttle springs intact?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'tire_pressure_front',
    label: 'Tire Pressure Front',
    description: 'Is the tire pressure good in the front?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'tire_pressure_rear',
    label: 'Tire Pressure Rear',
    description: 'Is the tire pressure good in the rear?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'wires_condition_intact',
    label: 'Wires Condition Intact',
    description: 'Are the wires in good condition?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  },

  {
    type: 'radio',
    name: 'wires_in_place',
    label: 'Wires In Place',
    description: 'Are the wires in place?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ]
  }
];

const BuggyPretripForm = ({
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

      insertIntoBuggyPretripForm(supabase, data, 'vehicle_pretrip_buggy')
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

export default BuggyPretripForm;
