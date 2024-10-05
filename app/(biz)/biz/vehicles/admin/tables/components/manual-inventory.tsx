'use client';
import React from 'react';
import { VehiclesType, type InventoryLocationInsert } from '../../../types';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import {
  fetchVehicles,
  insertIntoVehicleInventoryLocation
} from '@/utils/supabase/queries';
import { DialogClose } from '@/components/ui/dialog';

const ManualInventory = ({ user_id }: { user_id: string }) => {
  const [inventoryLocations, setInventoryLocations] = React.useState<
    InventoryLocationInsert[]
  >([]);
  const [vehiclesList, setVehiclesList] = React.useState<VehiclesType[]>([]);
  const [formFields, setFormFields] = React.useState([
    { bay: '', level: '', vehicle_id: '' }
  ]);
  const { toast } = useToast();
  const supabase = createClient();

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
    setFormFields([...formFields, { bay: '', level: '', vehicle_id: '' }]);
  };

  const handleSelect = (index: number, vehicle_id: string) => {
    const updatedFormFields = formFields.map((field, i) =>
      i === index ? { ...field, vehicle_id } : field
    );
    setFormFields(updatedFormFields);
  };

  React.useEffect(() => {
    if (inventoryLocations.length > 0) {
      inventoryLocations.forEach((location) => {
        insertIntoVehicleInventoryLocation(supabase, location)
          .then((data) => {
            toast({
              title: 'Success',
              description: 'Inventory Location inserted successfully',
              variant: 'success',
              duration: 3000
            });
          })
          .catch((error) => {
            console.error('Error inserting into inventory location', error);
            toast({
              title: 'Error',
              description: 'Error inserting into inventory location',
              variant: 'destructive',
              duration: 6000
            });
          });
      });
    }
  }, [inventoryLocations]);

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
      vehicle_id: field.vehicle_id
    }));

    // console.log('new Recs', newRecords);

    setInventoryLocations([...inventoryLocations, ...newRecords]);
  };
  return (
    <div className="space-y-4">
      {formFields.map((field, index) => (
        <div key={index} className="flex space-x-4">
          <select
            value={field.vehicle_id}
            onChange={(e) => {
              handleSelect(index, e.target.value);
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Fleet List</option>
            {vehiclesList
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
          </select>
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
