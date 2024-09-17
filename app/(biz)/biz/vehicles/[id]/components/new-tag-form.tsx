'use client';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import { User } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';

const NewTagForm = ({ user, id }: { user: User; id: string }) => {
  const [isDamagePicsDialogOpen, setIsDamagePicsDialogOpen] =
    React.useState(false);
  const [tag, setTag] = React.useState<VehicleTagType | null>({
    close_tag_comment: null,
    created_at: new Date().toISOString(),
    created_by: user.id,
    created_by_legacy: null,
    id: createId(),
    notes: null,
    tag_status: 'open',
    updated_at: null,
    updated_by: null,
    updated_by_legacy: null,
    vehicle_id: null,
    tag_type: 'maintenance'
  });
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submitting');
  };

  return (
    <div className="max-w-md mx-auto  p-8 rounded-lg shadow-md">
      <form className="space-y-6 w-full" onSubmit={onSubmit}>
        <div className="flex  items-baseline justify-center gap-8">
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

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Create Tag
        </button>
      </form>
    </div>
  );
};

export default NewTagForm;
