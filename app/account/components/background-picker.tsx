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
  DialogTrigger 
} from '@/components/ui/dialog';
import { Palette, Upload, ArrowLeft, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
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
  
  // If it's already a full URL (signed or public), use it
  if (imageKeyOrPath.startsWith('http')) return imageKeyOrPath;

  const prefix = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX;
  
  if (!prefix) {
    // Only log this warning once per session to avoid console spam
    if (!window.hasLoggedBgWarning) {
      console.warn('⚠️ NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX is missing in .env.local. Backgrounds may not load on refresh.');
      window.hasLoggedBgWarning = true;
    }
    return ''; 
  }

  const cleanKey = imageKeyOrPath.startsWith('/') ? imageKeyOrPath.substring(1) : imageKeyOrPath;
  // Ensure we don't double slash if prefix ends with slash
  const separator = prefix.endsWith('/') ? '' : '/';
  return `${prefix}${separator}${cleanKey}`;
};

// Add type for global window check
declare global {
  interface Window {
    hasLoggedBgWarning?: boolean;
  }
}

const BackgroundPicker: React.FC<{ user: UserDetails }> = ({ user }) => {
  const { toast } = useToast();
  const supabase = createClient();

  // --- State ---
  const [isOpen, setIsOpen] = useState(false); 
  const [showUploadView, setShowUploadView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [selectedBackground, setSelectedBackground] = useState('');
  const [tempSelectedBackground, setTempSelectedBackground] = useState('');
  
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [backgroundProperties, setBackgroundProperties] =
    useState<BackgroundProperties>(DEFAULT_BG_PROPERTIES);

  // --- Logic: Apply CSS to Body ---
  const applyBackgroundToBody = (
    imageKey: string,
    properties: BackgroundProperties
  ) => {
    if (!imageKey) {
        document.body.style.backgroundImage = '';
        return;
    }

    // FIX: Try to find the pre-signed/valid URL from our loaded list first.
    // This solves the localhost issue where the constructed URL fails but the API URL works.
    const foundImage = backgroundImages.find(img => img.key === imageKey);
    const urlToUse = foundImage ? foundImage.url : getFullImageUrl(imageKey);
    
    if (urlToUse) {
        Object.assign(document.body.style, {
          backgroundImage: `url('${urlToUse}')`,
          backgroundRepeat: properties.repeat,
          backgroundSize: properties.size,
          backgroundPosition: properties.position,
          backgroundAttachment: 'fixed'
        });
    }
  };

  // --- Effect: Sync Body Style on Load & Change ---
  useEffect(() => {
    // Trigger whenever selection or properties change, OR when backgroundImages loads (to fix the URL lookup)
    if (selectedBackground) {
        applyBackgroundToBody(selectedBackground, backgroundProperties);
    }
  }, [selectedBackground, backgroundProperties, backgroundImages]);

  // --- Handlers ---
  const handleBackgroundChange = (value: string) =>
    setTempSelectedBackground(value);

  const handlePropertyChange = (
    property: keyof BackgroundProperties,
    value: string
  ) => {
    setBackgroundProperties((prev) => ({ ...prev, [property]: value }));
  };

  /**
   * DELETION HANDLER
   */
  const handleDeleteImage = async (imageKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this background image? This cannot be undone.")) return;

    setIsDeleting(imageKey);

    try {
        const encodedKey = encodeURIComponent(imageKey);
        const response = await fetch(`/api/s3/upload?bucket=users&key=${encodedKey}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to delete image from S3');
        }

        // Remove from local state
        setBackgroundImages((prev) => prev.filter((img) => img.key !== imageKey));
        
        // If the deleted image was currently selected, reset to none
        if (tempSelectedBackground === imageKey) {
            setTempSelectedBackground('');
        }
        if (selectedBackground === imageKey) {
            setSelectedBackground('');
            document.body.style.backgroundImage = '';
            await setUserBgImage(supabase, user.id, '');
        }

        toast({ title: "Image deleted successfully" });

    } catch (err: any) {
        console.error("Delete error:", err);
        toast({ title: "Failed to delete image", description: err.message, variant: "destructive" });
    } finally {
        setIsDeleting(null);
    }
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

      setSelectedBackground(tempSelectedBackground);
      
      const event = new CustomEvent('theme-changed', {
        detail: { 
            image: tempSelectedBackground, 
            properties: backgroundProperties 
        }
      });
      window.dispatchEvent(event);

      setIsOpen(false);
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
          `/api/s3/upload?bucket=users&key=background-images/${user.id}`
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
        // Initial fetch on mount to apply background if user already has one
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
            className="border-input text-foreground hover:bg-accent hover:text-accent-foreground gap-2"
        >
            <Palette className="h-4 w-4" />
            Theme
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
             {showUploadView ? (
                 <Button variant="ghost" size="sm" onClick={() => setShowUploadView(false)} className="p-0 h-auto hover:bg-transparent text-foreground hover:text-primary">
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
                       <div className="flex justify-center p-8 text-muted-foreground">Loading your gallery...</div>
                   ) : (
                       <CardContent className="p-0">
                           <div className="flex justify-between items-center mb-4">
                               <p className="text-sm text-muted-foreground">Select an image from your personal gallery.</p>
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
                                        className="flex flex-col items-center justify-center h-24 border-2 border-input rounded-md cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                                     >
                                         <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                                         <span className="text-xs text-foreground">None</span>
                                     </Label>
                                </div>

                                {backgroundImages.map((image) => (
                                <div key={image.key} className="relative group">
                                    <RadioGroupItem value={image.key} id={image.key} className="peer sr-only" />
                                    <Label
                                        htmlFor={image.key}
                                        className="block relative h-24 w-full cursor-pointer rounded-md overflow-hidden border-2 border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:shadow-md transition-all"
                                    >
                                        <img
                                            src={image.url}
                                            alt="Background"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </Label>
                                    
                                    {/* FIX: Improved Trash Icon Visibility */}
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        disabled={isDeleting === image.key}
                                        // Change: opacity-70 default, opacity-100 on hover. Added z-20.
                                        className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-md z-20 border border-white/20 bg-black/50 hover:bg-red-600 transition-all opacity-70 group-hover:opacity-100"
                                        onClick={(e) => handleDeleteImage(image.key, e)}
                                        title="Delete Image"
                                    >
                                        {isDeleting === image.key ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                                        ) : (
                                            <Trash2 className="h-3 w-3 text-white" />
                                        )}
                                    </Button>
                                </div>
                                ))}
                            </RadioGroup>
                           ) : (
                               <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/10">
                                   <p className="text-muted-foreground mb-2">No images found.</p>
                                   <Button variant="outline" onClick={() => setShowUploadView(true)}>Upload Your First Image</Button>
                               </div>
                           )}

                           <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 mt-4">
                                {Object.entries(backgroundProperties).map(([key, value]) => (
                                    <div key={key}>
                                        <Label className="text-xs uppercase text-muted-foreground mb-1 block">{key}</Label>
                                        <Select
                                            value={value}
                                            onValueChange={(val) => handlePropertyChange(key as keyof BackgroundProperties, val)}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-background border-input text-foreground">
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
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
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