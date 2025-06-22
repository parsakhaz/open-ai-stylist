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
          system: `You are "StyleList", a professional AI fashion stylist. The user has provided an image which has been analyzed for you. Use this analysis to provide comprehensive styling advice including specific outfit suggestions, color recommendations, and styling tips. Be warm, encouraging, and actionable.`,
          messages: textOnlyMessages,
          tools: {
            searchProducts: tool({
              description: 'Search for fashion products based on styling recommendations',
              parameters: z.object({
                query: z.string().describe('Product search query based on styling advice'),
                itemType: z.string().optional().describe('Item category'),
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
      model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),

      // --- IMPROVED SYSTEM PROMPT: Now handles image inputs ---
      system: `You are "StyleList", a professional AI fashion stylist. You provide comprehensive styling advice like a real personal stylist would.

      **For Fashion Advice & Styling Questions:**
      
      When users ask for fashion advice, consider these key factors like a real stylist:
      - **Skin Tone & Undertones:** Ask about or assess their coloring to suggest flattering colors
      - **Body Shape:** Consider proportions and suggest styles that enhance their figure
      - **Lifestyle & Occasions:** Understand their daily needs and special events
      - **Personal Style Goals:** What aesthetic they want to achieve
      - **Budget & Practicality:** Suggest versatile pieces that work with their lifestyle
      
      **Provide Comprehensive Advice:**
      - Suggest 2-3 complete outfit ideas
      - Recommend color palettes that work with their skin tone
      - Give specific styling tips (tucking, layering, proportions)
      - Suggest versatile pieces that can be styled multiple ways
      
      **For Product Searches:**
      
      **Step 1: ASSESS QUERY SPECIFICITY**
      - VAGUE queries (like just "jeans", "shirts") need MORE INFO before searching
      - SPECIFIC queries (like "black skinny jeans", "oversized hoodie for streetwear") have ENOUGH INFO to search
      
      **Step 2A: GATHER MORE DETAILS (if vague)**
      - Ask about their style preferences, occasions, body type, and color preferences
      - Do NOT make a tool call yet. Wait for their response with more details.
      
      **Step 2B: TOOL CALL (if specific enough)**
      - When the request is specific enough, your response MUST BE ONLY the \`searchProducts\` tool call
      - **CRITICAL: INCORPORATE CONVERSATION CONTEXT** - Consider their previously mentioned style preferences, skin tone, body type, etc.
      
      **After Product Results:**
      - Present results with styling advice specific to their body type and coloring
      - Suggest how to style the pieces for their lifestyle
      - Always end with: "What else would you like to see?" or styling follow-up questions
      
      **CRITICAL FAILURE INSTRUCTION:** If the \`searchProducts\` tool returns an empty array ([]), inform the user and suggest alternative search terms.
      
      Be warm, encouraging, and provide actionable advice like a professional stylist would.`,

      messages: processedMessages.filter(m => typeof m.content === 'string' || !Array.isArray(m.content)), // Only text messages
      tools: {
        searchProducts: tool({
          description: 'Searches the product catalog for clothing items based on a user query, such as style, color, or item type (e.g., "pants", "streetwear fits", "korean minimal shirt", "sneakers", "boots"). IMPORTANT: Consider the full conversation context when constructing your query - if the user mentioned style preferences earlier, include them in your search. Use the itemType parameter for better accuracy.',
          parameters: z.object({
            query: z.string().describe('The user\'s search query. Be descriptive and incorporate conversation context. E.g., if user mentioned "korean minimal" earlier and now wants "black jacket", search for "korean minimal black jacket".'),
            itemType: z.string().optional().describe('Specific item category like "pants", "upper-body", "dress", "jacket", "footwear".'),
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