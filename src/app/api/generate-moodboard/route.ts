import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { RichProduct } from '@/lib/amazon.service';
import { generateAndSaveTryOnImage } from '@/lib/fashn.service';
import { promises as fs } from 'fs';
import path from 'path';
import { Moodboard } from '@/app/store/useAppStore';

console.log('[api/generate-moodboard] Module loaded.');

export const maxDuration = 300; // 5 minutes to allow background processing

// Environment variables for app URL
const vercelURL = process.env.VERCEL_URL;
const appURL = vercelURL ? `https://${vercelURL}` : 'http://localhost:3000';

// FIX: Point the baseURL to the new /api/v1 path.
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

async function processTryOnsInBackground(boardId: string, products: RichProduct[], categorization: any, mode: "performance" | "balanced" | "quality" = "performance") {
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
            selectedProducts: RichProduct[], 
            existingMoodboards: MoodboardSummary[],
            boardId: string,
            tryOnMode?: "performance" | "balanced" | "quality"
        } = await req.json();

        console.log(`[generate-moodboard] Received tryOnMode: ${tryOnMode}, will use: ${tryOnMode || "performance"}`);

        const productDescriptions = selectedProducts.map(p => p.name).join(', ');
        const boardSummaries = existingMoodboards.map(b => `"${b.title}": ${b.description}`).join('; ');
        const prompt = `A user has selected these items: "${productDescriptions}". Their boards are: ${boardSummaries || 'None'}. Decide if they fit an existing board or need a new one.`;

        const { object: categorizationResult } = await generateObject({
            model: llmClient(MODEL_NAME),
            schema: categorizationSchema,
            system: 'You are a fashion stylist helping organize moodboards. You decide whether to add products to an existing mood board or create a new one based on style coherence.',
            prompt: `You have these existing mood boards:
${existingMoodboards.map(board => `- "${board.title}": ${board.description}`).join('\n')}

You need to categorize these new products: ${selectedProducts.map(p => p.name).join(', ')}

Should these products be added to an existing board or create a new board? If adding to existing, choose the most stylistically similar board. If creating new, suggest a creative title and description.`,
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