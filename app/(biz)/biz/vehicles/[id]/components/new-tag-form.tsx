'use client';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import { User } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';
import { Button } from '@/components/ui/button';
import { changeVehicleStatusToBroken, changeVehicleStatusToMaintenance, checkAndChangeVehicleStatus, createVehicleTag } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DialogClose } from '@/components/ui/dialog';

const NewTagForm = ({ user, id }: { user: User; id: string }) => {
  const {toast} = useToast()
  const [isDamagePicsDialogOpen, setIsDamagePicsDialogOpen] =
    React.useState(false);
  const [tag, setTag] = React.useState({
    close_tag_comment: null,
    created_at: new Date().toISOString(),
    created_by: user.id,
    created_by_legacy: null,
    notes: "",
    tag_status: 'open',
    updated_at: null,
    updated_by: null,
    updated_by_legacy: null,
    vehicle_id: null,
    tag_type: 'maintenance' as unknown as VehicleTagType
  });
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTag = {...tag, vehicle_id: id,  created_by: user.id, notes: `(${user.user_metadata.full_name}): ${tag.notes}` } as unknown as VehicleTagType;
    console.log(newTag);
    const supabase = createClient();

    switch(newTag.tag_type){
      case 'maintenance':
        createVehicleTag(supabase,newTag)
        .then((res) => {
          changeVehicleStatusToMaintenance(supabase, id)
          .then((res) => {
            toast({
              title: 'Success',
              description: 'Tag created successfully',
              variant: 'success',
              duration: 2000
            })
          })
          .catch((err) => {
            console.error(err)
            toast({
              title: 'Error',
              description: 'Error changing vehicle status to maintenance',
              variant: 'destructive',
              duration: 2000
            })
          })
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Error',
            description: 'Error creating tag',
            variant: 'destructive',
            duration: 2000
          })})
      break;
      case 'repair':
        createVehicleTag(supabase,newTag)
        .then((res) => {
          changeVehicleStatusToBroken(supabase, id)
          .then((res) => {
            toast({
              title: 'Success',
              description: 'Tag created successfully',
              variant: 'success',
              duration: 2000
            })
          })
          .catch((err) => {
            console.error(err)
            toast({
              title: 'Error',
              description: 'Error changing vehicle status to broken',
              variant: 'destructive',
              duration: 2000
            })
          }
          )
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Error',
            description: 'Error creating tag',
            variant: 'destructive',
            duration: 2000
          })
        })
      break;
      default:
        console.log('default');
    }
    checkAndChangeVehicleStatus(supabase, id)
    .then((res) => {
    })
    .catch((err) => {
      console.error(err)
    })


  };

  return (
    <div className=" mx-auto  p-8 rounded-lg shadow-md w-full">
      <form className="space-y-6 w-full" onSubmit={onSubmit}>
        <div >
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <Textarea
            id="notes"
            name="notes"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Describe the issue with the vehicle..."
            onChange={
              (e) =>
                setTag({
                  ...tag,
                  notes: e.target.value
                })
            }
          />
        </div>
        {/* tag status select */}

        <div>
          <label
            htmlFor="tag-status"
            className="block text-sm font-medium text-gray-700"
          >
            Maintenance or Repair?
          </label>
          <select
            id="tag-status"
            name="tag-status"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            onChange={
              (e) =>
                setTag({
                  ...tag,
                  tag_type: e.target.value as unknown as VehicleTagType
                })
            }
          >
            <option value="maintenance">maintenance</option>
            <option value="repair">repair</option>
          </select>
        </div>
        {/* <DialogFactory
          isDialogOpen={isDamagePicsDialogOpen}
          setIsDialogOpen={setIsDamagePicsDialogOpen}
          title="Add Damage Pictures"
          description="Upload damage pictures for the vehicle."
          children={
            <div>
              <UploadForm
                handleSubmit={(e) =>
                  handleSubmit(
                    e,
                    `vehicle_damage/${id}/${new Date().toISOString()}`
                  )
                }
                inputFile={inputFile}
                setFiles={setFiles}
                uploading={uploading}
                multiple={true}
              />
            </div>
          }
        /> */}
      <DialogClose asChild>
        <Button
          type="submit"
        variant={'positive'}
        className='w-full'
        >
          Create Tag
        </Button>
      </DialogClose>
      </form>
    </div>
  );
};

export default NewTagForm;
