import { streamText, tool, type Message } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { searchAndTransformProducts, RichProduct } from '@/lib/amazon.service';
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

// We no longer need local product catalog since we're using real Amazon API

// NEW: Function to convert local image path to data URL
async function convertLocalImageToDataUrl(imageUrl: string): Promise<string | null> {
  // Expects a public path like '/uploads/image.png'
  if (!imageUrl.startsWith('/uploads/')) {
    return null; // Not a local file we can process
  }

  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    const imageBuffer = await fs.readFile(filePath);
    // This is a naive way to get mime type, but should work for png/jpg/webp
    const extension = path.extname(filename).toLowerCase();
    const mimeType =
      extension === '.png'
        ? 'image/png'
        : extension === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`[api/chat] Failed to read and convert image: ${imageUrl}`, error);
    return null; // Return null on error
  }
}

export async function POST(req: Request) {
  try {
    const { messages: originalMessages }: { messages: Message[] } = await req.json();

    // --- NEW: Process messages to handle local image URLs ---
    const processedMessages = await Promise.all(
      originalMessages.map(async (message) => {
        if (message.role === 'user' && Array.isArray(message.content)) {
          const newContent = await Promise.all(
            message.content.map(async (part) => {
              if (
                part.type === 'image_url' &&
                typeof part.image_url === 'object' &&
                part.image_url.url.startsWith('/uploads/')
              ) {
                console.log(`[api/chat] Found local image to process: ${part.image_url.url}`);
                const dataUrl = await convertLocalImageToDataUrl(part.image_url.url);
                if (dataUrl) {
                  console.log('[api/chat] Successfully converted image to data URL.');
                  return { ...part, image_url: { url: dataUrl } };
                }
              }
              return part;
            })
          );
          return { ...message, content: newContent };
        }
        return message;
      })
    ) as Message[];
    // End of new processing block



    // Check if the latest message contains an image
    const latestMessage = processedMessages[processedMessages.length - 1];
    const hasImage = latestMessage && 
      latestMessage.role === 'user' && 
      Array.isArray(latestMessage.content) && 
      latestMessage.content.some(part => part.type === 'image_url');

        if (hasImage) {
      // Handle multimodal message by pre-analyzing the image, then using normal AI SDK flow
      
      // Extract the image and text from the multimodal message
      const imageMessage = Array.isArray(latestMessage.content) 
        ? latestMessage.content.find((part: any) => part.type === 'image_url')
        : null;
      const textMessage = Array.isArray(latestMessage.content)
        ? latestMessage.content.find((part: any) => part.type === 'text')
        : null;
      const userText = textMessage?.text || '';
      const imageUrl = imageMessage?.image_url?.url;

      if (imageUrl) {
        // First, analyze the image using direct API call (non-streaming)
        const imageAnalysisPayload = {
          model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `As a professional fashion stylist, analyze this image and provide a brief but comprehensive assessment covering: skin tone/undertones, body shape, current style, and outfit analysis. Be concise but thorough - this will be used to provide styling advice. User's question: "${userText}"`
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          stream: false
        };

        const proxyUrl = `${appURL}/api/v1/chat/completions`;
        const analysisResponse = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageAnalysisPayload),
        });

        if (!analysisResponse.ok) {
          throw new Error('Image analysis failed');
        }

        const analysisData = await analysisResponse.json();
        const imageAnalysis = analysisData.choices?.[0]?.message?.content || 'Unable to analyze image';

        // Convert ALL messages to text-only format for AI SDK compatibility
        const textOnlyMessages = [
          ...processedMessages.slice(0, -1).map(msg => {
            // Convert any multimodal messages to text-only
            if (Array.isArray(msg.content)) {
              const textParts = msg.content.filter((part: any) => part.type === 'text');
              const textContent = textParts.map((part: any) => part.text).join(' ');
              return {
                ...msg,
                content: textContent || '[Previous message contained an image]'
              };
            }
            return msg;
          }),
          {
            role: 'user' as const,
            content: `${userText}\n\n[Image Analysis: ${imageAnalysis}]`
          }
        ] as Message[];

        // Use normal AI SDK flow with the enhanced text message
        const result = streamText({
          model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),
                     system: `You are "StyleList", a professional AI fashion stylist specializing in tops and bottoms. The user has provided an image which has been analyzed for you. 

           Keep responses concise and focused on clothing only (tops and bottoms). When users want products, ask them to choose which item to search for, then provide clean product recommendations with prices and brief styling tips.`,
          messages: textOnlyMessages,
                      tools: {
              searchProducts: tool({
                description: 'Search for clothing items (tops and bottoms only) based on styling recommendations. Focus only on shirts, blouses, sweaters, jackets, blazers, pants, jeans, skirts, shorts. Do NOT search for shoes, accessories, or other non-clothing items.',
                parameters: z.object({
                  query: z.string().describe('Product search query for clothing items only based on styling advice'),
                  itemType: z.string().optional().describe('Clothing category like "pants", "jeans", "shirts", "jackets", "skirts", "sweaters"'),
                  minPrice: z.string().optional().describe('Minimum price filter in dollars as string, include only if user requests a price range'),
                  maxPrice: z.string().optional().describe('Maximum price filter in dollars as string, include only if user requests a price range'),
                  brand: z.string().optional().describe('Brand name filter, include only if user specifically requests a certain brand'),
                  isPrime: z.string().optional().describe('Filter for Prime eligible items, set to "true" or "false" only if user requests'),
                }),
                execute: async ({ query, minPrice, maxPrice, brand, isPrime }): Promise<RichProduct[]> => {

                  const searchParams = {
                    ...(minPrice ? { minPrice } : {}),
                    ...(maxPrice ? { maxPrice } : {}),
                    ...(brand ? { brand } : {}),
                    ...(isPrime ? { isPrime } : {}),
                  };
                  const finalResults = await searchAndTransformProducts(query, Object.keys(searchParams).length ? searchParams : undefined);
                  return finalResults;
                },
              }),
            },
        });

        return result.toDataStreamResponse();
      }
    }

    // Handle text-only messages with AI SDK

    const result = streamText({
      model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),

      system: `You are "StyleList", a professional AI fashion stylist. Focus on tops and bottoms only (shirts, jackets, pants, jeans, skirts).

      Keep responses concise and helpful. When users ask for product searches, search directly using their query. Format results cleanly with item names, prices, and brief styling tips.

      Never show technical syntax, JSON, or tool calls to users.`,

      messages: processedMessages.filter(m => typeof m.content === 'string' || !Array.isArray(m.content)), // Only text messages
              tools: {
          searchProducts: tool({
            description: 'Searches the product catalog for clothing items (tops and bottoms only) based on a user query. Focus on tops like shirts, blouses, sweaters, jackets, blazers and bottoms like pants, jeans, skirts, shorts. Do NOT search for shoes, accessories, or other non-clothing items.',
            parameters: z.object({
              query: z.string().describe('The user\'s search query for clothing items only. Be descriptive and incorporate conversation context. E.g., if user mentioned "korean minimal" earlier and now wants "black jacket", search for "korean minimal black jacket".'),
              itemType: z.string().optional().describe('Specific clothing category like "pants", "jeans", "shirts", "jackets", "skirts", "sweaters".'),
              minPrice: z.string().optional().describe('Minimum price filter in dollars as string, include only if user requests a price range'),
              maxPrice: z.string().optional().describe('Maximum price filter in dollars as string, include only if user requests a price range'),
              brand: z.string().optional().describe('Brand name filter, include only if user specifically requests a certain brand'),
              isPrime: z.string().optional().describe('Filter for Prime eligible items, set to "true" or "false" only if user requests'),
            }),
          execute: async ({ query, minPrice, maxPrice, brand, isPrime }): Promise<RichProduct[]> => {
            const searchParams = {
              ...(minPrice ? { minPrice } : {}),
              ...(maxPrice ? { maxPrice } : {}),
              ...(brand ? { brand } : {}),
              ...(isPrime ? { isPrime } : {}),
            };
            return await searchAndTransformProducts(query, Object.keys(searchParams).length ? searchParams : undefined);
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