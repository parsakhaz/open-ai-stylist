'use client';

import { useChat } from '@ai-sdk/react';
import { useAppStore, Product } from '@/app/store/useAppStore';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Message, ToolInvocation } from 'ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, RefreshCw, Bot, User, Loader2, Send, Star, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';

// This is our new, enhanced ProductDisplay component
function ProductDisplay({ products, searchQuery }: { products: Product[]; searchQuery?: string }) {
  const { selectedProducts, toggleProductSelection } = useAppStore();

  if (!products || products.length === 0) {
    return (
      <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
        <p className="text-gray-500 italic text-center">
          I couldn't find anything for "{searchQuery}". Try another search?
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-sm">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Here's what I found for "{searchQuery}"
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => {
            const isSelected = selectedProducts.some(p => p.id === product.id);
            return (
              <div 
                key={product.id} 
                className={`relative cursor-pointer group rounded-xl transition-all bg-white shadow-sm hover:shadow-lg border-2 overflow-hidden ${
                  isSelected 
                    ? 'border-purple-500 shadow-lg ring-2 ring-purple-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleProductSelection(product)}
              >
                {/* Product Image */}
                <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>

                {/* Checkmark for selected items */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full h-7 w-7 flex items-center justify-center border-2 border-white shadow-lg text-sm z-10">
                    ✓
                  </div>
                )}
                
                {/* Product Info */}
                <div className="p-3 flex flex-col">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-2">{product.name}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-2">
                    {product.price && <p className="text-base font-bold text-gray-900">{product.price}</p>}
                    {product.originalPrice && <p className="text-xs text-gray-500 line-through">{product.originalPrice}</p>}
                  </div>

                  {/* Rating */}
                  {product.rating && product.ratingCount && (
                    <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-medium">{product.rating}</span>
                      <span className="text-gray-400">({product.ratingCount})</span>
                    </div>
                  )}

                  {/* Prime Badge */}
                  {product.isPrime && (
                    <div className="flex items-center justify-start">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        prime
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// NEW COMPONENT: ImageSelectionModal
function ImageSelectionModal({
  isOpen,
  onClose,
  onImageSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (url: string) => void;
}) {
  const { approvedModelImageUrls } = useAppStore();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 h-8 w-8 rounded-full">
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Select a Photo</h2>
        <p className="text-sm text-gray-500 mb-6">Choose one of your approved model photos to send to the stylist.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {approvedModelImageUrls.map((url) => (
            <div 
              key={url} 
              className="aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 border-transparent hover:border-purple-500 transition-all"
              onClick={() => onImageSelect(url)}
            >
              <img src={url} alt="Model" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const router = useRouter();
  const { 
    setChatTitle, 
    selectedProducts, 
    clearSelectedProducts, 
    approvedModelImageUrls,
    setIsLoading,
    createOrUpdateMoodboard,
    updateMoodboardWithTryOns,
    moodboards,
    chatSessions,
    addChatSession,
    chatMessages,
    setChatMessages,
    setMoodboardProcessing,
    setMoodboardCompleted,
  } = useAppStore();

  // NEW STATE for image selection
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToSend, setImageToSend] = useState<string | null>(null);
  
  const { 
    messages, 
    input, 
    handleInputChange, 
    append, // Use append for more control
    isLoading,
    reload,
    stop,
    error,
  } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: chatMessages[chatId] || [],
    onError: (error) => {
      console.error('[useChat] Hook encountered an error:', error);
      setIsLoading(false);
    },
  });

  // Save messages to store when they change
  useEffect(() => {
    if (messages.length > 0) {
      setChatMessages(chatId, messages);
    }
  }, [messages, chatId, setChatMessages]);

  // Check if current chat still exists
  useEffect(() => {
    if (chatSessions.length > 0 && messages.length > 0) {
      const currentChatExists = chatSessions.some(session => session.id === chatId);
      if (!currentChatExists) {
        router.push('/chat');
        return;
      }
    }
  }, [chatSessions, chatId, router, messages.length]);

  useEffect(() => {
    if (typeof window !== 'undefined' && approvedModelImageUrls.length === 0) {
      router.push('/onboarding');
    }
  }, [approvedModelImageUrls, router]);

  const generateChatTitle = (content: string): string => {
    const cleanContent = content.trim();
    if (cleanContent.endsWith('?')) {
      return cleanContent.length > 60 ? cleanContent.substring(0, 57) + '...' : cleanContent;
    }
    const commonStarters = ['show me', 'find me', 'i need', 'i want', 'help me', 'looking for', 'can you', 'what about', 'suggest', 'recommend'];
    const lowerContent = cleanContent.toLowerCase();
    const matchedStarter = commonStarters.find(starter => lowerContent.startsWith(starter));
    if (matchedStarter) {
      const topic = cleanContent.substring(matchedStarter.length).trim();
      if (topic.length > 0) {
        const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
        return capitalizedTopic.length > 50 ? capitalizedTopic.substring(0, 47) + '...' : capitalizedTopic;
      }
    }
    if (cleanContent.length > 50) {
      const truncated = cleanContent.substring(0, 50);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 20) {
        return truncated.substring(0, lastSpace) + '...';
      }
      return truncated + '...';
    }
    return cleanContent;
  };

  // UPDATED form submission handler
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !imageToSend) {
      return;
    }
    
    const chatExists = chatSessions.some(session => session.id === chatId);
    if (!chatExists) {
      addChatSession(chatId);
    }
    
    if (messages.length === 0) {
      const title = generateChatTitle(input || "Image with question");
      setChatTitle(chatId, title);
    }

    if (imageToSend) {
      // Create multimodal message with proper structure
      append({
        role: 'user',
        content: [
          { type: 'text', text: input || '' },
          { type: 'image_url', image_url: { url: imageToSend } }
        ] as any
      });
    } else {
      append({
        role: 'user', 
        content: input
      });
    }
    setImageToSend(null); // Clear staged image
  };

  // NEW handler for image selection from modal
  const handleImageSelect = (url: string) => {
    setImageToSend(url);
    setIsImageModalOpen(false);
  };

  const triggerCelebrationConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#059669', '#ffffff', '#f59e0b', '#ef4444'] });
    setTimeout(() => { confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#8b5cf6', '#a855f7', '#ffffff'] }); }, 200);
    setTimeout(() => { confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#06b6d4', '#0891b2', '#ffffff'] }); }, 400);
  };

  const pollForTryOns = (boardId: string) => {
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max
    
    const interval = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch(`/api/notify-try-on-complete?boardId=${boardId}`);
        if (!res.ok) {
          if (pollCount >= maxPolls) { clearInterval(interval); setMoodboardCompleted(boardId); toast.error('Try-on generation timed out.'); }
          return;
        }
        const data = await res.json();
        if (data.status === 'completed') {
          clearInterval(interval);
          updateMoodboardWithTryOns(boardId, data.tryOnUrlMap, data.categorization);
          setMoodboardCompleted(boardId);
          triggerCelebrationConfetti();
          toast.success('✨ Moodboard upgraded with virtual try-ons!');
        } else if (data.status === 'processing' && pollCount >= maxPolls) {
          clearInterval(interval);
          setMoodboardCompleted(boardId);
          toast.error('Try-on generation timed out. Your moodboard is ready with original images.');
        }
      } catch (error) {
        console.error('Polling failed:', error);
        if (pollCount >= maxPolls) { clearInterval(interval); setMoodboardCompleted(boardId); toast.error('Try-on generation failed.'); }
      }
    }, 1000);
  };
  
  const handleCreateBoard = async () => {
    if (selectedProducts.length === 0) return;
    
    const initialTryOnMap: Record<string, string> = {};
    selectedProducts.forEach(p => { initialTryOnMap[p.id] = p.imageUrl; });

    const boardId = createOrUpdateMoodboard("New Collection...", "Curated by StyleList", "CREATE_NEW", selectedProducts, initialTryOnMap);
    
    setMoodboardProcessing(boardId);
    clearSelectedProducts();
    toast.success('✅ Moodboard created! Generating try-ons...');

    try {
        const payload = { selectedProducts, existingMoodboards: moodboards.map(b => ({ title: b.title, description: b.description })), boardId };
        const response = await fetch('/api/generate-moodboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.status !== 202) { throw new Error('Failed to start moodboard generation.'); }
        pollForTryOns(boardId);
    } catch (error) {
      console.error("Failed to start mood board generation", error);
      setMoodboardCompleted(boardId);
      toast.error("Sorry, something went wrong starting the try-on process.");
    }
  };

  return (
    <TooltipProvider>
      <ImageSelectionModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
      />
      <div className="flex flex-col h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 animate-gradient bg-[length:400%_400%]"></div>
        
        <div className="flex-1 overflow-y-auto p-4 relative z-10">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-sm border-2 border-gray-200">
                  <div className="text-center mb-6"> <img src="/assets/hanger.svg" alt="Hanger" className="w-16 h-16 mx-auto" /> </div>
                  <div className="text-center mb-2"> <span className="text-sm font-medium text-black"> <span className="text-[#7D8FE2] font-bold">Step 2</span> out of 3 </span> </div>
                  <h1 className="text-4xl font-bold text-gray-900 text-center mb-4"> What would you like to wear? </h1>
                  <p className="text-lg text-gray-600 text-center mb-8"> Get personalized styling advice based on your skin tone, body type, and lifestyle. Upload a photo or describe your style goals! </p>
                  <div className="mb-8">
                                          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Get Professional Styling Advice</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {[
                        'Help me find colors that suit my skin tone',
                        'I need outfit ideas for my body type', 
                        'What styles would look good on me?',
                        'I want to elevate my work wardrobe',
                        'Help me build a capsule wardrobe',
                        'I need outfit ideas for date nights'
                      ].map((prompt, index) => (
                        <button key={index} onClick={() => { handleInputChange({ target: { value: prompt } } as React.ChangeEvent<HTMLTextAreaElement>); setTimeout(() => { const inputElement = document.querySelector('textarea'); if (inputElement) { inputElement.focus(); inputElement.setSelectionRange(prompt.length, prompt.length); } }, 10); }} className="px-4 py-2 rounded-full border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-all duration-200 flex items-center gap-2 bg-white"> <span className="text-[#7D8FE2]">✦</span> {prompt} </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((m: Message) => (
                <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600 flex-shrink-0 mt-1"> <path d="M7.90838 12.0508C7.90838 12.0508 2.18033 17.7157 1.56112 18.6102C0.941919 19.5046 0.694183 20.25 1.56112 20.25C2.42807 20.25 18.7449 18.6102 20.7577 17.8648C22.7704 17.1194 23.3893 16.6722 22.7702 15.6286C22.1512 14.5851 15.1329 12.498 11.3142 11.3054C11.0046 11.2061 10.3853 10.888 10.3853 10.411C10.3853 9.81468 10.6949 9.66561 10.8498 9.36745C11.0046 9.0693 12.8623 7.72764 12.8623 6.38594C12.8623 5.04424 12.2431 4.14982 10.6949 3.85165C9.64728 3.64987 8.74055 3.72409 8.12131 4.29661C7.50207 4.86914 7.4974 5.72826 7.34725 6.25837" stroke="currentColor" strokeWidth="1.83333"/> </svg> )}
                  <div className={`max-w-2xl ${m.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                    <div className={`rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${ m.role === 'user' ? 'px-4 py-3 bg-black text-white border-gray-800' : 'p-4 bg-white/95 backdrop-blur-sm text-gray-800 border-gray-200' }`}>
                      {/* --- MODIFIED: Message Content Rendering with Markdown Support --- */}
                      {m.role === 'user' && Array.isArray(m.content) ? (
                        <div className="space-y-3">
                          {m.content.map((part, index) => {
                            if (part.type === 'image_url' && typeof part.image_url === 'object' && part.image_url.url) {
                              return <img key={index} src={part.image_url.url} alt="User upload" className="rounded-lg max-w-[200px] border border-gray-600" />;
                            }
                            if (part.type === 'text' && part.text) {
                              return <p key={index} className="leading-relaxed">{part.text}</p>;
                            }
                            return null;
                          })}
                        </div>
                      ) : m.content && (
                        m.role === 'assistant' ? (
                          <div className="leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-gray-400">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="leading-relaxed">{m.content}</p>
                        )
                      )}

                      {m.toolInvocations?.map(toolInvocation => {
                        if (toolInvocation.toolName === 'searchProducts') {
                          if (toolInvocation.state === 'call') {
                            const searchQuery = (toolInvocation as any).args?.query;
                            return ( <div key={toolInvocation.toolCallId} className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm"> <div className="flex items-center gap-3 mb-4"> <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center"> <Loader2 className="h-4 w-4 text-blue-600 animate-spin" /> </div> <h3 className="text-lg font-semibold text-gray-900"> Searching for "{searchQuery}"... </h3> </div> <div className="flex items-center justify-center py-8"> <div className="flex items-center gap-3 text-gray-600"> <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div> <span className="text-sm font-medium">Finding the perfect pieces for you...</span> </div> </div> </div> );
                          }
                          if (toolInvocation.state === 'result') {
                            return ( <ProductDisplay key={toolInvocation.toolCallId} products={(toolInvocation as any).result as Product[]} searchQuery={(toolInvocation as any).args?.query} /> );
                          }
                        }
                        return null;
                      })}
                      {m.role === 'assistant' && !isLoading && m.content && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" 
                                onClick={() => navigator.clipboard.writeText(m.content)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy message</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" 
                                onClick={() => reload()}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate response</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                  {m.role === 'user' && ( <div className="w-10 h-10 bg-gradient-to-br from-black to-black rounded-full flex items-center justify-center flex-shrink-0 border border-purple-300"> <User className="h-5 w-5 text-white" /> </div> )}
                </div>
              ))}
              {isLoading && messages[messages.length-1]?.role === 'user' && (
                <div className="flex gap-4 justify-start"> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600 flex-shrink-0 mt-1"> <path d="M7.90838 12.0508C7.90838 12.0508 2.18033 17.7157 1.56112 18.6102C0.941919 19.5046 0.694183 20.25 1.56112 20.25C2.42807 20.25 18.7449 18.6102 20.7577 17.8648C22.7704 17.1194 23.3893 16.6722 22.7702 15.6286C22.1512 14.5851 15.1329 12.498 11.3142 11.3054C11.0046 11.2061 10.3853 10.888 10.3853 10.411C10.3853 9.81468 10.6949 9.66561 10.8498 9.36745C11.0046 9.0693 12.8623 7.72764 12.8623 6.38594C12.8623 5.04424 12.2431 4.14982 10.6949 3.85165C9.64728 3.64987 8.74055 3.72409 8.12131 4.29661C7.50207 4.86914 7.4974 5.72826 7.34725 6.25837" stroke="currentColor" strokeWidth="1.83333"/> </svg> <div className="max-w-2xl mr-12"> <div className="p-4 rounded-2xl shadow-sm border bg-white/95 backdrop-blur-sm text-gray-800 border-gray-200"> <div className="flex items-center gap-2"> <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div> <span className="text-sm text-gray-600">Thinking...</span> </div> </div> </div> </div>
              )}
            </div>
          )}
        </div>
        
        {selectedProducts.length > 0 && ( <div className="p-4 relative z-20"> <div className="max-w-4xl mx-auto"> <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200"> <Button onClick={handleCreateBoard} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"> Create Moodboard with {selectedProducts.length} pieces ✨ </Button> </div> </div> </div> )}
        
        <div className="p-4 relative z-20">
          <div className="max-w-4xl mx-auto">
            {error && ( <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"> <strong>Error:</strong> {error.message} </div> )}
            <form onSubmit={handleFormSubmit} className="relative">
              {/* NEW: Image Preview */}
              {imageToSend && (
                <div className="p-2 bg-white/80 backdrop-blur-sm rounded-t-xl border-x border-t border-gray-200">
                  <div className="relative inline-block">
                    <img src={imageToSend} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setImageToSend(null)}
                      className="absolute -top-2 -right-2 bg-gray-700 hover:bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-md"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className={`relative bg-white/95 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${ imageToSend ? 'rounded-b-2xl' : 'rounded-2xl' }`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsImageModalOpen(true)}
                        className="absolute top-1/2 -translate-y-1/2 left-3 h-9 w-9 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full z-10"
                    >
                        <ImagePlus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Add a photo</p></TooltipContent>
                </Tooltip>
                
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={imageToSend ? "Ask me about this photo..." : "Describe your style, or add a photo..."}
                  className="w-full p-4 pl-16 pr-16 border-0 bg-transparent resize-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-500"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).form?.requestSubmit();
                    }
                  }}
                />
                {isLoading 
                  ? <Button type="button" size="icon" onClick={() => stop()} className="absolute top-1/2 -translate-y-1/2 right-4 h-8 w-8 bg-red-100 hover:bg-red-200 text-red-600 border-0 rounded-full"> <Loader2 className="h-4 w-4 animate-spin"/> </Button>
                  : <Button type="submit" size="icon" disabled={!input.trim() && !imageToSend} className="absolute top-1/2 -translate-y-1/2 right-4 h-8 w-8 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white border-0 rounded-full transition-all duration-200"> <Send className="h-4 w-4"/> </Button>
                }
              </div>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 