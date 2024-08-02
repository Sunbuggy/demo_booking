'use client';
import React from 'react';
import { SelectAlphabet, SelectNums } from './select-components';
import { Button } from '@/components/ui/button';
import { Groups } from '../cards/booking-card';
import { TooltipGroups } from './groups_tooltip';
import { InfoIcon } from 'lucide-react';

interface CreateGroupWizardProps {
  hour: number;
  fleet: {
    [x: string]: number;
  };
  groups: Groups[];
  groupVehicles: {
    id: string;
    quantity: number;
    old_vehicle_name: string | undefined | null;
    old_booking_id: number | undefined | null;
    groups: any;
  }[];
}

const CreateGroupWizard: React.FC<CreateGroupWizardProps> = ({
  hour,
  fleet,
  groups,
  groupVehicles
}) => {
  const [groupName, setGroupName] = React.useState('');
  const [selectedAlphabet, setSelectedAlphabet] = React.useState('');
  const [selectedNum, setSelectedNum] = React.useState('');
  const [showFleet, setShowFleet] = React.useState(false);
  const [hr] = React.useState(hour);
  React.useEffect(() => {
    setGroupName(`${hr}${selectedAlphabet}${selectedNum}`);
  }, [selectedAlphabet, selectedNum]);

  const filteredGVs = groupVehicles.filter((gv) =>
    gv.groups.group_name.includes(hour)
  );
  return (
    <div className="flex items-center flex-col">
      <h1 className="mb-5 text-xl">Create a Group</h1>
      <div className="border-2 p-2 m-3">
        <h2>Existing Groups For {hour}:00 Today</h2>
        <h5 className="text-xs m-2 flex justify-center items-center gap-2">
          {' '}
          <InfoIcon /> Hover over to see group assignments{' '}
        </h5>
        <div className="m-3">
          {groups
            ?.filter((g) => g.group_name.includes(String(hour)))
            ?.map((gp) => (
              <div key={gp.group_name} className="flex justify-center gap-2">
                <TooltipGroups hover={gp.group_name}>
                  <div>
                    {filteredGVs
                      .filter((gv) => gv.groups.group_name === gp.group_name)
                      .map((gr) => (
                        <div key={gr.id}>
                          {gr.old_booking_id} ({gr.old_vehicle_name} -{' '}
                          {gr.quantity} ),
                        </div>
                      ))}
                  </div>
                </TooltipGroups>{' '}
              </div>
            ))}
        </div>
      </div>
      {!showFleet && (
        <div className="flex gap-4 items-center justify-center">
          <span className="text-4xl">{hr}</span>{' '}
          <SelectAlphabet setSelectedAlphabet={setSelectedAlphabet} />{' '}
          <SelectNums
            setSelectedNum={setSelectedNum}
            selectedNum={selectedNum}
          />
          {selectedAlphabet && (
            <div className=" font-bold text-2xl text-green-400 underline">
              {hr}
              {selectedAlphabet}
              {selectedNum}
            </div>
          )}
          <Button onClick={() => setShowFleet(true)}>Confirm</Button>
        </div>
      )}
      {showFleet && (
        <div>
          <h1>Group Name: {groupName}</h1>
          <h2>Fleet List</h2>
          <ul>
            {Object.keys(fleet).map((key) => (
              <li key={key}>
                {key} - {fleet[key]}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => {
              setShowFleet(false);
            }}
          >
            &larr; Change Group Name
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateGroupWizard;
