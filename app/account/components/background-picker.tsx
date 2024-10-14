'use client';

import {
  getUserBgImage,
  setUserBgImage,
  UserDetails
} from '@/utils/supabase/queries';
import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';
import UploadBgPics from './upload-bg-pics';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type BackgroundPicType = {
  key: string;
  url: string;
};

const BackgroundPicker = ({ user }: { user: UserDetails }) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedBackground, setSelectedBackground] =
    React.useState<string>('');
  const [tempSelectedBackground, setTempSelectedBackground] =
    React.useState<string>('');
  const [backgroundImages, setBackgroundImages] = React.useState<
    BackgroundPicType[]
  >([]);
  const supabase = createClient();

  const handleBackgroundChange = (value: string) => {
    setTempSelectedBackground(value);
  };

  const handleSaveBackground = async () => {
    setLoading(true);
    await setUserBgImage(supabase, user.id, tempSelectedBackground)
      .then(() => {
        setSelectedBackground(tempSelectedBackground);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    setLoading(true);
    const bucket = 'users';
    const key = 'users/';
    // fetch background images
    fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload?bucket=${bucket}&key=${`background-images/${user.id}`}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const { objects } = data;
        setBackgroundImages(objects);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });

    getUserBgImage(supabase, user.id)
      .then((data) => {
        const image = data[0]?.bg_image || '';
        setSelectedBackground(image);
        setTempSelectedBackground(image);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    console.log(backgroundImages);
  }, [backgroundImages]);

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>Upload New Image</Button>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <DialogFactory
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            children={<UploadBgPics user_id={user.id} />}
            title={'Upload A Custom Profile Picture For Yourself'}
            description="Upload a custom profile picture for yourself. This will not be visible to other users."
          />
          {backgroundImages.length > 0 ? (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Choose Your Background</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={tempSelectedBackground}
                  onValueChange={handleBackgroundChange}
                >
                  {backgroundImages &&
                    backgroundImages?.map((image) => (
                      <div
                        key={image.key}
                        className="flex items-center space-x-2 mb-2"
                      >
                        <RadioGroupItem value={image.key} id={image.key} />
                        <Label
                          htmlFor={image.key}
                          className="flex items-center cursor-pointer"
                        >
                          <img
                            src={image.url}
                            alt={'background image'}
                            className="w-16 h-16 object-cover rounded mr-2"
                          />
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </CardContent>
              <CardFooter className="flex w-full">
                <Button
                  className="w-full"
                  onClick={handleSaveBackground}
                  disabled={tempSelectedBackground === selectedBackground}
                >
                  Save
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <p>No background images found</p>
          )}
        </>
      )}
    </div>
  );
};

export default BackgroundPicker;
