'use client';
import { UserDetails } from '@/utils/supabase/queries';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup } from '@/components/ui/radio-group';

const BackgroundPicker = ({ user }: { user: UserDetails }) => {
  const [selectedBackground, setSelectedBackground] =
    React.useState<string>('');
  return (
    <div>
      {/* <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Choose Your Background</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedBackground}
            onValueChange={handleBackgroundChange}
          >
            {backgroundImages.map((image) => (
              <div key={image.id} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={image.id} id={image.id} />
                <Label
                  htmlFor={image.id}
                  className="flex items-center cursor-pointer"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-16 h-16 object-cover rounded mr-2"
                  />
                  {image.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default BackgroundPicker;
