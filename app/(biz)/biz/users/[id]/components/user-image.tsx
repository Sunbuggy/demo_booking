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
  const [isNewUploadDialogOpen, setIsNewUploadDialogOpen] =
    React.useState(false);
  console.log(profilePic);
  return (
    <div>
      <ImageView width={400} height={300} src={profilePic} />
      {profilePic.length < 1 && (
        <div className="flex justify-center">
          <Button
            variant={'link'}
            onClick={() => setIsNewUploadDialogOpen(true)}
          >
            Upload Profile Pic
          </Button>
          <DialogFactory
            title={'Upload Profile Picture For User'}
            setIsDialogOpen={setIsNewUploadDialogOpen}
            isDialogOpen={isNewUploadDialogOpen}
            description="Upload a profile picture for this user"
            children={
              <div>
                <ResponsiveImageUpload
                  url_key={`users/profile-pics/${user_id}`}
                  single={true}
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
