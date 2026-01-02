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
  CardContent,
  CardFooter,
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose 
} from '@/components/ui/dialog';
import { Palette, Upload, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import UploadBgPics from './upload-bg-pics';

// --- Types ---
type BackgroundImage = {
  key: string;
  url: string;
};

type BackgroundProperties = {
  repeat: string;
  size: string;
  position: string;
};

const DEFAULT_BG_PROPERTIES: BackgroundProperties = {
  repeat: 'no-repeat',
  size: 'cover',
  position: 'center'
};

// --- Helper: Safe URL Construction ---
const getFullImageUrl = (imageKeyOrPath: string) => {
  if (!imageKeyOrPath) return '';
  
  if (imageKeyOrPath.startsWith('http')) return imageKeyOrPath;

  const prefix = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX;
  
  if (!prefix) {
    console.error('CRITICAL: NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX is missing in .env.local');
    return ''; 
  }

  const cleanKey = imageKeyOrPath.startsWith('/') ? imageKeyOrPath.substring(1) : imageKeyOrPath;
  return `${prefix}/${cleanKey}`;
};

const BackgroundPicker: React.FC<{ user: UserDetails }> = ({ user }) => {
  const { toast } = useToast();
  const supabase = createClient();

  // --- State ---
  const [isOpen, setIsOpen] = useState(false); 
  const [showUploadView, setShowUploadView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedBackground, setSelectedBackground] = useState('');
  const [tempSelectedBackground, setTempSelectedBackground] = useState('');
  
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [backgroundProperties, setBackgroundProperties] =
    useState<BackgroundProperties>(DEFAULT_BG_PROPERTIES);

  // --- Logic: Apply CSS to Body ---
  const applyBackgroundToBody = (
    imageUrl: string,
    properties: BackgroundProperties
  ) => {
    if (!imageUrl) {
        document.body.style.backgroundImage = '';
        return;
    }

    const fullImageUrl = getFullImageUrl(imageUrl);
    
    if (fullImageUrl) {
        Object.assign(document.body.style, {
          backgroundImage: `url('${fullImageUrl}')`,
          backgroundRepeat: properties.repeat,
          backgroundSize: properties.size,
          backgroundPosition: properties.position,
          backgroundAttachment: 'fixed'
        });
    }
  };

  // --- Effect: Sync Body Style on Load & Change ---
  useEffect(() => {
    if (selectedBackground) {
        applyBackgroundToBody(selectedBackground, backgroundProperties);
    }
  }, [selectedBackground, backgroundProperties]);

  // --- Handlers ---
  const handleBackgroundChange = (value: string) =>
    setTempSelectedBackground(value);

  const handlePropertyChange = (
    property: keyof BackgroundProperties,
    value: string
  ) => {
    setBackgroundProperties((prev) => ({ ...prev, [property]: value }));
  };

  const handleSaveBackground = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        setUserBgImage(supabase, user.id, tempSelectedBackground),
        setUserBgProperties(
            supabase,
            user.id,
            backgroundProperties.size,
            backgroundProperties.repeat,
            backgroundProperties.position
        )
      ]);

      // Update the local state
      setSelectedBackground(tempSelectedBackground);
      
      // NEW: Dispatch event to tell GlobalBackgroundManager to update immediately
      const event = new CustomEvent('theme-changed', {
        detail: { 
            image: tempSelectedBackground, 
            properties: backgroundProperties 
        }
      });
      window.dispatchEvent(event);

      setIsOpen(false); // Close modal on save
      
      toast({ title: 'Theme updated successfully' });
    } catch (error) {
      console.error('Error saving background:', error);
      toast({ title: 'Failed to update background', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effect: Data Fetching ---
  useEffect(() => {
    let isMounted = true;

    const fetchBackgroundData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/s3/upload?bucket=users&key=background-images/${user.id}`
        );
        
        const [bgImageData, bgPropertiesData] = await Promise.all([
            getUserBgImage(supabase, user.id),
            getUserBgProperties(supabase, user.id)
        ]);

        if (!isMounted) return;

        if (response.ok) {
            const { objects } = await response.json();
            setBackgroundImages(objects || []);
        }

        const image = bgImageData[0]?.bg_image || '';
        const properties = bgPropertiesData[0] || {};

        setSelectedBackground(image);
        setTempSelectedBackground(image);
        
        setBackgroundProperties({
          repeat: properties.bg_repeat || DEFAULT_BG_PROPERTIES.repeat,
          size: properties.bg_size || DEFAULT_BG_PROPERTIES.size,
          position: properties.bg_position || DEFAULT_BG_PROPERTIES.position
        });

      } catch (error) {
        console.error('Error fetching background data:', error);
        if (isMounted) toast({ title: 'Failed to load background data', variant: 'destructive' });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isOpen) {
        fetchBackgroundData();
    } else {
         fetchBackgroundData();
    }

    return () => { isMounted = false; };
  }, [user.id, supabase, toast, isOpen]);

  // --- RENDER ---
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
            variant="outline" 
            className="border-stone-700 text-stone-200 hover:bg-stone-800 hover:text-orange-500 gap-2"
        >
            <Palette className="h-4 w-4" />
            Theme
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-stone-900 border-stone-800 text-stone-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             {showUploadView ? (
                 <Button variant="ghost" size="sm" onClick={() => setShowUploadView(false)} className="p-0 h-auto hover:bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Gallery
                 </Button>
             ) : (
                <>Customize Dashboard</>
             )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
            {showUploadView ? (
                <div className="animate-in fade-in zoom-in duration-300">
                    <UploadBgPics user_id={user.id} />
                </div>
            ) : (
                <>
                   {isLoading ? (
                       <div className="flex justify-center p-8 text-stone-500">Loading your gallery...</div>
                   ) : (
                       <CardContent className="p-0">
                           <div className="flex justify-between items-center mb-4">
                               <p className="text-sm text-stone-400">Select an image from your personal gallery.</p>
                               <Button 
                                   variant="secondary" 
                                   size="sm" 
                                   onClick={() => setShowUploadView(true)}
                                   className="gap-2"
                                >
                                   <Upload className="h-3 w-3" /> Upload New
                               </Button>
                           </div>

                           {backgroundImages.length > 0 ? (
                            <RadioGroup
                                value={tempSelectedBackground}
                                onValueChange={handleBackgroundChange}
                                className="grid grid-cols-3 gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2"
                            >
                                <div className="relative">
                                     <RadioGroupItem value="" id="none" className="peer sr-only" />
                                     <Label 
                                        htmlFor="none" 
                                        className="flex flex-col items-center justify-center h-24 border-2 border-stone-700 rounded-md cursor-pointer hover:border-stone-500 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-500/10 transition-all"
                                     >
                                         <ImageIcon className="h-6 w-6 text-stone-500 mb-1" />
                                         <span className="text-xs">None</span>
                                     </Label>
                                </div>

                                {backgroundImages.map((image) => (
                                <div key={image.key} className="relative">
                                    <RadioGroupItem value={image.key} id={image.key} className="peer sr-only" />
                                    <Label
                                        htmlFor={image.key}
                                        className="block relative h-24 w-full cursor-pointer rounded-md overflow-hidden border-2 border-transparent peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:shadow-[0_0_10px_rgba(249,115,22,0.3)] transition-all"
                                    >
                                        <img
                                            src={image.url}
                                            alt="Background"
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                        />
                                    </Label>
                                </div>
                                ))}
                            </RadioGroup>
                           ) : (
                               <div className="text-center py-8 border-2 border-dashed border-stone-800 rounded-lg">
                                   <p className="text-stone-500 mb-2">No images found.</p>
                                   <Button variant="outline" onClick={() => setShowUploadView(true)}>Upload Your First Image</Button>
                               </div>
                           )}

                           <div className="grid grid-cols-3 gap-4 border-t border-stone-800 pt-4 mt-4">
                                {Object.entries(backgroundProperties).map(([key, value]) => (
                                    <div key={key}>
                                        <Label className="text-xs uppercase text-stone-500 mb-1 block">{key}</Label>
                                        <Select
                                            value={value}
                                            onValueChange={(val) => handlePropertyChange(key as keyof BackgroundProperties, val)}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-stone-950 border-stone-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {key === 'repeat' && (<><SelectItem value="no-repeat">No Repeat</SelectItem><SelectItem value="repeat">Repeat</SelectItem></>)}
                                                {key === 'size' && (<><SelectItem value="cover">Cover</SelectItem><SelectItem value="contain">Contain</SelectItem><SelectItem value="auto">Auto</SelectItem></>)}
                                                {key === 'position' && (<><SelectItem value="center">Center</SelectItem><SelectItem value="top">Top</SelectItem><SelectItem value="left">Left</SelectItem></>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                           </div>
                       </CardContent>
                   )}
                </>
            )}
        </div>

        {!showUploadView && (
            <CardFooter className="px-0 pt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button 
                    onClick={handleSaveBackground} 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BackgroundPicker;