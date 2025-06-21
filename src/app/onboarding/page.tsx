'use client';

import { useAppStore, ModelImage } from '../store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  
  // Add a state to track which image is currently being deleted
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Load existing images when the component mounts
  useEffect(() => {
    console.log('[Onboarding] Component mounted, loading existing model images...');
    loadModelImages();
  }, [loadModelImages]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log(`[Onboarding] ${files.length} file(s) selected for upload`);

    for (const file of Array.from(files)) {
      console.log('[Onboarding] Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Create a temporary local URL for instant preview
      const placeholderUrl = URL.createObjectURL(file);
      const placeholderId = addPlaceholderImage(placeholderUrl);
      console.log('[Onboarding] Created placeholder with ID:', placeholderId);
      
      const formData = new FormData();
      formData.append('image', file);

      try {
        console.log(`[Onboarding] Uploading file: ${file.name}`);
        const response = await fetch('/api/validate-image', {
          method: 'POST',
          body: formData, // Send FormData, not JSON
          // DO NOT set 'Content-Type' header, browser does it automatically for FormData
        });
        
        console.log(`[Onboarding] API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error('[Onboarding] Validation request failed. Response body:', errorBody);
          
          let errorMessage = 'Upload failed';
          try {
            const errorResult = JSON.parse(errorBody);
            errorMessage = errorResult.reason || errorMessage;
          } catch {
            // If we can't parse the error, use the default message
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[Onboarding] API response:', result);

        // Update the placeholder with the real data from the server
        updatePlaceholderImage(placeholderId, result.finalImageState);
        console.log('[Onboarding] Updated placeholder with final state');

        // Clean up the temporary URL to prevent memory leaks
        URL.revokeObjectURL(placeholderUrl);

      } catch (error) {
        console.error('[Onboarding] Upload Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        
        // Update the placeholder to show the error
        updatePlaceholderImage(placeholderId, {
          url: placeholderUrl,
          status: 'failed',
          reason: errorMessage,
        });
      }
    }
    
    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
  };

  // New handler function for the delete action
  const handleDeleteImage = async (image: ModelImage) => {
    // Prevent multiple delete clicks
    if (deletingImageId) return;

    // Optimistically show a "Deleting..." state
    setDeletingImageId(image.id);

    try {
      console.log('[Onboarding] Deleting image:', image.url);
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image.url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete image.');
      }

      console.log('[Onboarding] Image deleted successfully from server');
      // If the API call is successful, update the client-side state
      deleteModelImage(image.url);

    } catch (error) {
      console.error('[Onboarding] Failed to delete image:', error);
      alert('Could not delete the image. Please try again.');
    } finally {
      // Always reset the deleting state
      setDeletingImageId(null);
    }
  };
  
  const canContinue = approvedModelImageUrls.length >= 4;

  const getImageBlur = (status: ModelImage['status']) => {
    switch (status) {
      case 'validating':
        return 'blur-sm';
      case 'approved':
        return 'blur-none';
      case 'failed':
        return 'blur-sm';
      default:
        return 'blur-none';
    }
  };

  const getOverlayStyle = (status: ModelImage['status']) => {
    switch (status) {
      case 'validating':
        return 'bg-black bg-opacity-60 border-2 border-blue-400';
      case 'approved':
        return 'bg-black bg-opacity-40 border-2 border-green-400';
      case 'failed':
        return 'bg-black bg-opacity-60 border-2 border-red-400';
      default:
        return 'bg-black bg-opacity-50 border-2 border-gray-400';
    }
  };

  const renderStatusOverlay = (image: ModelImage) => {
    // Show a specific overlay when an image is being deleted
    if (deletingImageId === image.id) {
      return (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-70 border-2 border-red-400">
          <div className="bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-lg">
            <p className="text-red-600 font-semibold animate-pulse text-sm">Deleting...</p>
          </div>
        </div>
      );
    }

    const baseClasses = "absolute inset-0 flex items-center justify-center rounded-lg transition-all duration-300";
    const overlayClasses = `${baseClasses} ${getOverlayStyle(image.status)}`;
    
    switch (image.status) {
      case 'validating':
        return (
          <div className={overlayClasses}>
            <div className="bg-white bg-opacity-90 rounded-lg px-3 py-2">
              <p className="text-blue-600 font-semibold animate-pulse text-sm">Processing...</p>
            </div>
          </div>
        );
      case 'approved':
        return (
          <div className={overlayClasses}>
            <div className="bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-lg">
              <p className="text-green-600 font-bold text-center flex items-center gap-1">
                <span className="text-lg">✓</span> 
                <span className="text-sm">Approved</span>
              </p>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className={overlayClasses}>
            <div className="bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-lg max-w-[90%]">
              <p className="text-red-600 font-bold text-center text-xs leading-tight">
                <span className="block text-sm mb-1">✗</span>
                <span className="block">{image.reason}</span>
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  console.log('[Onboarding] Current state - Total images:', modelImages.length, 'Approved images:', approvedModelImageUrls.length, 'Can continue:', canContinue);

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-2">Create Your Model</h1>
      <p className="text-gray-600 mb-6">Upload at least 4 high-quality, full-body photos of yourself wearing simple, form-fitting clothes.</p>
      
      <div className="p-6 border-2 border-dashed rounded-lg text-center mb-8">
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          onChange={handleFileChange} 
          accept="image/png, image/jpeg" 
          multiple 
        />
        <label htmlFor="file-upload" className="cursor-pointer bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">
          Upload Photo(s)
        </label>
        <p className="text-xs text-gray-500 mt-2">PNG or JPG. You can select multiple files.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {modelImages.map((image) => (
          <div key={image.id} className="relative w-full h-48 md:h-56 group">
            <img 
              src={image.url} 
              alt="User upload" 
              className={`
                object-cover rounded-lg w-full h-full 
                transition-all duration-300
                ${getImageBlur(image.status)}
              `}
            />
            {renderStatusOverlay(image)}
            
            {/* Delete Button */}
            {/* Show the button only when not processing/deleting and status is final */}
            {(image.status === 'approved' || image.status === 'failed') && deletingImageId !== image.id && (
              <button
                onClick={() => handleDeleteImage(image)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full h-8 w-8 flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg z-10"
                aria-label="Delete image"
                title="Delete image"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <button 
          onClick={() => {
            console.log('[Onboarding] Navigating to /chat');
            router.push('/chat');
          }}
          disabled={!canContinue}
          className="w-full md:w-auto px-12 py-3 rounded-md font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {canContinue ? 'Continue to Chat' : `Need ${Math.max(0, 4 - approvedModelImageUrls.length)} more approved photos`}
        </button>
      </div>
    </div>
  );
} 