'use client';
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import { Textarea } from '@/components/ui/textarea';
import dayjs from 'dayjs';
import { User } from '@supabase/supabase-js';
import { checkAndChangeVehicleStatus, updateVehicleTag } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DialogClose } from '@/components/ui/dialog';

const ExistingTagForm = ({
  tag,
  user,
  status
}: {
  tag: VehicleTagType | null;
  user: User;
  status?: string;
}) => {
  const supabase = createClient();
  const { toast } = useToast();

  const [formValues, setFormValues] = React.useState<VehicleTagType>({
    tag_status: tag?.tag_status || 'open',
    notes: tag?.notes || '',
    close_tag_comment: tag?.close_tag_comment || '',
    updated_by: tag?.updated_by || null,
    updated_at: new Date().toISOString(),
    vehicle_id: tag?.vehicle_id || '',
    created_by_legacy: tag?.created_by_legacy || '',
    updated_by_legacy: tag?.updated_by_legacy || '',
    created_at: tag?.created_at || null,
    created_by: tag?.created_by || null,
    id: tag?.id || '',
    tag_type: tag?.tag_type || null
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //

    if (formValues.tag_status === 'closed') {
      const updatedFormValues: VehicleTagType = {
        ...formValues,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        close_tag_comment: formValues.close_tag_comment,
        tag_status: 'closed'
      };
      // close the tag
      console.log('close the tag');
      await updateVehicleTag(supabase, updatedFormValues, tag?.id || '')
        .then((res) => {
          toast({
            title: 'Success',
            description: 'Tag closed successfully',
            variant: 'success',
            duration: 2000
          });
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: 'Error',
            description: 'Error closing tag',
            variant: 'destructive',
            duration: 2000
          });
        });
      // create a new variable that is formValues minus the old_notes
    } else {
      const updatedFormValues = {
        ...formValues,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        notes: tag?.notes + ' ' + formValues.notes
      };
      await updateVehicleTag(supabase, updatedFormValues, tag?.id || '')
        .then((res) => {
          toast({
            title: 'Success',
            description: 'Tag updated successfully',
            variant: 'success',
            duration: 2000
          });
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: 'Error',
            description: 'Error updating tag',
            variant: 'destructive',
            duration: 2000
          });
        });
    }
    checkAndChangeVehicleStatus(supabase, tag?.vehicle_id || '');
  };

  return (
    <div className="max-w-md mx-auto  p-8 rounded-lg shadow-md w-full">
      <div className="text-gray-700 text-md mb-5">
        opened by {tag?.created_by_legacy || tag?.created_by || 'unknown user'}
        <br />
        on {dayjs(tag?.created_at || '').format('YY/MM/DD@hh:mm a')}
        <br />
        {(tag?.updated_by_legacy || tag?.updated_by) &&
          `last updated by: ${tag?.updated_by_legacy || tag?.updated_by || 'unknown user'} @ ${dayjs(tag?.updated_at || '').format('YY/MM/DD@hh:mm a')}`}
        {/* if there is a close_tag_comment and the status is closed add a closed by here */}
        {tag?.close_tag_comment && tag?.tag_status === 'closed' && (
          <>
            <br />
            closed by{' '}
            {tag?.updated_by_legacy || tag?.updated_by || 'unknown user'}
            <br />
            on{' '}
            {tag?.updated_at
              ? dayjs(tag?.updated_at || '').format('YY/MM/DD@hh:mm a')
              : 'unknown date'}
          </>
        )}
      </div>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="flex gap-2 items-baseline">
          <label
            htmlFor="tag-status"
            className="block text-sm font-medium text-gray-400"
          >
            Tag Status
          </label>
          <select
            id="tag-status"
            name="tag-status"
            value={formValues.tag_status}
            onChange={(e) =>
              setFormValues({
                ...formValues,
                tag_status: e.target.value as 'open' | 'closed'
              })
            }
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            disabled={status === 'closed'}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex gap-2 items-baseline">
          <label
            htmlFor="old_notes"
            className="block text-sm font-medium text-gray-400"
          >
            Old Notes
          </label>
          <Textarea
            id="old_notes"
            name="old_notes"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Describe the issue with the vehicle..."
            value={tag?.notes || ''}
            onChange={(e) => {
              setFormValues({ ...formValues, notes: e.target.value });
            }}
            disabled
          />
        </div>
        {formValues.tag_status === 'open' && (
          <div className="flex gap-2 items-baseline">
            <label
              htmlFor="new_notes"
              className="block text-sm font-medium text-gray-400"
            >
              New Notes
            </label>
            <Textarea
              id="new_notes"
              name="new_notes"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Add New Notes if only the tag is staying open..."
              onChange={(e) => {
                setFormValues({
                  ...formValues,
                  notes: `(${user.user_metadata.full_name}) ${e.target.value}`
                });
              }}
            />
          </div>
        )}
        {formValues.tag_status === 'closed' && (
          <div className="flex gap-2 items-baseline">
            <label
              htmlFor="close-tag-comment"
              className="block text-sm font-medium text-gray-400"
            >
              Close Tag Comment
            </label>
            <Textarea
              id="close-tag-comment"
              name="close-tag-comment"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              value={formValues.close_tag_comment || ''}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  close_tag_comment: e.target.value
                })
              }
              disabled={status === 'closed'}
            />
          </div>
        )}
        {status !== 'closed' && (
          <DialogClose asChild>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {formValues.tag_status === 'closed' ? 'Close Tag' : 'Update Tag'}
            </button>
          </DialogClose>
        )}
      </form>
    </div>
  );
};

export default ExistingTagForm;
