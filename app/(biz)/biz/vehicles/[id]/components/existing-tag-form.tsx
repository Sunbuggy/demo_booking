'use client';
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import { Textarea } from '@/components/ui/textarea';
import dayjs from 'dayjs';
import { User } from '@supabase/supabase-js';
import {
  checkAndChangeVehicleStatus,
  getUserDetailsById,
  updateVehicleTag
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DialogClose } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import ImageGrid from './image-grid';
import { VehiclePics } from '../../admin/tables/components/row-actions';
import { Button } from '@/components/ui/button';
import DialogFactory from '../../admin/tables/components/dialog-factory';
import ResponsiveImageUpload from './responsive-image-upload-form';

const ExistingTagForm = ({
  tag,
  user,
  status
}: {
  tag: VehicleTagType | null;
  user: User;
  status?: string;
}) => {
  const [isNewUploadDialogOpen, setIsNewUploadDialogOpen] =
    React.useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const [createdBy, setCreatedBy] = React.useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<VehiclePics[]>([]);
  const router = useRouter();
  const [files, setFiles] = React.useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const inputFile = React.useRef<HTMLInputElement>(null);
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
        close_tag_comment: `(${user.user_metadata.full_name}) ${formValues.close_tag_comment}`,
        tag_status: 'closed'
      };
      // close the tag
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
  const new_created_by_id = tag?.created_by as string;
  const new_updated_by_id = tag?.updated_by as string;

  React.useEffect(() => {
    if (new_created_by_id && new_created_by_id !== '') {
      getUserDetailsById(supabase, new_created_by_id)
        .then((res) => {
          if (res) setCreatedBy(res[0].full_name || '');
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (new_updated_by_id && new_updated_by_id !== '') {
      getUserDetailsById(supabase, new_updated_by_id)
        .then((res) => {
          if (res) setUpdatedBy(res[0].full_name || '');
        })
        .catch((err) => {
          console.error(err);
        });
    }

    async function fetchPicsIfExists() {
      const bucket = 'sb-fleet';
      const veh_id = tag?.vehicle_id || '';
      const tag_id = tag?.id || '';
      const response = await fetch(
        '/api/s3/upload/?bucket=' +
          bucket +
          '&key=vehicle_damage/' +
          veh_id +
          '/' +
          tag_id
      );
      const data = await response.json();

      setImages((data?.objects as VehiclePics[]) || []);
    }
    fetchPicsIfExists();
  }, []);

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime vehicle tags and vehicle')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_tag'
        },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return (
    <div className="max-w-md mx-auto  p-8 rounded-lg shadow-md w-full">
      <div className="text-gray-700 text-md mb-5">
        opened by {tag?.created_by_legacy || createdBy || 'unknown user'}
        <br />
        on {dayjs(tag?.created_at || '').format('YY/MM/DD@hh:mm a')}
        <br />
        {(tag?.updated_by_legacy || tag?.updated_by) &&
          `last updated by: ${tag?.updated_by_legacy || updatedBy || 'unknown user'} @ ${dayjs(tag?.updated_at || '').format('YY/MM/DD@hh:mm a')}`}
        {/* if there is a close_tag_comment and the status is closed add a closed by here */}
        {tag?.close_tag_comment && tag?.tag_status === 'closed' && (
          <>
            <br />
            closed by {tag?.updated_by_legacy || updatedBy || 'unknown user'}
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
      <Accordion type="single" collapsible>
        <AccordionItem value="tag-pics">
          <AccordionTrigger>Associated Images</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">
            {status !== 'closed' && (
              <div>
                <DialogFactory
                  title="Add Profile Pic"
                  setIsDialogOpen={setIsNewUploadDialogOpen}
                  isDialogOpen={isNewUploadDialogOpen}
                  description="Upload a profile picture for the vehicle."
                  children={
                    <ResponsiveImageUpload
                      url_key={`vehicle_damage/${tag?.vehicle_id}/${tag?.id}`}
                    />
                  }
                />
                <Button onClick={() => setIsNewUploadDialogOpen(true)}>
                  Upload more images
                </Button>
              </div>
            )}
            <ImageGrid images={images} width={100} height={75} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ExistingTagForm;
