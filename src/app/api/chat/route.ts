import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

console.log('[api/chat] Module loaded.');

export const maxDuration = 30;

// This is the URL of our Next.js app.
// It's crucial for server-to-server API calls.
const vercelURL = process.env.VERCEL_URL;
const appURL = vercelURL ? `https://${vercelURL}` : 'http://localhost:3000';

// FIX: Point the baseURL to the new /api/v1 path.
// The SDK will automatically add "/chat/completions" to this.
const llama = createOpenAICompatible({
  baseURL: `${appURL}/api/v1`,
  name: 'llama',
  // No API key is needed here, because the proxy handles it.
});

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  buyLink: string;
  style_tags: string[];
}

// This can be defined outside the function to avoid re-reading the file on every call
// For a real app, this would come from a database. For now, let's cache it.
let productCatalog: Product[] | null = null;
async function getProducts(): Promise<Product[]> {
  if (productCatalog) return productCatalog;
  const jsonDirectory = path.join(process.cwd(), 'public', 'data');
  const fileContents = await fs.readFile(path.join(jsonDirectory, 'products.json'), 'utf8');
  productCatalog = JSON.parse(fileContents);
  return productCatalog || [];
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // LOGGING: See the incoming chat history.
    console.log('[api/chat] Received request with messages:', JSON.stringify(messages, null, 2));

    // LOGGING: Using proxy for Llama API calls
    console.log(`[api/chat] Using Llama proxy base at: ${appURL}/api/v1`);

    // Correct: No 'await' here. streamText returns the result object immediately.
    const result = streamText({
      model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),
      
      // --- FIX: Make the instructions more explicit ---
      system: `You are "Chad", a friendly and enthusiastic AI fashion stylist. Your goal is to help the user discover new clothing items. 
      - You MUST use the 'searchProducts' tool to find items whenever the user expresses interest in any type of clothing. Do not invent products.
      - After the 'searchProducts' tool returns the results, you MUST present them to the user. 
      - CRITICALLY: You must also include a friendly, conversational text response introducing the products, for example: 'Awesome, check out these streetwear options I found for you!' or 'You got it! Here are some great items that match your search.'. 
      - DO NOT end the turn silently after a tool call. Always provide a text message.`,
      
      messages,
      tools: {
        searchProducts: tool({
          description: 'Searches the product catalog for clothing items based on a user query, such as style, color, or item type (e.g., "pants", "streetwear fits", "korean minimal shirt").',
          parameters: z.object({
            query: z.string().describe('The user\'s search query. Be descriptive. E.g., "edgy black pants for streetwear".'),
            itemType: z.string().optional().describe('Specific item category like "pants", "upper-body", "dress", "jacket".'),
          }),
          execute: async ({ query, itemType }) => {
            // LOGGING: Log when the tool starts executing and with what parameters.
            console.log(`[tool:searchProducts] Executing with query: "${query}", itemType: "${itemType}"`);

            const products = await getProducts();
            
            // LOGGING: Confirm the product catalog was loaded.
            console.log(`[tool:searchProducts] Loaded ${products.length} products from catalog.`);
            
            const lowerCaseQuery = query.toLowerCase();
            
            let filteredProducts = products.filter(p => {
              const nameMatch = p.name.toLowerCase().includes(lowerCaseQuery);
              const tagMatch = p.style_tags.some((tag:string) => lowerCaseQuery.includes(tag.toLowerCase()));
              const queryInName = p.name.toLowerCase().split(' ').some((word: string) => lowerCaseQuery.includes(word));
              return nameMatch || tagMatch || queryInName;
            });

            // LOGGING: See how many products matched the query before other filters.
            console.log(`[tool:searchProducts] Found ${filteredProducts.length} products after initial filter.`);

            if (itemType) {
              filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === itemType.toLowerCase());
              // LOGGING: See how many products matched after category filter.
              console.log(`[tool:searchProducts] Found ${filteredProducts.length} products after category filter.`);
            }
            
            // Return a structured result for the client to render
            const finalResults = filteredProducts.slice(0, 8).map(p => ({
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                category: p.category,
                buyLink: p.buyLink, // Ensure you return all needed fields
                style_tags: p.style_tags,
            }));

            // LOGGING: See exactly what the tool is returning to the AI model.
            console.log('[tool:searchProducts] Returning results to model:', finalResults);
            return finalResults;
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // LOGGING: Add a top-level try-catch to catch errors before streaming starts (e.g., req.json() fails).
    console.error('[api/chat] CRITICAL ERROR:', error);
    return new Response('An internal error occurred', { status: 500 });
  }
} 