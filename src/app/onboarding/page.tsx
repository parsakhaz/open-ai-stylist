'use client';

import { useAppStore, ModelImage } from '../store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { UploadCloud, X, Loader2, CheckCircle, XCircle, Clock, User, Info, Plus, MessageSquare, Bookmark, ArrowRight, Palette } from 'lucide-react';
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
    moodboards,
    processingMoodboards,
    completedMoodboards,
    clearCompletedStatus
  } = useAppStore();
  
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChillMode, setIsChillMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadModelImages();
  }, [loadModelImages]);

  // Convert webp to jpeg if needed
  const convertWebpToJpeg = async (file: File): Promise<File> => {
    if (file.type !== 'image/webp') {
      return file; // Return original file if not webp
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedFile = new File([blob], file.name.replace(/\.webp$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(convertedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const convertedFile = await convertWebpToJpeg(file);
      const placeholderId = addPlaceholderImage(URL.createObjectURL(convertedFile));
      const formData = new FormData();
      formData.append('image', convertedFile);
      formData.append('chillMode', isChillMode.toString());

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
          url: URL.createObjectURL(convertedFile),
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
        {/* SVG Gradient Background - Only for main content area */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{
            left: isCollapsed ? '48px' : '224px', // Adjust based on sidebar width
          }}
        >
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 1580 1515" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            <g filter="url(#filter0_f_68_8252)">
              <circle cx="604.5" cy="604.5" r="204.5" fill="#9ED5F4"/>
            </g>
            <g filter="url(#filter1_f_68_8252)">
              <circle cx="975.5" cy="655.5" r="204.5" fill="#F9CBE3"/>
            </g>
            <g filter="url(#filter2_f_68_8252)">
              <circle cx="739.5" cy="910.5" r="204.5" fill="#9996CF"/>
            </g>
            <defs>
              <filter id="filter0_f_68_8252" x="0" y="0" width="1209" height="1209" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur_68_8252"/>
              </filter>
              <filter id="filter1_f_68_8252" x="371" y="51" width="1209" height="1209" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur_68_8252"/>
              </filter>
              <filter id="filter2_f_68_8252" x="135" y="306" width="1209" height="1209" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur_68_8252"/>
              </filter>
            </defs>
          </svg>
        </div>
        
        {/* Left Sidebar */}
        <div className={`${isCollapsed ? 'w-12' : 'w-56'} bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col relative z-10 transition-all duration-300`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!isCollapsed && <img src="/assets/Logobigger.webp" alt="Stylist" className="h-5 sm:h-4.5 w-auto" />}
              <img 
                src="/assets/Collapse.svg" 
                alt="Collapse" 
                className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity" 
                onClick={() => setIsCollapsed(!isCollapsed)}
              />
            </div>
          </div>

          {/* Add Moodboard Button */}
          {!isCollapsed && (
            <div className="p-4">
              <Link href="/chat">
                <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-start">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                    <defs>
                      <linearGradient id="plusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7D8FE2" />
                      <stop offset="100%" stopColor="#7D8FE2" />
                      </linearGradient>
                    </defs>
                    <path d="M12 5V19M5 12H19" stroke="url(#plusGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Add Moodboard
                </Button>
              </Link>
            </div>
          )}

          {/* Saved Moodboards Section */}
          {!isCollapsed && (
            <div className="px-4 pb-2">
              <Link 
                href="/gallery" 
                className="flex items-center gap-2 text-sm hover:text-gray-800 transition-colors relative"
                onClick={() => {
                  // Clear completion status when navigating to gallery
                  if (completedMoodboards.size > 0) {
                    Array.from(completedMoodboards).forEach(boardId => {
                      clearCompletedStatus(boardId);
                    });
                  }
                }}
              >
                <Palette className={`w-4 h-4 ${
                    processingMoodboards.size > 0 
                      ? 'text-blue-500 animate-pulse' 
                      : 'text-gray-600'
                  }`} />

                <span className={`${
                  processingMoodboards.size > 0 
                    ? 'text-blue-600 animate-pulse font-medium' 
                    : 'text-gray-600'
                }`}>
                  Moodboards ({moodboards.length})
                </span>
                
                {/* Completion Badge */}
                {completedMoodboards.size > 0 && (
                  <div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Clear all completed statuses when clicked
                      Array.from(completedMoodboards).forEach(boardId => {
                        clearCompletedStatus(boardId);
                      });
                    }}
                    title={`${completedMoodboards.size} moodboard${completedMoodboards.size > 1 ? 's' : ''} completed processing - click to dismiss`}
                  />
                )}
              </Link>
            </div>
          )}

          {/* Chat History */}
          {!isCollapsed && (
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
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-4xl">
            {/* Main Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-sm border-2 border-gray-200">
              {/* Step Indicator */}
              <div className="text-left mb-2">
                <span className="text-sm font-medium text-black">
                <span className="text-[#7D8FE2] font-bold">Step 1</span> out of 3
                </span>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 text-left mb-8">
                Upload your Photos!
              </h1>

              {/* Rules Section */}
              <div className={`${isChillMode ? 'grid-cols-2' : 'grid-cols-3'} grid gap-6 mb-8`}>
                {/* Full-Body Images Rule */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <img src="/assets/FullBody.png" alt="Full Body" className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Full-Body Images</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Must be a picture of a person fully visible from head to toe.
                  </p>
                </div>

                {/* Single Person Rule */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <img src="/assets/SinglePerson.png" alt="Single Person" className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Single Person</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Must contain exactly one person, no other people in the image.
                  </p>
                </div>

                {/* Strict Mode Only Rules */}
                {!isChillMode && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <img src="/assets/Clothing.png" alt="Simple Clothing" className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Simple Clothing</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Must be wearing simple, form-fitting clothing.
                    </p>
                  </div>
                )}
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
                            {image.status === 'approved' && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.63672 14.2427L9.87936 18.4853L18.3637 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
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
              <div className="text-left mb-6">
                <span className="text-sm font-bold text-gray-600">
                  {approvedModelImageUrls.length}/4 photos 
                </span> <span className="text-sm text-gray-600">
                  uploaded
                </span> 
              </div>


              {/* Chill Mode Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Chill Mode</h3>
                      <p className="text-sm text-gray-600">
                        {isChillMode 
                          ? "Less strict validation - just needs a single person full body shot" 
                          : "Strict validation - requires simple clothing and specific pose"
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChillMode(!isChillMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isChillMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isChillMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Upload/Continue Button */}
              <div className="text-center">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/webp" 
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