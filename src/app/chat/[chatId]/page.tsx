'use client';

import { useChat } from '@ai-sdk/react';
import { useAppStore, Product } from '@/app/store/useAppStore';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Message, ToolInvocation } from 'ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, RefreshCw, Bot, User, Loader2, Send, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

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
  
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
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
    // We only save if there are messages, to avoid overwriting a persisted
    // chat with an empty array right after a redirect/reload.
    if (messages.length > 0) {
      setChatMessages(chatId, messages);
    }
  }, [messages, chatId, setChatMessages]);

  // Check if current chat still exists (only redirect if chat was explicitly deleted)
  useEffect(() => {
    // Only check for deletion redirect if we have chat sessions and this chat has messages
    // This prevents redirecting new chats that haven't been added to sidebar yet
    if (chatSessions.length > 0 && messages.length > 0) {
      const currentChatExists = chatSessions.some(session => session.id === chatId);
      if (!currentChatExists) {
        // Chat was deleted, redirect to new chat
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

  // Helper function to generate meaningful chat titles
  const generateChatTitle = (content: string): string => {
    // Clean the content and take first meaningful part
    const cleanContent = content.trim();
    
    // If it's a question, use it as is (truncated)
    if (cleanContent.endsWith('?')) {
      return cleanContent.length > 60 ? cleanContent.substring(0, 57) + '...' : cleanContent;
    }
    
    // If it starts with common chat starters, extract the main topic
    const commonStarters = [
      'show me', 'find me', 'i need', 'i want', 'help me', 'looking for',
      'can you', 'what about', 'suggest', 'recommend'
    ];
    
    const lowerContent = cleanContent.toLowerCase();
    const matchedStarter = commonStarters.find(starter => lowerContent.startsWith(starter));
    
    if (matchedStarter) {
      // Extract the main topic after the starter
      const topic = cleanContent.substring(matchedStarter.length).trim();
      if (topic.length > 0) {
        const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
        return capitalizedTopic.length > 50 ? capitalizedTopic.substring(0, 47) + '...' : capitalizedTopic;
      }
    }
    
    // Default: use first 50 characters with proper truncation
    if (cleanContent.length > 50) {
      // Try to break at word boundary
      const truncated = cleanContent.substring(0, 50);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 20) {
        return truncated.substring(0, lastSpace) + '...';
      }
      return truncated + '...';
    }
    
    return cleanContent;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      // Check if this chat exists in sessions, if not add it (first message)
      const chatExists = chatSessions.some(session => session.id === chatId);
      if (!chatExists) {
        addChatSession(chatId);
      }
      
      // Set chat title immediately when user sends their first message
      if (messages.length === 0) {
        const title = generateChatTitle(input);
        setChatTitle(chatId, title);
      }
      handleSubmit(e);
    }
  };

  const triggerCelebrationConfetti = () => {
    // Celebration confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#ffffff', '#f59e0b', '#ef4444']
    });
    
    // Follow up with a smaller burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#8b5cf6', '#a855f7', '#ffffff']
      });
    }, 200);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#06b6d4', '#0891b2', '#ffffff']
      });
    }, 400);
  };

  const pollForTryOns = (boardId: string) => {
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max (120 * 1 second)
    
    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        const res = await fetch(`/api/notify-try-on-complete?boardId=${boardId}`);
        if (!res.ok) {
          // Just continue polling - don't show completion badge for API errors
          if (pollCount >= maxPolls) {
            clearInterval(interval);
            setMoodboardCompleted(boardId); // Only show badge on true timeout
            toast.error('Try-on generation timed out. Your moodboard is ready with original images.');
          }
          return;
        }

        const data = await res.json();
        if (data.status === 'completed') {
          // Actually completed successfully
          clearInterval(interval);
          updateMoodboardWithTryOns(boardId, data.tryOnUrlMap, data.categorization);
          setMoodboardCompleted(boardId);
          triggerCelebrationConfetti();
          toast.success('✨ Moodboard upgraded with virtual try-ons!');
        } else if (data.status === 'processing' && pollCount >= maxPolls) {
          // Still processing but we've hit the timeout
          clearInterval(interval);
          setMoodboardCompleted(boardId);
          toast.error('Try-on generation timed out. Your moodboard is ready with original images.');
        }
        // If status is 'processing' and we haven't timed out, just continue polling
      } catch (error) {
        console.error('Polling failed:', error);
        // Only show completion badge if we've truly reached the timeout
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setMoodboardCompleted(boardId);
          toast.error('Try-on generation failed. Your moodboard is ready with original images.');
        }
        // Otherwise just continue polling - network errors happen
      }
    }, 1000);
  };
  
  const handleCreateBoard = async () => {
    if (selectedProducts.length === 0) return;
    
    const initialTryOnMap: Record<string, string> = {};
    selectedProducts.forEach(p => { initialTryOnMap[p.id] = p.imageUrl; });

    const boardId = createOrUpdateMoodboard(
        "New Collection...",
        "Curated by StyleList",
        "CREATE_NEW",
        selectedProducts,
        initialTryOnMap
    );
    
    // Set processing state to show visual indicators
    setMoodboardProcessing(boardId);
    
    clearSelectedProducts();
    toast.success('✅ Moodboard created! Generating try-ons...');

    try {
        const payload = { 
            selectedProducts,
            existingMoodboards: moodboards.map(b => ({ title: b.title, description: b.description })),
            boardId
        };

        const response = await fetch('/api/generate-moodboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.status !== 202) {
            throw new Error('Failed to start moodboard generation.');
        }

        pollForTryOns(boardId);

    } catch (error) {
      console.error("Failed to start mood board generation", error);
      setMoodboardCompleted(boardId); // Show completion badge on failure
      toast.error("Sorry, something went wrong starting the try-on process.");
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen relative">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 animate-gradient bg-[length:400%_400%]"></div>
        
        <div className="flex-1 overflow-y-auto p-4 relative z-10">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-sm border-2 border-gray-200">
                  
                  {/* Hanger Icon */}
                  <div className="text-center mb-6">
                    <img src="/assets/hanger.svg" alt="Hanger" className="w-16 h-16 mx-auto" />
                  </div>

                  {/* Step Indicator */}
                  <div className="text-center mb-2">
                    <span className="text-sm font-medium text-black">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Step 2</span> out of 3
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
                    What would you like to wear?
                  </h1>

                  {/* Subtitle */}
                  <p className="text-lg text-gray-600 text-center mb-8">
                    <span className="font-semibold text-gray-900"></span> Describe your dream outfit and let Stylist do the work
                  </p>

                                      {/* Recommended Styles */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Recommended Styles</h3>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {['Casual Chic', 'Business Professional', 'Bohemian', 'Minimalist', 'Streetwear', 'Vintage Inspired'].map((style, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              const styleText = `I want to look ${style.toLowerCase()}`;
                              handleInputChange({ target: { value: styleText } } as React.ChangeEvent<HTMLTextAreaElement>);
                              // Focus the input after a short delay to ensure state update
                              setTimeout(() => {
                                const inputElement = document.querySelector('textarea');
                                if (inputElement) {
                                  inputElement.focus();
                                  inputElement.setSelectionRange(styleText.length, styleText.length);
                                }
                              }, 10);
                            }}
                            className="px-4 py-2 rounded-full border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-all duration-200 flex items-center gap-2 bg-white"
                          >
                            <span className="text-purple-600">✦</span>
                            {style}
                          </button>
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
                  {m.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-200">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                  )}
                  
                  <div className={`max-w-2xl ${m.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                                         <div className={`rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                       m.role === 'user' 
                         ? 'px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-200' 
                         : 'p-4 bg-white/95 backdrop-blur-sm text-gray-800 border-gray-200'
                     }`}>
                      {m.content && <p className="leading-relaxed">{m.content}</p>}
                      
                      {m.toolInvocations?.map(toolInvocation => {
                        if (toolInvocation.toolName === 'searchProducts') {
                          // Show loading spinner while the tool call is executing
                          if (toolInvocation.state === 'call') {
                            const searchQuery = (toolInvocation as any).args?.query;
                            return (
                              <div key={toolInvocation.toolCallId} className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Searching for "{searchQuery}"...
                                  </h3>
                                </div>
                                <div className="flex items-center justify-center py-8">
                                  <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Finding the perfect pieces for you...</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          // Show results when the tool call is complete
                          if (toolInvocation.state === 'result') {
                            return (
                              <ProductDisplay
                                key={toolInvocation.toolCallId}
                                products={(toolInvocation as any).result as Product[]}
                                searchQuery={(toolInvocation as any).args?.query}
                              />
                            );
                          }
                        }
                        return null;
                      })}

                      {/* Action buttons for assistant messages */}
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
                  
                  {m.role === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-300">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && messages[messages.length-1]?.role === 'user' && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-200">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="max-w-2xl mr-12">
                    <div className="p-4 rounded-2xl shadow-sm border bg-white/95 backdrop-blur-sm text-gray-800 border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Moodboard creation sticky bar */}
        {selectedProducts.length > 0 && (
          <div className="p-4 relative z-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200">
                <Button 
                  onClick={handleCreateBoard} 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Create Moodboard with {selectedProducts.length} pieces ✨
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Input form */}
        <div className="p-4 relative z-20">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <strong>Error:</strong> {error.message}
              </div>
            )}
            <form onSubmit={handleFormSubmit} className="relative">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Describe the style you're looking for..."
                  className="w-full p-4 pr-16 border-0 bg-transparent resize-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-500"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e as any);
                    }
                  }}
                />
                {isLoading 
                  ? <Button 
                      type="button" 
                      size="icon" 
                      onClick={() => stop()} 
                      className="absolute top-1/2 right-3 -translate-y-1/2 h-8 w-8 bg-red-100 hover:bg-red-200 text-red-600 border-0 rounded-lg"
                    >
                      <Loader2 className="h-4 w-4 animate-spin"/>
                    </Button>
                  : <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!input.trim()} 
                      className="absolute top-1/2 right-3 -translate-y-1/2 h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 text-white border-0 rounded-lg transition-all duration-200"
                    >
                      <Send className="h-4 w-4"/>
                    </Button>
                }
              </div>
            </form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 