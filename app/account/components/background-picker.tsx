'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  getUserBgImage,
  getUserBgProperties,
  setUserBgImage,
  setUserBgProperties,
  UserDetails
} from '@/utils/supabase/queries';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DialogFactory from '@/components/dialog-factory';
import UploadBgPics from './upload-bg-pics';
import { DialogClose } from '@/components/ui/dialog';

// Types for background images and properties
type BackgroundImage = {
  key: string;
  url: string;
};

type BackgroundProperties = {
  repeat: string;
  size: string;
  position: string;
};

// Default background properties
const DEFAULT_BG_PROPERTIES: BackgroundProperties = {
  repeat: 'no-repeat',
  size: 'cover',
  position: 'center'
};

const BackgroundPicker: React.FC<{ user: UserDetails }> = ({ user }) => {
  const { toast } = useToast();
  const supabase = createClient();

  // State variables
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState('');
  const [tempSelectedBackground, setTempSelectedBackground] = useState('');
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    []
  );
  const [backgroundProperties, setBackgroundProperties] =
    useState<BackgroundProperties>(DEFAULT_BG_PROPERTIES);

  // Apply background to body
  const applyBackgroundToBody = (
    imageUrl: string,
    properties: BackgroundProperties
  ) => {
    const fullImageUrl = `${process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX}/${imageUrl}`;
    Object.assign(document.body.style, {
      backgroundImage: `url(${fullImageUrl})`,
      backgroundRepeat: properties.repeat,
      backgroundSize: properties.size,
      backgroundPosition: properties.position,
      backgroundAttachment: 'fixed'
    });
  };

  // Handle background image selection
  const handleBackgroundChange = (value: string) =>
    setTempSelectedBackground(value);

  // Handle background property change
  const handlePropertyChange = (
    property: keyof BackgroundProperties,
    value: string
  ) => {
    setBackgroundProperties((prev) => ({ ...prev, [property]: value }));
  };

  // Save background settings
  const handleSaveBackground = async () => {
    setIsLoading(true);
    try {
      await setUserBgImage(supabase, user.id, tempSelectedBackground);
      await setUserBgProperties(
        supabase,
        user.id,
        backgroundProperties.size,
        backgroundProperties.repeat,
        backgroundProperties.position
      );
      setSelectedBackground(tempSelectedBackground);
      applyBackgroundToBody(tempSelectedBackground, backgroundProperties);
      toast({ title: 'Background updated successfully' });
    } catch (error) {
      console.error('Error saving background:', error);
      toast({ title: 'Failed to update background', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch background images and user preferences
  useEffect(() => {
    const fetchBackgroundData = async () => {
      setIsLoading(true);
      try {
        // Fetch background images
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload?bucket=users&key=background-images/${user.id}`
        );
        const { objects } = await response.json();
        setBackgroundImages(objects);

        // Fetch user's background image and properties
        const [bgImageData, bgPropertiesData] = await Promise.all([
          getUserBgImage(supabase, user.id),
          getUserBgProperties(supabase, user.id)
        ]);

        const image = bgImageData[0]?.bg_image || '';
        setSelectedBackground(image);
        setTempSelectedBackground(image);

        const properties = bgPropertiesData[0] || {};
        setBackgroundProperties({
          repeat: properties.bg_repeat || DEFAULT_BG_PROPERTIES.repeat,
          size: properties.bg_size || DEFAULT_BG_PROPERTIES.size,
          position: properties.bg_position || DEFAULT_BG_PROPERTIES.position
        });
      } catch (error) {
        console.error('Error fetching background data:', error);
        toast({
          title: 'Failed to load background data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackgroundData();
  }, [user.id, supabase, toast]);

  // Render background picker UI
  return (
    <div>
      <Button className="mb-5" onClick={() => setIsDialogOpen(true)}>
        Upload New Image
      </Button>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <DialogFactory
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            children={<UploadBgPics user_id={user.id} />}
            title="Upload A Custom Background Image"
            description="Upload a custom background image for your profile."
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
                  className="grid grid-cols-2 gap-4"
                >
                  {backgroundImages.map((image) => (
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
                          alt="Background option"
                          className="w-16 h-16 object-cover rounded mr-2"
                        />
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="" id="none" />
                    <Label
                      htmlFor="none"
                      className="flex items-center cursor-pointer"
                    >
                      None
                    </Label>
                  </div>
                </RadioGroup>
                <div className="mt-4 space-y-4">
                  {Object.entries(backgroundProperties).map(([key, value]) => (
                    <div key={key}>
                      <Label
                        htmlFor={`bg-${key}`}
                      >{`Background ${key.charAt(0).toUpperCase() + key.slice(1)}`}</Label>
                      <Select
                        value={value}
                        onValueChange={(newValue) =>
                          handlePropertyChange(
                            key as keyof BackgroundProperties,
                            newValue
                          )
                        }
                      >
                        <SelectTrigger id={`bg-${key}`}>
                          <SelectValue placeholder={`Select ${key} option`} />
                        </SelectTrigger>
                        <SelectContent>
                          {key === 'repeat' && (
                            <>
                              <SelectItem value="no-repeat">
                                No Repeat
                              </SelectItem>
                              <SelectItem value="repeat">Repeat</SelectItem>
                              <SelectItem value="repeat-x">
                                Repeat Horizontally
                              </SelectItem>
                              <SelectItem value="repeat-y">
                                Repeat Vertically
                              </SelectItem>
                            </>
                          )}
                          {key === 'size' && (
                            <>
                              <SelectItem value="cover">Cover</SelectItem>
                              <SelectItem value="contain">Contain</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="100% 100%">Stretch</SelectItem>
                            </>
                          )}
                          {key === 'position' && (
                            <>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex w-full">
                <DialogClose asChild>
                  <Button
                    className="w-full"
                    onClick={handleSaveBackground}
                    disabled={
                      tempSelectedBackground === selectedBackground &&
                      JSON.stringify(backgroundProperties) ===
                        JSON.stringify(DEFAULT_BG_PROPERTIES)
                    }
                  >
                    Save
                  </Button>
                </DialogClose>
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
