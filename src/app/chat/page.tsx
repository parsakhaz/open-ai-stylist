'use client';

import { useChat } from '@ai-sdk/react';
import { useAppStore, Product } from '../store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Message, ToolInvocation } from 'ai';

// A new component to render the products from a tool call
function ProductDisplay({ products }: { products: Product[] }) {
  const { selectedProducts, toggleProductSelection } = useAppStore();

  if (!products || products.length === 0) {
    return <p className="text-gray-500 italic">No products found for this search.</p>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-inner mt-2">
      <h3 className="font-bold mb-4 text-gray-700">Here&apos;s what I found:</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product: Product) => {
          const isSelected = selectedProducts.some(p => p.id === product.id);
          return (
            <div 
              key={product.id} 
              className={`relative cursor-pointer border-4 rounded-lg transition-all hover:shadow-lg ${isSelected ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'}`}
              onClick={() => {
                console.log(`[ProductDisplay] Toggling product selection: ${product.name} (${product.id})`);
                toggleProductSelection(product);
              }}
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
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { 
    selectedProducts, 
    clearSelectedProducts, 
    approvedModelImageUrls,
    setIsLoading,
    createOrUpdateMoodboard,
    moodboards,
  } = useAppStore();

  // useChat now gets `toolInvocations` to render UI
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    // LOGGING: Add onError and onResponse handlers to the useChat hook.
    onError: (error) => {
      console.error('[useChat] Hook encountered an error:', error);
      alert('A connection error occurred. Please try again.');
      setIsLoading(false);
    },
    onResponse: (response) => {
      console.log('[useChat] Received response from API with status:', response.status);
    },
    onFinish: (message) => {
      // LOGGING: See the final composed message from the AI.
      console.log('[useChat] Stream finished. Final message:', message);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    // LOGGING: Track navigation checks.
    console.log('[ChatPage] Checking navigation requirements. Approved images:', approvedModelImageUrls.length);
    
    // This check prevents infinite loops during development hot-reloads
    if (typeof window !== 'undefined' && approvedModelImageUrls.length === 0) {
      console.log('[ChatPage] Insufficient approved images, redirecting to onboarding');
      router.push('/onboarding');
    }
  }, [approvedModelImageUrls, router]);

  // LOGGING: Log current state for debugging.
  console.log('[ChatPage] Current state - Messages:', messages.length, 'Selected products:', selectedProducts.length, 'Existing moodboards:', moodboards.length);

  const handleCreateBoard = async () => {
    if (selectedProducts.length === 0) return;
    setIsLoading(true);

    // LOGGING: Log the start of the mood board creation process.
    console.log('[ChatPage] Initiating mood board creation with products:', selectedProducts.map(p => p.name));

    try {
      const payload = { 
        selectedProducts,
        existingMoodboards: moodboards.map(b => ({title: b.title, description: b.description}))
      };
      
      // LOGGING: See the exact data being sent to the backend.
      console.log('[ChatPage] Sending to /api/generate-moodboard:', payload);

      const response = await fetch('/api/generate-moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // LOGGING: Check the HTTP response status.
      console.log(`[ChatPage] Generate moodboard API response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[ChatPage] Generate moodboard request failed. Response body:', errorBody);
        throw new Error('Generate moodboard request failed');
      }

      // LOGGING: See the raw response before parsing.
      const responseText = await response.text();
      console.log('[ChatPage] Generate moodboard API raw response:', responseText);
      
      const result = JSON.parse(responseText);
      console.log('[ChatPage] Parsed response from /api/generate-moodboard:', result);

      if (result.error) throw new Error(result.error);
      
      // LOGGING: See the data before it's passed to the state store.
      console.log('[ChatPage] Calling createOrUpdateMoodboard with:', {
        title: result.categorization.boardTitle,
        description: result.categorization.boardDescription,
        action: result.categorization.action,
        productCount: selectedProducts.length,
        tryOnUrlMapKeys: Object.keys(result.tryOnUrlMap)
      });
      
      createOrUpdateMoodboard(
        result.categorization.boardTitle,
        result.categorization.boardDescription,
        result.categorization.action,
        selectedProducts,
        result.tryOnUrlMap
      );

      console.log('[ChatPage] Clearing selected products and navigating to gallery');
      clearSelectedProducts();
      router.push('/gallery');

    } catch (error) {
      console.error("[ChatPage] Failed to create mood board", error);
      console.error("[ChatPage] Error stack:", error instanceof Error ? error.stack : 'No stack trace available');
      alert("Sorry, something went wrong while creating the mood board.");
    } finally {
      console.log('[ChatPage] Mood board creation process completed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: Message) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg p-3 rounded-lg shadow-md ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {/* Correct: Render message parts instead of just content */}
              {m.parts?.map((part, index) => {
                if (part.type === 'text') {
                  return <p key={index}>{part.text}</p>;
                }
                if (part.type === 'tool-invocation') {
                  const toolInvocation = part.toolInvocation as ToolInvocation;
                  if (toolInvocation.toolName === 'searchProducts') {
                    if (toolInvocation.state === 'call') {
                      console.log('[ChatPage] Tool invocation in progress:', toolInvocation.toolCallId);
                      return <div key={toolInvocation.toolCallId} className="text-gray-500 italic">Searching for products...</div>;
                    }
                    if (toolInvocation.state === 'result') {
                      console.log('[ChatPage] Tool invocation completed:', toolInvocation.toolCallId, 'Results:', toolInvocation.result);
                      return <ProductDisplay key={toolInvocation.toolCallId} products={toolInvocation.result as Product[]} />;
                    }
                  }
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
      
      {selectedProducts.length > 0 && (
        <div className="p-4 bg-white border-t sticky bottom-16 z-10">
          <button onClick={handleCreateBoard} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-colors">
            Create Mood Board with {selectedProducts.length} items
          </button>
        </div>
      )}

      <form onSubmit={(e) => {
        console.log('[ChatPage] Form submitted with input:', input);
        setIsLoading(true);
        handleSubmit(e);
      }} className="p-4 bg-white border-t sticky bottom-0 z-10">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something like 'show me some streetwear pants'..."
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500"
        />
      </form>
    </div>
  );
} 