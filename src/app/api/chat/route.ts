import { streamText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Local type definition for products
interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  style_tags: string[];
  buyLink: string;
}

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
      
      // --- DEFINITIVE FIX: Add a specific instruction for handling empty search results. ---
      system: `You are "Chad", an AI fashion stylist. You operate in a strict two-step process.
      
      **Step 1: TOOL CALL**
      - When a user asks for clothing, your response for that turn MUST BE ONLY the \`searchProducts\` tool call. Do not include any other text.
      
      **Step 2: PRESENT RESULTS**
      - After you receive results from the tool call, you MUST present them. Your response MUST start with a friendly, conversational message (e.g., "You got it!") before showing the product results.
      - **CRITICAL FAILURE INSTRUCTION:** If the \`searchProducts\` tool returns an empty array ([]), you MUST inform the user that you couldn't find anything matching their request and ask them to try a different search. DO NOT try to search again on your own.`,
      
      messages,
      tools: {
        searchProducts: tool({
          description: 'Searches the product catalog for clothing items based on a user query, such as style, color, or item type (e.g., "pants", "streetwear fits", "korean minimal shirt", "sneakers", "boots"). Use the itemType parameter for better accuracy.',
          parameters: z.object({
            query: z.string().describe('The user\'s search query. Be descriptive. E.g., "edgy black pants for streetwear".'),
            itemType: z.string().optional().describe('Specific item category like "pants", "upper-body", "dress", "jacket", "footwear".'),
          }),
          execute: async ({ query, itemType }) => {
            // LOGGING: Log when the tool starts executing and with what parameters.
            console.log(`[tool:searchProducts] Executing with query: "${query}", itemType: "${itemType || 'none'}"`);
            
            const res = await fetch(`${appURL}/data/products.json`);
            const products = await res.json();
            console.log(`[tool:searchProducts] Loaded ${products.length} products from catalog.`);
            
            const lowerCaseQuery = query.toLowerCase();
            
            let potentialMatches = products;

            // 1. If itemType is given, narrow down the list first. This is a strong signal.
            if (itemType) {
              potentialMatches = potentialMatches.filter((p: any) => p.category.toLowerCase() === itemType.toLowerCase());
              console.log(`[tool:searchProducts] Filtered to ${potentialMatches.length} products by itemType: "${itemType}"`);
            }
            
            // 2. From the potential matches, find items that match the query text.
            let filteredProducts = potentialMatches.filter((p: any) => {
              // FIX: Correctly check if product attributes include the query, not the other way around.
              const nameMatch = p.name.toLowerCase().includes(lowerCaseQuery);
              const categoryMatch = p.category.toLowerCase().includes(lowerCaseQuery);
              const tagMatch = p.style_tags.some((tag:string) => tag.toLowerCase().includes(lowerCaseQuery));
              
              return nameMatch || categoryMatch || tagMatch;
            });

            console.log(`[tool:searchProducts] Found ${filteredProducts.length} products after text search.`);

            // 3. Fallback: If the combined filter yields no results, and we had an itemType,
            // retry the search against ALL products to be less strict.
            if (filteredProducts.length === 0 && itemType) {
                console.log('[tool:searchProducts] No results in category, retrying query against all products.');
                filteredProducts = products.filter((p: any) => {
                    const nameMatch = p.name.toLowerCase().includes(lowerCaseQuery);
                    const tagMatch = p.style_tags.some((tag:string) => tag.toLowerCase().includes(lowerCaseQuery));
                    return nameMatch || tagMatch;
                });
            }
            
            // Return a structured result for the client to render
            const finalResults = filteredProducts.slice(0, 8).map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              imageUrl: p.imageUrl,
              style_tags: p.style_tags,
              buyLink: p.buyLink,
            }));

            console.log(`[tool:searchProducts] Returning ${finalResults.length} products to the user.`);
            return finalResults;
          },
        }),
      },
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('[api/chat] CRITICAL ERROR:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred' }), { status: 500 });
  }
} 