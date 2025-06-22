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
import { Copy, RefreshCw, Bot, User, Loader2, Send } from 'lucide-react';

// Enhanced ProductDisplay component using Shadcn UI
function ProductDisplay({ products }: { products: Product[] }) {
  const { selectedProducts, toggleProductSelection } = useAppStore();

  if (!products || products.length === 0) {
    return <p className="text-gray-500 italic">No products found for this search.</p>;
  }

  return (
    <Card className="mt-4 bg-gray-50">
      <CardHeader>
        <CardTitle className="text-lg">Here's what I found</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => {
            const isSelected = selectedProducts.some(p => p.id === product.id);
            return (
              <div 
                key={product.id} 
                className={`relative cursor-pointer border-4 rounded-lg transition-all hover:shadow-lg ${isSelected ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'}`}
                onClick={() => toggleProductSelection(product)}
              >
                <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover rounded-md" />
                {isSelected && <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center border-2 border-white text-sm">✓</div>}
                <div className="p-2">
                  <p className="text-sm font-semibold truncate text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
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
    moodboards,
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
    onFinish: (message) => {
      // After the first AI message, set the chat title
      if (messages.length === 1 && message.role === 'assistant') {
        const firstLine = message.content.split('\n')[0].substring(0, 50);
        setChatTitle(chatId, firstLine);
      }
    },
    onError: (error) => {
      console.error('[useChat] Hook encountered an error:', error);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && approvedModelImageUrls.length === 0) {
      router.push('/onboarding');
    }
  }, [approvedModelImageUrls, router]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
    }
  };

  const handleCreateBoard = async () => {
    if (selectedProducts.length === 0) return;
    setIsLoading(true);

    try {
      const payload = { 
        selectedProducts,
        existingMoodboards: moodboards.map(b => ({title: b.title, description: b.description}))
      };

      const response = await fetch('/api/generate-moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Generate moodboard request failed');
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      
      createOrUpdateMoodboard(
        result.categorization.boardTitle,
        result.categorization.boardDescription,
        result.categorization.action,
        selectedProducts,
        result.tryOnUrlMap
      );

      clearSelectedProducts();
      router.push('/gallery');

    } catch (error) {
      console.error("Failed to create mood board", error);
      alert("Sorry, something went wrong while creating the mood board.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500">
              <Bot className="mx-auto h-12 w-12 mb-2" />
              <h2 className="text-2xl font-semibold">AI Fashion Stylist</h2>
              <p>How can I help you style your look today?</p>
            </div>
          )}

          {messages.map((m: Message) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <Bot className="h-8 w-8 text-gray-600 flex-shrink-0" />}
              <div className={`max-w-xl p-3 rounded-lg shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}>
                {m.parts?.map((part, index) => {
                  if (part.type === 'text') {
                    return <p key={`${m.id}-${index}`}>{part.text}</p>;
                  }
                  if (part.type === 'tool-invocation') {
                    if (part.toolInvocation.toolName === 'searchProducts') {
                       if (part.toolInvocation.state === 'call') {
                          return <div key={part.toolInvocation.toolCallId} className="flex items-center gap-2 text-gray-500 italic"><Loader2 className="h-4 w-4 animate-spin"/>Searching for products...</div>;
                       }
                       if (part.toolInvocation.state === 'result') {
                          return <ProductDisplay key={part.toolInvocation.toolCallId} products={part.toolInvocation.result as Product[]} />;
                       }
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
        
        {/* Mood board creation sticky bar */}
        {selectedProducts.length > 0 && (
          <div className="p-4 bg-white border-t sticky bottom-16 z-10">
            <Button onClick={handleCreateBoard} className="w-full bg-green-600 hover:bg-green-700">
              Create Mood Board with {selectedProducts.length} items
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