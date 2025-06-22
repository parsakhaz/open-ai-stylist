'use client';

import { useAppStore, ModelImage } from '../store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { UploadCloud, X, Loader2, CheckCircle, XCircle, Clock, User, Info, Plus, MessageSquare, Bookmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    modelImages, 
    loadModelImages, 
    addPlaceholderImage, 
    updatePlaceholderImage, 
    approvedModelImageUrls,
    deleteModelImage,
    chatSessions,
    deleteChatSession,
    moodboards
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

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChatSession(chatId);
    }
  };

  const handleButtonClick = () => {
    if (canContinue) {
      router.push('/chat');
    } else {
      handleUpload();
    }
  };

  // Helper function to get tooltip content based on image status
  const getTooltipContent = (image: ModelImage) => {
    switch (image.status) {
      case 'approved':
        return 'Image approved - ready to use';
      case 'failed':
        return `Rejected: ${image.reason || 'Unknown reason'}`;
      case 'validating':
        return 'Processing image...';
      default:
        return 'Unknown status';
    }
  };

  const canContinue = approvedModelImageUrls.length >= 4;

  return (
    <TooltipProvider>
      <div className="min-h-screen relative flex overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-25 to-purple-50 animate-gradient bg-[length:400%_400%]"></div>
        
        {/* Left Sidebar */}
        <div className="w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col relative z-10">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <img src="/assets/Logo.png" alt="Stylist" />
              {/* <span className="font-semibold text-gray-900">Stylist</span> */}
            </div>
          </div>

          {/* Add Moodboard Button */}
          <div className="p-4">
            <Link href="/chat">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg py-2 text-sm font-medium">
                <img src="/assets/Add.svg" alt="Add" className="w-4 h-4 mr-2 filter brightness-0 invert" />
                Add Moodboard
              </Button>
            </Link>
          </div>

          {/* Saved Section */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <img src="/assets/Saved.svg" alt="Saved" className="w-4 h-4" />
              <span>Saved ({moodboards.length})</span>
            </div>
          </div>

          {/* Chat History */}
          <div className="px-4 py-2 flex-1 overflow-y-auto">
            <h3 className="text-xs font-medium text-gray-500 mb-3">Recent Chats</h3>
            <div className="space-y-1">
              {chatSessions.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-4">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>No chats yet</p>
                </div>
              ) : (
                chatSessions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6) // Show only recent 6 chats
                  .map(session => (
                    <div key={session.id} className="relative group">
                      <Link href={`/chat/${session.id}`}>
                        <div className="text-sm text-gray-700 py-2 px-2 rounded hover:bg-gray-100 transition-colors cursor-pointer truncate">
                          {session.title}
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                        onClick={(e) => handleDeleteChat(e, session.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
            {chatSessions.length > 6 && (
              <Link href="/chat" className="block text-xs text-blue-600 hover:text-blue-800 mt-2 px-2">
                View all chats →
              </Link>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-4xl">
            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-sm border-2 border-gray-200">
              {/* Step Indicator */}
              <div className="text-center mb-2">
                <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Step 1 out of 3</span>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
                Upload your Photos!
              </h1>

              {/* Rules Section */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Full-Body Images Rule */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Full-Body Images</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>

                {/* Rule 2 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Info className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rule</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>

                {/* Rule 3 */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Info className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rule</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </div>

              {/* Photo Upload Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Show uploaded images */}
                {modelImages.slice(0, 4).map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-200">
                      <img 
                        src={image.url} 
                        alt="Uploaded" 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Status indicator with tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center cursor-help ${
                            image.status === 'approved' ? 'bg-green-500' :
                            image.status === 'failed' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}>
                            {image.status === 'approved' && <CheckCircle className="w-3 h-3 text-white" />}
                            {image.status === 'failed' && <XCircle className="w-3 h-3 text-white" />}
                            {image.status === 'validating' && <Clock className="w-3 h-3 text-white animate-pulse" />}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getTooltipContent(image)}</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete button */}
                      {(image.status === 'approved' || image.status === 'failed') && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 left-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black hover:bg-red-600 text-white border-0 shadow-lg p-0"
                          onClick={() => handleDeleteImage(image)}
                          disabled={deletingImageId === image.id}
                        >
                          {deletingImageId === image.id ? 
                            <Loader2 className="h-2 w-2 animate-spin"/> : 
                            <X className="h-2 w-2" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Empty upload slots */}
                {Array.from({ length: Math.max(0, 4 - modelImages.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square">
                    <div className="w-full h-full border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center bg-blue-50/30 hover:bg-blue-50/50 transition-colors cursor-pointer"
                         onClick={handleUpload}>
                      <img src="/assets/Upload.svg" alt="Upload" className="w-8 h-8 mb-2" />
                      <span className="text-xs text-blue-600 font-medium">Upload Photo</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo Counter */}
              <div className="text-center mb-6">
                <span className="text-sm font-bold text-gray-600">
                  {approvedModelImageUrls.length}/4 photos uploaded
                </span>
              </div>

              {/* Upload/Continue Button */}
              <div className="text-center">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg" 
                  multiple 
                />
                <Button 
                  onClick={handleButtonClick}
                  className={`w-full font-medium py-3 rounded-xl transition-all duration-300 ${
                    canContinue 
                      ? 'bg-black hover:bg-gray-800 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {canContinue ? (
                    <>
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 