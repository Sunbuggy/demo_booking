'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/utils/supabase/client';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import React from 'react';
import { VehicleType } from '../../page';
import 'react-image-gallery/styles/css/image-gallery.css';
import DialogFactory from './dialog-factory';
import UploadForm from './upload-form';
import { useToast } from '@/components/ui/use-toast';
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}
export interface VehiclePics {
  key: string;
  url: string;
}

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>) {
  const vehicle = row.original as VehicleType;
  const supabase = createClient();
  const [isDamagePicsDialogOpen, setIsDamagePicsDialogOpen] =
    React.useState(false);
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const inputFile = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const id = vehicle.id;
  React.useEffect(() => {
    const channel = supabase
      .channel('fetch vehicles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const bucket = 'sb-fleet';
      //date in mm-yy-dd
      const date = new Date().toLocaleDateString('en-US').replaceAll('/', '-');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('key', `vehicle_damage/${id}/${date}`);
      formData.append('mode', 'single');
      formData.append('contentType', file.type);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'File uploaded successfully'
        });
      } else {
        throw new Error(data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="hover:cursor-pointer">
            <DotsVerticalIcon className="h-4" />
            <span className="sr-only">Open menu</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsDamagePicsDialogOpen(true)}>
            Add Damage Pics
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogFactory
        isDialogOpen={isDamagePicsDialogOpen}
        setIsDialogOpen={setIsDamagePicsDialogOpen}
        title="Damage Pictures"
        children={
          <div>
            <UploadForm
              handleSubmit={handleSubmit}
              inputFile={inputFile}
              setFile={setFile}
              uploading={uploading}
            />
          </div>
        }
      />
    </>
  );
}
