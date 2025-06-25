import { NextResponse } from 'next/server';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject } from 'ai';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { searchAndTransformProducts, RichProduct } from '@/lib/amazon.service';
import { generateAndSaveTryOnImage } from '@/lib/fashn.service';
import { promises as fs } from 'fs';
import path from 'path';
import { Moodboard } from '@/app/store/useAppStore';

export const maxDuration = 180; // Allow 3 minutes for the full background process

const vercelURL = process.env.VERCEL_URL;
const appURL = vercelURL ? `https://${vercelURL}` : 'http://localhost:3000';

const llama = createOpenAICompatible({
  baseURL: `${appURL}/api/v1`,
  name: 'llama',
});

// Zod schemas for AI-driven decisions
const searchQueriesSchema = z.object({
  detectedGender: z.enum(['men', 'women', 'unisex']).describe('The gender context detected from the styling advice or image'),
  queries: z.array(z.string().describe("A specific, descriptive search query for a clothing item. e.g., 'white linen button-down shirt' or 'high-waisted light wash jeans'"))
    .min(1)
    .max(2)
    .describe('An array of 1-2 distinct search queries based on the most interesting items in the styling advice.'),
});

const boardDetailsSchema = z.object({
  title: z.string().describe('A short, catchy, and creative moodboard title (3-5 words). e.g., "Urban Explorer" or "Weekend Getaway".'),
  description: z.string().describe('A concise one-sentence description for the moodboard.'),
});

const MODEL_CONFIG_FILE = path.join(process.cwd(), 'data', 'model-images.json');

async function getApprovedModelUrl(): Promise<string | null> {
    try {
        const data = await fs.readFile(MODEL_CONFIG_FILE, 'utf-8');
        const config = JSON.parse(data);
        const approvedImages = config.images.filter((img: any) => img.status === 'approved');
        if (approvedImages.length === 0) return null;
        return approvedImages[Math.floor(Math.random() * approvedImages.length)].url;
    } catch {
        return null;
    }
}

async function runProactiveStyling(adviceText: string, mode: "performance" | "balanced" | "quality" = "performance", boardId?: string) {
  try {
    // 1. AI analyzes its own advice to decide what to search for
    const { object: searchDecision } = await generateObject({
      model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),
      schema: searchQueriesSchema,
      system: "You are a fashion assistant. Your job is to read styling advice and extract 1-2 key, specific clothing items to create a style board from. Focus on unique, actionable items. Always detect the gender context (men/women/unisex) and include appropriate gender-specific search terms.",
      prompt: `Here is the styling advice. Extract the best items for a visual search and detect the gender context:

IMPORTANT: 
- Include gender-specific terms in your search queries (e.g., "men's dress shirt" not just "dress shirt")
- Consider typical gendered clothing differences (e.g., men's vs women's fits, styles, etc.)
- If gender is unclear, default to 'unisex' and use neutral terms

Styling advice:
---
${adviceText}`,
    });

    console.log('[proactive-generator] AI decided to search for:', searchDecision.queries);
    console.log('[proactive-generator] Detected gender context:', searchDecision.detectedGender);

    // 2. Search for products for the first valid query
    const products = await searchAndTransformProducts(searchDecision.queries[0]);
    const selectedProducts = products.slice(0, 2); // Take top 2 for the board

    if (selectedProducts.length === 0) {
      console.log(`[proactive-generator] No products found for "${searchDecision.queries[0]}", aborting.`);
      return;
    }

    // 3. AI generates title & description for the new board
    const { object: boardDetails } = await generateObject({
      model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),
      schema: boardDetailsSchema,
      system: `You are a creative director for a fashion app. Create a compelling title and description for a moodboard. Consider the gender context: ${searchDecision.detectedGender}.`,
      prompt: `Create a title and description for a ${searchDecision.detectedGender === 'unisex' ? '' : searchDecision.detectedGender + "'s"} moodboard featuring: ${selectedProducts.map(p => p.name).join(', ')}.

Make the title and description feel appropriate for ${searchDecision.detectedGender} fashion while being creative and inspiring.`,
    });

    const finalBoardId = boardId || uuidv4();

    // 4. Generate Try-Ons for the products
    const tryOnUrlMap: Record<string, string> = {};
    for (const product of selectedProducts) {
      const modelUrl = await getApprovedModelUrl();
      if (modelUrl) {
        tryOnUrlMap[product.id] = await generateAndSaveTryOnImage(modelUrl, product.imageUrl, mode);
      } else {
        tryOnUrlMap[product.id] = product.imageUrl;
      }
    }

    // 5. Assemble the final Moodboard object
    const newBoard: Moodboard = {
      id: finalBoardId,
      title: boardDetails.title,
      description: boardDetails.description,
      items: selectedProducts.map(p => ({
        ...p,
        tryOnUrl: tryOnUrlMap[p.id] || p.imageUrl,
      })),
    };
    
    // 6. Notify the client that the new board is complete
    await fetch(`${appURL}/api/notify-try-on-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: finalBoardId, newBoard }), // Send the full board object
    });

    console.log(`[proactive-generator] Successfully created and notified for new board: ${finalBoardId}`);

  } catch (error) {
    console.error('[proactive-generator] Error during background processing:', error);
  }
}

export async function POST(req: Request) {
  try {
    const { adviceText, tryOnMode } = await req.json();
    console.log(`[proactive-style-generator] Received tryOnMode: ${tryOnMode}, will use: ${tryOnMode || "performance"}`);
    
    if (!adviceText) {
      return NextResponse.json({ error: 'Missing adviceText' }, { status: 400 });
    }

    // Start the process and return the board ID for polling
    const boardId = uuidv4();
    
    // Don't wait for the process to finish. This makes the API call non-blocking.
    runProactiveStyling(adviceText, tryOnMode || "performance", boardId);

    // Immediately return a success response with the board ID.
    return NextResponse.json({ message: 'Proactive styling process initiated.', boardId }, { status: 202 });
  } catch (error) {
    console.error('[proactive-generator] Critical API Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
} 