'use client';

import { useAppStore, ModelImage } from '../store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal progress indicator */}
      <div className="flex justify-center pt-8 pb-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step <= approvedModelImageUrls.length ? 'bg-black' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        
        {/* Simple header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-black mb-3">
            Add 4 Photos
          </h1>
          <p className="text-gray-500 text-sm">
            We'll validate them automatically
          </p>
        </div>

        {/* Hero upload area - much larger and more prominent */}
        {modelImages.length === 0 ? (
          <div className="w-full max-w-lg">
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
              <div className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-gray-400 transition-all duration-300 bg-gray-50 hover:bg-gray-100 group">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-medium text-black mb-2">Drop photos here</div>
                <div className="text-sm text-gray-500 mb-6">or click to browse</div>
                <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg">
                  Choose Photos
                </Button>
              </div>
            </label>
          </div>
        ) : (
          /* Photo grid with add more option */
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Existing photos */}
              {modelImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-white border-2 border-gray-200">
                    <img 
                      src={image.url} 
                      alt="Uploaded" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status indicator */}
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                      image.status === 'approved' ? 'bg-black' :
                      image.status === 'failed' ? 'bg-gray-400' :
                      'bg-gray-300'
                    }`}>
                      {image.status === 'approved' && <CheckCircle className="w-4 h-4 text-white" />}
                      {image.status === 'failed' && <XCircle className="w-4 h-4 text-white" />}
                      {image.status === 'validating' && <Clock className="w-4 h-4 text-white animate-pulse" />}
                    </div>

                    {/* Delete button */}
                    {(image.status === 'approved' || image.status === 'failed') && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={() => handleDeleteImage(image)}
                        disabled={deletingImageId === image.id}
                      >
                        {deletingImageId === image.id ? 
                          <Loader2 className="h-3 w-3 animate-spin"/> : 
                          <X className="h-3 w-3" />
                        }
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add more photos - only show if less than 4 approved */}
              {approvedModelImageUrls.length < 4 && (
                <div className="aspect-square">
                  <input 
                    type="file" 
                    id="file-upload-more" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg" 
                    multiple 
                  />
                  <label htmlFor="file-upload-more" className="cursor-pointer">
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-gray-400 transition-all duration-300 bg-gray-50 hover:bg-gray-100">
                      <UploadCloud className="w-8 h-8 text-gray-400" />
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action area */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {approvedModelImageUrls.length}/4 photos ready
          </div>
          <Button 
            onClick={() => router.push('/chat')}
            disabled={!canContinue}
            className={`px-6 py-2 rounded-lg transition-all duration-300 ${
              canContinue 
                ? 'bg-black hover:bg-gray-800 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canContinue ? (
              <>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'Add more photos'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 