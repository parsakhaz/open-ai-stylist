import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject } from 'ai';
import { z } from 'zod';
// IMPORT THE CORRECT PRODUCT TYPE FROM OUR CENTRAL STORE
import { Product } from '@/app/store/useAppStore';
import { promises as fs } from 'fs';
import path from 'path';
import { generateAndSaveTryOnImage } from '@/lib/fashn.service';

console.log('[api/generate-moodboard] Module loaded.');

export const maxDuration = 120; // INCREASE DURATION to allow for multiple API calls

// This is the URL of our Next.js app.
// It's crucial for server-to-server API calls.
const vercelURL = process.env.VERCEL_URL;
const appURL = vercelURL ? `https://${vercelURL}` : 'http://localhost:3000';

// FIX: Point the baseURL to the new /api/v1 path.
const llama = createOpenAICompatible({
  baseURL: `${appURL}/api/v1`,
  name: 'llama',
  // No API key is needed here, because the proxy handles it.
});

// Correct: Define a schema for the categorization result
const categorizationSchema = z.object({
    action: z.enum(["ADD_TO_EXISTING", "CREATE_NEW"]),
    boardTitle: z.string().describe('If action is "ADD_TO_EXISTING", the exact title of the board. If "CREATE_NEW", a new creative title.'),
    boardDescription: z.string().describe('A one-sentence description for the mood board.'),
});

// The old, local Product interface has been deleted. We now use the imported one.

interface MoodboardSummary {
  title: string;
  description: string;
}

const MODEL_CONFIG_FILE = path.join(process.cwd(), 'data', 'model-images.json');

async function getApprovedModelUrl(): Promise<string | null> {
    try {
        const data = await fs.readFile(MODEL_CONFIG_FILE, 'utf-8');
        const config = JSON.parse(data);
        const approvedImages = config.images.filter((img: any) => img.status === 'approved');
        if (approvedImages.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * approvedImages.length);
        return approvedImages[randomIndex].url;
    } catch (error) {
        return null;
    }
}

async function processTryOnsInBackground(boardId: string, products: Product[], categorization: any, mode: "performance" | "balanced" | "quality" = "performance") {
    try {
        console.log(`[BACKGROUND] Starting try-on generation for moodboard: ${boardId} with mode: ${mode}`);
        
        const tryOnPromises = products.map(async (product) => {
            try {
                // Get a random model image for each product individually
                const modelImageUrl = await getApprovedModelUrl();
                if (!modelImageUrl) {
                    console.error(`[BACKGROUND] No approved model images found for product ${product.id}. Using original image.`);
                    return { productId: product.id, tryOnUrl: product.imageUrl };
                }
                
                console.log(`[BACKGROUND] Using model image ${modelImageUrl} for product ${product.id} with mode: ${mode}`);
                const url = await generateAndSaveTryOnImage(modelImageUrl, product.imageUrl, mode);
                return { productId: product.id, tryOnUrl: url };
            } catch (error) {
                console.error(`[BACKGROUND] Failed to generate try-on for product ${product.id}:`, error);
                return { productId: product.id, tryOnUrl: product.imageUrl };
            }
        });
        
        const results = await Promise.all(tryOnPromises);
        const finalTryOnUrlMap: Record<string, string> = {};
        results.forEach(res => {
            finalTryOnUrlMap[res.productId] = res.tryOnUrl;
        });

        console.log(`[BACKGROUND] Try-ons complete for moodboard: ${boardId}. Notifying client...`);

        await fetch(`${appURL}/api/notify-try-on-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, tryOnUrlMap: finalTryOnUrlMap, categorization }),
        });
    } catch (error) {
        console.error(`[BACKGROUND] Failed to process try-ons for moodboard ${boardId}:`, error);
    }
}

export async function POST(req: Request) {
    try {
        const { selectedProducts, existingMoodboards, boardId, tryOnMode }: { 
            selectedProducts: Product[], 
            existingMoodboards: MoodboardSummary[],
            boardId: string,
            tryOnMode?: "performance" | "balanced" | "quality"
        } = await req.json();

        console.log(`[generate-moodboard] Received tryOnMode: ${tryOnMode}, will use: ${tryOnMode || "performance"}`);

        const productDescriptions = selectedProducts.map(p => p.name).join(', ');
        const boardSummaries = existingMoodboards.map(b => `"${b.title}": ${b.description}`).join('; ');
        const prompt = `A user has selected these items: "${productDescriptions}". Their boards are: ${boardSummaries || 'None'}. Decide if they fit an existing board or need a new one.`;

        const { object: categorizationResult } = await generateObject({
            model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),
            schema: categorizationSchema,
            system: `You are an AI mood board curator. Decide how to categorize a user's selected items.`,
            prompt,
        });

        processTryOnsInBackground(boardId, selectedProducts, categorizationResult, tryOnMode || "performance");
        
        console.log(`[API] Fired off background task for board ${boardId}. Returning immediate response.`);
        
        return new Response(JSON.stringify({ categorization: categorizationResult }), { 
            status: 202,
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('[api/generate-moodboard] Mood board generation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate mood board';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
} 