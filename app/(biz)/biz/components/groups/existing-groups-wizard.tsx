'use client';
import React from 'react';
import { Groups } from '../cards/booking-card';
import { Button } from '@/components/ui/button';
import { PopoverGroups } from './popover_group';

interface ExistingGroupsWizardProps {
  groups: Groups[];
  fleet: {
    [x: string]: number;
  };
  groupVehicles: {
    id: string;
    quantity: number;
    old_vehicle_name: string | undefined | null;
    old_booking_id: number | undefined | null;
    groups: any;
  }[];
  hour: number;
  res_id: number;
}

const ExistingGroupsWizard: React.FC<ExistingGroupsWizardProps> = ({
  groups,
  fleet,
  groupVehicles,
  hour,
  res_id
}) => {
  const filteredGVs = groupVehicles.filter((gv) =>
    gv.groups.group_name.includes(hour)
  );
  // From fleet add up the total number of vehicles
  const totalFleet = Object.values(fleet).reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-col items-center">
      <div className="border-2 m-2 p-2 flex flex-col w-96">
        <h1>
          Booking Fleet Total{' '}
          <span className="text-orange-500 bold text-xl">{totalFleet}</span>{' '}
        </h1>
        <div className="flex gap-4 justify-center text-orange-500">
          {Object.keys(fleet).map((key) => (
            <div key={key}>
              <p>
                {key} - {fleet[key]}{' '}
                <PopoverGroups openText="+Add">
                  <div>
                    <h1>Select Group and enter quantity to submit!</h1>
                    <div>
                      Available Groups:
                      {groups
                        .filter((g) => g.group_name.includes(String(hour)))
                        .map((gp) => (
                          <span key={gp.group_name} className="mr-3">
                            <Button className="m-3">{gp.group_name}</Button>
                          </span>
                        ))}
                    </div>
                    <div className="flex gap-2 mb-4">
                      how many {key}?{' '}
                      <input
                        type="number"
                        className="border-2 border-gray-300 pl-2 w-20"
                        max={fleet[key]}
                        placeholder={`maximum ${fleet[key]}`}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button>Submit</Button>
                    </div>
                  </div>
                </PopoverGroups>
              </p>
            </div>
          ))}
        </div>
      </div>
      <h1>Existing Groups</h1>

      <div className="flex gap-5 justify-center">
        <div>
          {groups
            .filter((g) => g.group_name.includes(String(hour)))
            .map((gp) => (
              <div key={gp.group_name} className="flex gap-4 items-center">
                <Button className="m-3">{gp.group_name} </Button>
                {/* Display from filtered the vehicle, old_booking_id and quantity in one line */}
                <div className="flex flex-col items-start text-xs gap-1">
                  {filteredGVs.map((gv) => (
                    <p
                      key={gv.id}
                      className={`${gv.old_booking_id === res_id ? 'text-orange-500' : ''}`}
                    >
                      <span>{gv.old_booking_id}</span>({gv.old_vehicle_name} -{' '}
                      {gv.quantity} ){' '}
                      <PopoverGroups openText="edit">
                        <div className="flex flex-col">
                          <div className="flex gap-2">
                            <h3> how many {gv.old_vehicle_name}? </h3>
                            <input
                              type="number"
                              className="border-2 border-gray-300 pl-2 m-3"
                              max={gv.quantity}
                              placeholder={`current ${gv.quantity}, max ${gv.quantity}`}
                            />
                          </div>
                          <Button>Submit</Button>
                        </div>
                      </PopoverGroups>
                      <PopoverGroups openText="delete">
                        <div>
                          Are you sure you want to remove ${gv.old_booking_id}'s
                          vehicle from this group?
                        </div>
                      </PopoverGroups>
                    </p>
                  ))}
                </div>
              </div>
            ))}
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default ExistingGroupsWizard;
