'use client';
import React from 'react';
import { SelectAlphabet, SelectNums } from './select-components';
import { Button } from '@/components/ui/button';
import { createGroups } from '@/utils/old_db/actions';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

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
  const [lead, setLead] = React.useState('');
  const [sweep, setSweep] = React.useState('');
  const [hr] = React.useState(hour);
  const { toast } = useToast();
  const router = useRouter();
  
  React.useEffect(() => {
    setGroupName(`${hr}${selectedAlphabet}${selectedNum}`);
  }, [selectedAlphabet, selectedNum, hr]);

  React.useEffect(() => {
    if (createGroup) {
      const dbHour = hr.padStart(2, '0');
      const dbGroupName = `${dbHour}${selectedAlphabet}${selectedNum}`;
      createGroups(dbGroupName, group_date, full_name, lead, sweep).then((res) => {
          res.error
            ? toast({ title: 'Error', description: res.error as string, variant: 'destructive' })
            : toast({ title: 'Group Created', description: `Group ${dbGroupName} created.`, variant: 'default' });
          router.refresh();
      });
      setSelectedAlphabet('');
      setSelectedNum('');
      setCreateGroup(false);
      setLead('');
      setSweep('');
      setGroupName('');
    }
  }, [groupName, createGroup, hr, group_date, full_name, lead, sweep, toast, router, selectedAlphabet, selectedNum]);

  const displayHour = (hourStr: string) => {
    const num = parseInt(hourStr);
    return isNaN(num) ? hourStr : num.toString();
  };
  const formattedHour = displayHour(hour);

  React.useEffect(() => {
    setGroupName(`${formattedHour}${selectedAlphabet}${selectedNum}`);
  }, [selectedAlphabet, selectedNum, formattedHour]);

  return (
    <div className="flex items-center flex-col gap-6 p-4">
      <h1 className="text-xl font-bold text-foreground">Create a Group</h1>
      
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center bg-muted/30 p-6 rounded-lg border border-border">
        {/* Name Construction */}
        <div className="flex items-center gap-2">
           <span className="text-4xl font-black text-foreground">{formattedHour}</span>
           <SelectAlphabet setSelectedAlphabet={setSelectedAlphabet} />
           <SelectNums setSelectedNum={setSelectedNum} selectedNum={selectedNum} />
        </div>

        {/* Live Preview */}
        {selectedAlphabet && (
          <div className="font-mono text-3xl font-bold text-green-600 dark:text-green-400 border-b-4 border-green-500/50 px-2">
            {formattedHour}{selectedAlphabet}{selectedNum}
          </div>
        )}

        {/* Staff Assignment */}
        <div className="flex flex-col gap-3 w-40">
          <Input type="text" placeholder="Lead Guide" onChange={(e) => setLead(e.target.value)} className="bg-background" />
          <Input type="text" placeholder="Sweep Guide" onChange={(e) => setSweep(e.target.value)} className="bg-background" />
        </div>
      </div>
      
      <Button onClick={() => setCreateGroup(true)} size="lg" className="w-full md:w-auto">Confirm Creation</Button>
    </div>
  );
};

export default CreateGroupWizard;