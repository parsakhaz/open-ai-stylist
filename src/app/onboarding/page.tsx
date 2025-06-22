'use client';

import { useAppStore, ModelImage } from '../store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    modelImages, 
    loadModelImages, 
    addPlaceholderImage, 
    updatePlaceholderImage, 
    approvedModelImageUrls,
    deleteModelImage
  } = useAppStore();
  
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadModelImages();
  }, [loadModelImages]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const placeholderId = addPlaceholderImage(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/validate-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.reason || 'Validation failed');
        }

        updatePlaceholderImage(placeholderId, result.finalImageState);
        
      } catch (error) {
        console.error('Upload failed:', error);
        updatePlaceholderImage(placeholderId, {
          url: URL.createObjectURL(file),
          status: 'failed',
          reason: error instanceof Error ? error.message : 'An unknown error occurred.'
        });
      }
    }

    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (image: ModelImage) => {
    setDeletingImageId(image.id);
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image.url }),
      });

      if (response.ok) {
        deleteModelImage(image.url);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete image from server');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  };
  
  const canContinue = approvedModelImageUrls.length >= 4;

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8 pt-20">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Digital Model</CardTitle>
          <CardDescription>Upload at least 4 high-quality, full-body photos to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border-2 border-dashed rounded-lg text-center hover:border-gray-400 transition-colors">
            <input 
              ref={fileInputRef}
              type="file" 
              id="file-upload" 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/png, image/jpeg" 
              multiple 
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild>
                <span><UploadCloud className="mr-2 h-4 w-4" /> Upload Photos</span>
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-2">PNG or JPG. You can select multiple files.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {modelImages.map((image) => (
          <div key={image.id} className="relative group aspect-square">
            <img 
              src={image.url} 
              alt="Uploaded model" 
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <p className="text-white text-center p-2 text-sm">{image.reason}</p>
            </div>
            {(image.status === 'approved' || image.status === 'failed') && (
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image)}
                  disabled={deletingImageId === image.id}
                >
                  {deletingImageId === image.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                </Button>
              </div>
            )}
            <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-bold ${
              image.status === 'approved' ? 'bg-green-600 text-white' :
              image.status === 'failed' ? 'bg-red-600 text-white' :
              'bg-yellow-500 text-white animate-pulse'
            }`}>
              {image.status}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button 
          size="lg"
          onClick={() => router.push('/chat')}
          disabled={!canContinue}
        >
          {canContinue ? 'Continue to Chat' : `Need ${Math.max(0, 4 - approvedModelImageUrls.length)} more approved photos`}
        </Button>
      </div>
    </div>
  );
} 