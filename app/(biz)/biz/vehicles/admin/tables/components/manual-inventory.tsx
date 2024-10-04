'use client';
import React from 'react';
import { VehiclesType, type InventoryLocationInsert } from '../../../types';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { fetchVehicles } from '@/utils/supabase/queries';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/utils/cn';
import { DialogClose } from '@/components/ui/dialog';
// (property) InventoryLocation: {
//     bay: string | null;
//     created_at?: string;
//     created_by?: string | null;
//     level: string | null;
//     vehicle_id: string | null;
// }
const ManualInventory = ({ user_id }: { user_id: string }) => {
  const [inventoryLocations, setInventoryLocations] = React.useState<
    InventoryLocationInsert[]
  >([]);
  const [vehiclesList, setVehiclesList] = React.useState<VehiclesType[]>([]);
  const [formFields, setFormFields] = React.useState([
    { bay: '', level: '', selectedVehicle: '' }
  ]);
  const { toast } = useToast();
  const supabase = createClient();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchVehs() {
      await fetchVehicles(supabase)
        .then((data) => {
          setVehiclesList(data);
        })
        .catch((error) => {
          console.error('Error fetching vehicles', error);
        });
    }

    fetchVehs();
  }, []);

  const addFormField = () => {
    setFormFields([...formFields, { bay: '', level: '', selectedVehicle: '' }]);
  };

  const handleSelect = (index: number, selectedVehicle: string) => {
    const updatedFormFields = formFields.map((field, i) =>
      i === index ? { ...field, selectedVehicle } : field
    );
    setFormFields(updatedFormFields);
  };

  const handleSubmit = () => {
    if (user_id.length === 0) {
      toast({
        title: 'Error',
        description: 'No User Id',
        variant: 'destructive'
      });
      return;
    }

    const newRecords = formFields.map((field) => ({
      bay: field.bay,
      level: field.level,
      created_at: new Date().toISOString(),
      created_by: user_id,
      selectedVehicle: field.selectedVehicle
    }));

    console.log('new Recs', newRecords);

    // setInventoryLocations([...inventoryLocations, ...newRecords]);
  };
  return (
    <div className="space-y-4">
      {formFields.map((field, index) => (
        <div key={index} className="flex space-x-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {field.selectedVehicle
                  ? vehiclesList.find(
                      (veh) => veh.name === field.selectedVehicle
                    )?.name
                  : 'Select fleet...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search fleet..." />
                <CommandList>
                  <CommandEmpty>No fleet found.</CommandEmpty>
                  <CommandGroup>
                    {vehiclesList.map((veh) => (
                      <CommandItem
                        key={veh.id}
                        value={veh.name}
                        onSelect={(currentValue) => {
                          handleSelect(
                            index,
                            currentValue === field.selectedVehicle
                              ? ''
                              : currentValue
                          );
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            field.selectedVehicle === veh.name
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {veh.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <input
            type="text"
            placeholder="Bay"
            value={field.bay}
            onChange={(e) => {
              const newFormFields = [...formFields];
              newFormFields[index].bay = e.target.value;
              setFormFields(newFormFields);
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Level"
            value={field.level}
            onChange={(e) => {
              const newFormFields = [...formFields];
              newFormFields[index].level = e.target.value;
              setFormFields(newFormFields);
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      ))}
      <div className="flex space-x-4">
        <button
          onClick={addFormField}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add More
        </button>
        <DialogClose asChild>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Submit
          </button>
        </DialogClose>
      </div>
    </div>
  );
};

export default ManualInventory;
