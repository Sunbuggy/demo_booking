import React from 'react';
import { SelectAlphabet, SelectNums } from './select-components';
import { Button } from '@/components/ui/button';

interface CreateGroupWizardProps {
  hour: number;
  fleet: {
    [x: string]: number;
  };
}

const CreateGroupWizard: React.FC<CreateGroupWizardProps> = ({
  hour,
  fleet
}) => {
  const [groupName, setGroupName] = React.useState('');
  const [selectedAlphabet, setSelectedAlphabet] = React.useState('');
  const [selectedNum, setSelectedNum] = React.useState('');
  const [showFleet, setShowFleet] = React.useState(false);
  const [hr] = React.useState(hour);
  React.useEffect(() => {
    setGroupName(`${hr}${selectedAlphabet}${selectedNum}`);
  }, [selectedAlphabet, selectedNum]);

  return (
    <div>
      <h1 className="mb-5 text-xl">Create a Group</h1>
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
