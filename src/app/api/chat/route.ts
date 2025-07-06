import { streamText, tool, type Message } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
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

// Configure OpenAI client to use llmClient
const llmClient = createOpenAI({
  baseURL: process.env.LLM_CLIENT_ENDPOINT,
  apiKey: process.env.LLM_CLIENT_API_KEY,
  headers: {
    'HTTP-Referer': appURL,
    'X-Title': 'OpenAI Stylist',
  },
});

// Model to use for all requests
const MODEL_NAME = process.env.LLM_CLIENT_MODAL;

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

    console.log('[api/chat] Received request with messages:', JSON.stringify(processedMessages.map(m => ({ ...m, content: Array.isArray(m.content) ? `[multimodal_content_of_length_${m.content.length}]` : m.content })), null, 2));

    // Check if the latest message contains an image
    const latestMessage = processedMessages[processedMessages.length - 1];
    const hasImage = latestMessage && 
      latestMessage.role === 'user' && 
      Array.isArray(latestMessage.content) && 
      latestMessage.content.some(part => part.type === 'image_url');

        if (hasImage) {
      // Handle multimodal message by pre-analyzing the image, then using normal AI SDK flow
      console.log('[api/chat] Detected multimodal message, pre-analyzing image');
      
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
          model: MODEL_NAME,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `As a professional fashion stylist, analyze this image and provide a brief but comprehensive assessment covering: gender context (men/women/unisex), skin tone/undertones, body shape, current style, and outfit analysis. Be concise but thorough - this will be used to provide styling advice. User's question: "${userText}"`
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
          model: llmClient(MODEL_NAME),
          system: `You are "StyleList", a professional AI fashion stylist. The user has provided an image which has been analyzed for you.

**Gender-Aware Styling:**
- Always detect if styling for men, women, or unisex context from the image analysis
- Include gender-specific terms in product searches (e.g., "men's dress shirt" vs "women's blouse")
- Consider gender-appropriate fits, styles, and cuts

**Response Flow:**
- Give one focused styling response with specific recommendations (4-6 sentences)
- Then search for the most important clothing item mentioned
- Focus on clothing only: tops, bottoms, dresses, outerwear, loungewear
CRITICAL:
- Do NOT show tool call syntax like [searchProducts(...)]
- NO shoes, accessories, jewelry, bags
- Examples: "Ready to shop? I can help you find: **dark green trousers**, **oversized blazer**, **floral midi dress**, or **black turtleneck**. Which catches your eye?"`,
          messages: textOnlyMessages,
          tools: {
              searchProducts: tool({
                description: 'Search for clothing items based on styling recommendations. Focus on clothing like shirts, blouses, sweaters, jackets, blazers, pants, jeans, skirts, shorts, dresses, coats, loungewear. Do NOT search for shoes, accessories, handbags, jewelry, or other non-clothing items.',
                parameters: z.object({
                  query: z.string().describe('Product search query for clothing items only. MUST include gender-specific terms (e.g., "men\'s white dress shirt", "women\'s high-waisted jeans", "unisex oversized hoodie") based on the detected gender context.'),
                  itemType: z.string().optional().describe('Clothing category like "pants", "jeans", "shirts", "jackets", "skirts", "sweaters", "dresses", "coats"'),
                }),
                execute: async ({ query }): Promise<RichProduct[]> => {
                  console.log(`[tool:searchProducts] Executing for image-based recommendation: "${query}"`);
                  const finalResults = await searchAndTransformProducts(query);
                  return finalResults;
                },
              }),
            },
        });

        return result.toDataStreamResponse();
      }
    }

    // Handle text-only messages with AI SDK
    console.log(`[api/chat] Using AI SDK for text-only messages`);

    const result = streamText({
      model: llmClient(MODEL_NAME),

      system: `You are "StyleList", a professional AI fashion stylist.

      **Gender-Aware Styling:**
      - Always detect if styling for men, women, or unisex context from user messages/images
      - Include gender-specific terms in product searches (e.g., "men's chinos" vs "women's trousers")
      - Consider gender-appropriate fits, styles, and cuts

      **Response Flow:**
      - Give one focused styling response with specific recommendations (4-6 sentences)
      - Then search for the most important clothing item mentioned
      - For vague requests like "jeans" - ask one quick question about style/fit, then search
      - Focus on clothing only: tops, bottoms, dresses, outerwear, loungewear
      - NO shoes, accessories, jewelry, bags`,

      messages: processedMessages.filter(m => typeof m.content === 'string' || !Array.isArray(m.content)), // Only text messages
      tools: {
          searchProducts: tool({
            description: 'Searches the product catalog for clothing items based on a user query. Focus on clothing like shirts, blouses, sweaters, jackets, blazers, pants, jeans, skirts, shorts, dresses, coats, loungewear. Do NOT search for shoes, accessories, handbags, jewelry, or other non-clothing items.',
            parameters: z.object({
              query: z.string().describe('The user\'s search query for clothing items only. MUST include gender-specific terms (e.g., "men\'s korean minimal black jacket", "women\'s high-waisted skinny jeans") and incorporate conversation context.'),
              itemType: z.string().optional().describe('Specific clothing category like "pants", "jeans", "shirts", "jackets", "skirts", "sweaters", "dresses", "coats".'),
            }),
          execute: async ({ query }): Promise<RichProduct[]> => {
            console.log(`[tool:searchProducts] Executing with REAL Amazon API for query: "${query}"`);
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