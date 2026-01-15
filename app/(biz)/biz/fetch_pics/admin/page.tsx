'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Loader2, Trash2, Edit, Move } from 'lucide-react';

interface ImageData {
  key: string;
  url: string;
  groupName: string;
  date: string;
}

export default function ImageAdminPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [moveDate, setMoveDate] = useState<Date | undefined>();
  const [movingImages, setMovingImages] = useState<ImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  // Check user level on mount
  useEffect(() => {
    const checkUserLevel = async () => {
      try {
        const response = await fetch('/api/auth/level');
        if (!response.ok) throw new Error('Failed to fetch user level');
        const { level } = await response.json();
        setUserLevel(level);
        
        if (level <= 600) {
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Error checking user level:', error);
        router.push('/login');
      }
    };
    
    checkUserLevel();
  }, [router]);

  // Fetch images when date changes
  useEffect(() => {
    if (!selectedDate || !userLevel || userLevel <= 600) return;
    
    const fetchImages = async () => {
      setLoading(true);
      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const prefix = `${year}/${month}/${day}/`;

        const response = await fetch(
          `/api/s3/upload?bucket=sb-group-pics&key=${prefix}`
        );

        if (!response.ok) throw new Error('Failed to fetch images');

        const data = await response.json();
        const imageObjects = data.objects || [];

        const formattedImages = imageObjects.map((obj: { key: string; url: string }) => {
          const parts = obj.key.split('/');
          const groupName = parts[3] || 'Unknown Group';
          return {
            ...obj,
            groupName,
            date: `${year}-${month}-${day}`
          };
        });

        setImages(formattedImages);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load images',
          variant: 'destructive',
        });
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [selectedDate, userLevel, toast]);

  const toggleImageSelection = (imageKey: string) => {
    setSelectedImages(prev => 
      prev.includes(imageKey)
        ? prev.filter(key => key !== imageKey)
        : [...prev, imageKey]
    );
  };

  const handleDelete = async (imageKey: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const response = await fetch(`/api/s3/upload?bucket=sb-group-pics&key=${imageKey}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete image');

      setImages(images.filter(img => img.key !== imageKey));
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
      console.error('Error deleting image:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingImage || !newGroupName) return;
    
    try {
      const response = await fetch('/api/s3/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: 'sb-group-pics',
          oldKey: editingImage.key,
          newGroupName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update image');
      }

      const { newKey } = await response.json();

      setImages(images.map(img => 
        img.key === editingImage.key 
          ? { ...img, key: newKey, groupName: newGroupName } 
          : img
      ));
      
      setEditingImage(null);
      setNewGroupName('');
      toast({
        title: 'Success',
        description: 'Image updated successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update image',
        variant: 'destructive',
      });
      console.error('Error updating image:', error);
    }
  };

  const handleMove = async () => {
    if (!movingImages.length || !moveDate) return;
    
    try {
      const year = moveDate.getFullYear();
      const month = String(moveDate.getMonth() + 1).padStart(2, '0');
      const day = String(moveDate.getDate()).padStart(2, '0');
      const newPrefix = `${year}/${month}/${day}/`;

      const movePromises = movingImages.map(async (image) => {
        const parts = image.key.split('/');
        const filename = parts.pop();
        const groupName = parts.pop() || 'Unknown Group';
        const newKey = `${newPrefix}${groupName}/${filename}`;

        const response = await fetch('/api/s3/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucket: 'sb-group-pics',
            sourceKey: image.key,
            destinationKey: newKey
          }),
        });

        if (!response.ok) throw new Error(`Failed to move image ${image.key}`);
        return image.key;
      });

      const movedKeys = await Promise.all(movePromises);
      
      setImages(images.filter(img => !movedKeys.includes(img.key)));
      setMovingImages([]);
      setSelectedImages([]);
      setMoveDate(undefined);
      
      toast({
        title: 'Success',
        description: `${movedKeys.length} images moved successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move some images',
        variant: 'destructive',
      });
      console.error('Error moving images:', error);
    }
  };

  // ... rest of the component remains the same until the return statement

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Image Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin h-12 w-12" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">No images found for selected date</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Images for {selectedDate?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    const toMove = images.filter(img => selectedImages.includes(img.key));
                    if (toMove.length > 0) {
                      setMovingImages(toMove);
                      setMoveDate(selectedDate);
                    }
                  }}
                  disabled={selectedImages.length === 0}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Move Selected ({selectedImages.length})
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <Card key={image.key} className="relative group">
                    <div className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={`Group photo from ${image.groupName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedImages.includes(image.key)}
                          onChange={() => toggleImageSelection(image.key)}
                          className="h-5 w-5 rounded border-gray-300"
                        />
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {editingImage?.key === image.key ? (
                        <Input
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="mb-2"
                        />
                      ) : (
                        <h3 className="font-medium">{image.groupName}</h3>
                      )}
                      <div className="flex gap-2">
                        {editingImage?.key === image.key ? (
                          <>
                            <Button size="sm" onClick={handleUpdate}>
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingImage(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingImage(image);
                                setNewGroupName(image.groupName);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(image.key)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move Images Dialog */}
      {movingImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="flex items-center justify-center w-full max-w-md bg-gray-900 ">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Move {movingImages.length} Images to Another Date
              </h3>
              <p className="mb-2">Current: {movingImages[0].date}</p>
              
              <div className="mb-4">
                <Calendar
                  mode="single"
                  selected={moveDate}
                  onSelect={setMoveDate}
                  className="rounded-md border"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setMovingImages([]);
                    setSelectedImages([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleMove}>
                  Move {movingImages.length} Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}