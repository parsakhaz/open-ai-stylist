import { streamText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { searchAndTransformProducts, RichProduct } from '@/lib/amazon.service';

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

// We no longer need local product catalog since we're using real Amazon API

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
      
      // --- IMPROVED SYSTEM PROMPT: Gather details before tool call ---
      system: `You are "Chad", an AI fashion stylist. You operate in a three-step process.
      
      **Step 1: ASSESS QUERY SPECIFICITY**
      - When a user asks for clothing, first assess if their request has enough detail for a good search.
      - VAGUE queries (like just "jeans", "shirts", "pants") need MORE INFO before searching.
      - SPECIFIC queries (like "black skinny jeans", "oversized hoodie for streetwear", "formal white dress shirt") have ENOUGH INFO to search.
      
      **Step 2A: GATHER MORE DETAILS (if query is vague)**
      - Ask friendly, specific questions to understand their needs better:
        - What style/vibe are they going for? (casual, formal, streetwear, minimalist, edgy, etc.)
        - What color preferences do they have?
        - What's the occasion? (work, weekend, date, gym, etc.)
        - Any specific fit preferences? (slim, oversized, cropped, etc.)
      - Do NOT make a tool call yet. Wait for their response with more details.
      
      **Step 2B: TOOL CALL (if query has enough detail)**
      - When the user's request is specific enough, your response MUST BE ONLY the \`searchProducts\` tool call. Do not include any other text.
      - **CRITICAL: INCORPORATE CONVERSATION CONTEXT** - When constructing your search query, consider the ENTIRE conversation history. If the user mentioned style preferences earlier (like "korean minimal", "streetwear", "preppy", etc.), incorporate those into your search query along with their current request.
      
      **Step 3: PRESENT RESULTS**
      - After you receive results from the tool call, you MUST present them. Your response MUST start with a friendly, conversational message (e.g., "You got it!") before showing the product results.
      - After presenting the results, ALWAYS end your response with a follow-up question: "What else would you like to see?" to keep the conversation flowing.
      - **CRITICAL FAILURE INSTRUCTION:** If the \`searchProducts\` tool returns an empty array ([]), you MUST inform the user that you couldn't find anything matching their request and ask them to try a different search. DO NOT try to search again on your own.`,
      
      messages,
      tools: {
        searchProducts: tool({
          description: 'Searches the product catalog for clothing items based on a user query, such as style, color, or item type (e.g., "pants", "streetwear fits", "korean minimal shirt", "sneakers", "boots"). IMPORTANT: Consider the full conversation context when constructing your query - if the user mentioned style preferences earlier, include them in your search. Use the itemType parameter for better accuracy.',
          parameters: z.object({
            query: z.string().describe('The user\'s search query. Be descriptive and incorporate conversation context. E.g., if user mentioned "korean minimal" earlier and now wants "black jacket", search for "korean minimal black jacket".'),
            itemType: z.string().optional().describe('Specific item category like "pants", "upper-body", "dress", "jacket", "footwear".'),
          }),
          // The new execute block that calls our Amazon service
          execute: async ({ query }): Promise<RichProduct[]> => {
            console.log(`[tool:searchProducts] Executing with REAL Amazon API for query: "${query}"`);
            
            // Call our new service to get real, rich products from Amazon
            const finalResults = await searchAndTransformProducts(query);
            
            console.log(`[tool:searchProducts] Returning ${finalResults.length} rich products to the user.`);
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