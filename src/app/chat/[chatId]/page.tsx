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
    return <p className="text-gray-500 italic mt-4">
      I couldn't find anything for "{searchQuery}". Try another search?
    </p>;
  }

  return (
    <Card className="mt-4 bg-gray-50/50">
      <CardHeader>
        <CardTitle className="text-lg">Here's what I found for "{searchQuery}"</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => {
            const isSelected = selectedProducts.some(p => p.id === product.id);
            return (
              <div 
                key={product.id} 
                className={`relative cursor-pointer group border-4 rounded-lg transition-all bg-white shadow-sm hover:shadow-xl ${isSelected ? 'border-indigo-500' : 'border-transparent'}`}
                onClick={() => toggleProductSelection(product)}
              >
                {/* Product Image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>

                {/* Checkmark for selected items */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center border-2 border-white text-sm z-10">✓</div>
                )}
                
                {/* Product Info Overlay */}
                <div className="p-2.5 flex flex-col">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-1">
                    {product.price && <p className="text-base font-semibold text-gray-900">{product.price}</p>}
                    {product.originalPrice && <p className="text-xs text-gray-500 line-through">{product.originalPrice}</p>}
                  </div>

                  {/* Rating */}
                  {product.rating && product.ratingCount && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{product.rating}</span>
                      <span className="text-gray-400">({product.ratingCount})</span>
                    </div>
                  )}

                  {/* Prime Badge */}
                  {product.isPrime && (
                    <span className="mt-2 text-xs font-bold text-sky-600">prime</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
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
      <div className="flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 max-w-md">
                <Bot className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                <h2 className="text-3xl font-light text-black mb-3">AI Fashion Stylist</h2>
                <p className="text-lg text-gray-600">How can I help you style your look today?</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m: Message) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && <Bot className="h-8 w-8 text-gray-600 flex-shrink-0" />}
                  <div className={`max-w-xl p-3 rounded-lg shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}>
                    {m.content && <p className="mb-2">{m.content}</p>}
                    
                    {m.toolInvocations?.map(toolInvocation => {
                      if (toolInvocation.toolName === 'searchProducts') {
                        // Show loading spinner while the tool call is executing
                        if (toolInvocation.state === 'call') {
                          const searchQuery = (toolInvocation as any).args?.query;
                          return (
                            <Card key={toolInvocation.toolCallId} className="mt-4 bg-gray-50/50">
                              <CardHeader>
                                <CardTitle className="text-lg">Searching for "{searchQuery}"...</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-center py-8">
                                  <div className="flex items-center gap-3 text-gray-600">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-sm">Finding the perfect pieces for you...</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
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
                    {m.role === 'assistant' && !isLoading && (
                      <div className="flex gap-2 mt-2 border-t pt-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(m.content)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => reload()}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Regenerate</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && <User className="h-8 w-8 text-indigo-600 flex-shrink-0" />}
                </div>
              ))}
              
              {isLoading && messages[messages.length-1]?.role === 'user' && (
                <div className="flex gap-3">
                  <Bot className="h-8 w-8 text-gray-600 flex-shrink-0" />
                  <div className="max-w-xl p-3 rounded-lg shadow-sm bg-white text-gray-800">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Moodboard creation sticky bar */}
        {selectedProducts.length > 0 && (
          <div className="p-4 bg-white border-t sticky bottom-16 z-10">
            <Button onClick={handleCreateBoard} className="w-full bg-green-600 hover:bg-green-700">
              Create Moodboard with {selectedProducts.length} pieces
            </Button>
          </div>
        )}
        
        {/* Input form */}
        <div className="p-4 bg-white border-t">
          {error && <div className="text-red-500 mb-2">Error: {error.message}</div>}
          <form onSubmit={handleFormSubmit} className="relative">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Describe the style you're looking for..."
              className="w-full p-3 pr-20 border rounded-md resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e as any);
                }
              }}
            />
            {isLoading 
              ? <Button type="button" size="icon" onClick={() => stop()} className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin"/>
                </Button>
              : <Button type="submit" size="icon" disabled={!input.trim()} className="absolute top-1/2 right-3 -translate-y-1/2">
                  <Send className="h-4 w-4"/>
                </Button>
            }
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
} 