'use client';
import React from 'react';
import { SelectAlphabet, SelectNums } from './select-components';
import { Button } from '@/components/ui/button';
import { createGroups } from '@/utils/old_db/actions';
import { useToast } from '@/components/ui/use-toast';

interface CreateGroupWizardProps {
  hour: string;
  group_date: string;
  full_name: string;
}

const CreateGroupWizard: React.FC<CreateGroupWizardProps> = ({
  hour,
  group_date,
  full_name
}) => {
  const [groupName, setGroupName] = React.useState('');
  const [selectedAlphabet, setSelectedAlphabet] = React.useState('');
  const [selectedNum, setSelectedNum] = React.useState('');
  const [createGroup, setCreateGroup] = React.useState(false);
  const [hr] = React.useState(hour);
  const { toast } = useToast();
  React.useEffect(() => {
    setGroupName(`${hr}${selectedAlphabet}${selectedNum}`);
  }, [selectedAlphabet, selectedNum]);

  React.useEffect(() => {
    if (createGroup) {
      createGroups(groupName, group_date, full_name).then((res) => {
        res.error
          ? toast({
              title: 'Error',
              description: res.error as string,
              duration: 4000,
              variant: 'destructive'
            })
          : toast({
              title: 'Group Created',
              description: `Group ${groupName} has been created.`,
              duration: 2000,
              variant: 'success'
            });
      });
    }
  }, [groupName, createGroup]);

  return (
    <div className="flex items-center flex-col">
      <h1 className="mb-5 text-xl">Create a Group</h1>
      <div className="flex gap-4 items-center justify-center">
        <span className="text-4xl">{hr.split(':')[0]}</span>{' '}
        <SelectAlphabet setSelectedAlphabet={setSelectedAlphabet} />{' '}
        <SelectNums setSelectedNum={setSelectedNum} selectedNum={selectedNum} />
        {selectedAlphabet && (
          <div className=" font-bold text-2xl text-green-400 underline">
            {hr}
            {selectedAlphabet}
            {selectedNum}
          </div>
        )}
        <Button onClick={() => setCreateGroup(true)}>Confirm</Button>
      </div>
    </div>
  );
};

export default CreateGroupWizard;
