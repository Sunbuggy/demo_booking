'use client';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { VehicleTagType } from '../../admin/page';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  changeVehicleStatusToBroken,
  changeVehicleStatusToMaintenance,
  checkAndChangeVehicleStatus,
  createVehicleTag
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DialogClose } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CameraIcon } from 'lucide-react';

// from createId create a new uuid consisting of 8 characters - 4 characters - 4 characters - 4 characters - 12 characters

const NewTagForm = ({ user, id }: { user: User; id: string }) => {
  const supabase = createClient();
  const [files, setFiles] = React.useState<File[]>([]);
  const [ultimateId, setUltimateId] = React.useState('');
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const inputFile = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [tag, setTag] = React.useState({
    close_tag_comment: null,
    created_at: new Date().toISOString(),
    created_by: user.id,
    created_by_legacy: null,
    notes: '',
    tag_status: 'open',
    updated_at: null,
    updated_by: null,
    updated_by_legacy: null,
    vehicle_id: null,
    tag_type: 'maintenance' as unknown as VehicleTagType
  });
  const handleSubmit = async (key: string, update_pic?: boolean) => {
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const bucket = 'sb-fleet';
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      formData.append('bucket', bucket);
      formData.append('mode', files.length > 1 ? 'multiple' : 'single');
      formData.append('contentType', files[0].type); // Assuming all files have the same type
      formData.append('key', key);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: update_pic ? 'PUT' : 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Files uploaded successfully'
        });
      } else {
        throw new Error(data.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive'
      });
    } finally {
      // reload page
      // window.location.reload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      if (setFiles) {
        setFiles(fileArray);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (setFiles) {
      setFiles(newFiles);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newTag = {
      ...tag,
      vehicle_id: id,
      created_by: user.id,
      notes: `(${user.user_metadata.full_name}): ${tag.notes}`
    } as unknown as VehicleTagType;
    console.log(newTag);
    const supabase = createClient();

    switch (newTag.tag_type) {
      case 'maintenance':
        createVehicleTag(supabase, newTag)
          .then((res) => {
            changeVehicleStatusToMaintenance(supabase, id)
              .then((res) => {
                toast({
                  title: 'Success',
                  description: 'Tag created successfully',
                  variant: 'success',
                  duration: 2000
                });
              })
              .catch((err) => {
                console.error(err);
                toast({
                  title: 'Error',
                  description: 'Error changing vehicle status to maintenance',
                  variant: 'destructive',
                  duration: 2000
                });
              });
            handleSubmit(`vehicle_damage/${id}/${res[0].id}`, false);
          })
          .catch((err) => {
            console.error(err);
            toast({
              title: 'Error',
              description: 'Error creating tag',
              variant: 'destructive',
              duration: 2000
            });
          });
        break;
      case 'repair':
        createVehicleTag(supabase, newTag)
          .then((res) => {
            changeVehicleStatusToBroken(supabase, id)
              .then((res) => {
                toast({
                  title: 'Success',
                  description: 'Tag created successfully',
                  variant: 'success',
                  duration: 2000
                });
              })
              .catch((err) => {
                console.error(err);
                toast({
                  title: 'Error',
                  description: 'Error changing vehicle status to broken',
                  variant: 'destructive',
                  duration: 2000
                });
              });
            handleSubmit(`vehicle_damage/${id}/${res[0].id}`, false);
          })
          .catch((err) => {
            console.error(err);
            toast({
              title: 'Error',
              description: 'Error creating tag',
              variant: 'destructive',
              duration: 2000
            });
          });
        break;
      default:
        console.log('default');
    }
    checkAndChangeVehicleStatus(supabase, id)
      .then((res) => {
        // reload page
      })
      .catch((err) => {
        console.error(err);
      });
    console.log(`vehicle_damage/${id}/${ultimateId}`);
  };

  React.useEffect(() => {
    const channel = supabase
      .channel('realtime vehicle tags & vehicle')
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
    <div className=" mx-auto  p-8 rounded-lg shadow-md w-full">
      <form className="space-y-6 w-full" onSubmit={onSubmit}>
        <div>
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
            onChange={(e) =>
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
            onChange={(e) =>
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
        <div>
          {/* Stage pics for uploading */}
          {!selectedFiles.length && (
            <>
              <Label
                htmlFor="file"
                className="block text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-2 text-center cursor-pointer"
              >
                <Input
                  type="file"
                  id="file"
                  className="hidden"
                  multiple
                  ref={inputFile}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                />
                Click Here To Upload Pics
              </Label>
              <Label
                htmlFor="camera"
                className="flex w-full justify-center gap-5 text-sm font-medium border-2 border-dashed dark:border-gray-300 rounded-md p-2 text-center cursor-pointer mt-2 lg:hidden"
              >
                <Input
                  type="file"
                  id="camera"
                  className="hidden"
                  capture="environment"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                />
                {/*camera icon  */}
                <CameraIcon size={24} />
                Click Here To Take A Picture
              </Label>
            </>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Selected file ${index + 1}`}
                  className="w-20 h-20 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-0 right-0 bg-red-500 w-[20px] h-[20px] text-white rounded-full p-1 flex items-center justify-center"
                >
                  &minus;
                </button>
              </div>
            ))}
          </div>
        </div>

        <DialogClose asChild>
          <Button type="submit" variant={'positive'} className="w-full">
            Create Tag
          </Button>
        </DialogClose>
      </form>
    </div>
  );
};

export default NewTagForm;
