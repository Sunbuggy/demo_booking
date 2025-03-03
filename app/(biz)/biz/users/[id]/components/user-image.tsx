'use client';
import React from 'react';
import ImageView from '../../../vehicles/[id]/components/image-view';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';
import ResponsiveImageUpload from '../../../vehicles/[id]/components/responsive-image-upload-form';

const UserImage = ({
  profilePic,
  user_id
}: {
  profilePic: string;
  user_id: string;
}) => {
  const [isUpdateUploadDialogOpen, setIsUpdateUploadDialogOpen] =
    React.useState(false);
  return (
    <div>
      <ImageView width={400} height={300} src={profilePic} />
      {profilePic && (
        <div className="flex justify-center">
          <Button
            variant={'link'}
            onClick={() => setIsUpdateUploadDialogOpen(true)}
          >
            Update Profile Pic
          </Button>
          <DialogFactory
            title={'Update Profile Picture'}
            setIsDialogOpen={setIsUpdateUploadDialogOpen}
            isDialogOpen={isUpdateUploadDialogOpen}
            description="Update the profile picture for the vehicle. Please just upload a single image."
            children={
              <div>
                <ResponsiveImageUpload
                  url_key={`profile_pic/${user_id}`}
                  updatePic={true}
                  single={true}
                  bucket={'users'}
                />
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default UserImage;
