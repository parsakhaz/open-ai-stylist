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

// ADDED: Helper to get approved model images from our local data
const MODEL_CONFIG_FILE = path.join(process.cwd(), 'data', 'model-images.json');
async function getApprovedModelUrl(): Promise<string | null> {
    try {
        const data = await fs.readFile(MODEL_CONFIG_FILE, 'utf-8');
        const config = JSON.parse(data);
        const approvedImages = config.images.filter((img: any) => img.status === 'approved');
        
        if (approvedImages.length === 0) {
            console.error('[api/generate-moodboard] No approved model images found!');
            return null;
        }
        
        // Select one randomly
        const randomIndex = Math.floor(Math.random() * approvedImages.length);
        console.log(`[api/generate-moodboard] Randomly selected model: ${approvedImages[randomIndex].url}`);
        return approvedImages[randomIndex].url;

    } catch (error) {
        console.error('[api/generate-moodboard] Could not read model images config.', error);
        return null;
    }
}

export async function POST(req: Request) {
  // LOGGING: Announce the start of the request.
  console.log('[api/generate-moodboard] Received a request.');

  try {
    const { selectedProducts, existingMoodboards }: { 
      selectedProducts: Product[], 
      existingMoodboards: MoodboardSummary[] 
    } = await req.json();

    // LOGGING: See exactly what the client sent.
    console.log('[api/generate-moodboard] Request body:', { 
      selectedProducts: selectedProducts.map(p => p.name), // Log names for brevity
      existingMoodboards 
    });

    // LOGGING: Using proxy for Llama API calls
    console.log(`[api/generate-moodboard] Using Llama proxy base at: ${appURL}/api/v1`);

    // --- START OF NEW LOGIC ---

    // Step 1: Get a random approved model image
    const modelImageUrl = await getApprovedModelUrl();
    if (!modelImageUrl) {
        throw new Error("No approved model images are available for virtual try-on.");
    }

    // Step 2: Generate try-on images for all selected products in parallel
    console.log('[api/generate-moodboard] Starting virtual try-on generation for all products...');
    const tryOnPromises = selectedProducts.map(product => 
        generateAndSaveTryOnImage(modelImageUrl, product.imageUrl).then(tryOnUrl => ({
            productId: product.id,
            url: tryOnUrl
        }))
    );
    
    // This will run all API calls concurrently, which is much faster.
    const tryOnResults = await Promise.all(tryOnPromises);

    // Step 3: Create the final URL map for the client
    const tryOnUrlMap: Record<string, string> = {};
    for (const result of tryOnResults) {
        tryOnUrlMap[result.productId] = result.url;
    }

    console.log('[api/generate-moodboard] Created final try-on URL map:', tryOnUrlMap);

    // --- END OF NEW LOGIC ---

    // Step 2: Ask Llama to categorize the selections using generateObject
    const productDescriptions = selectedProducts.map((p: Product) => p.name).join(', ');
    const boardSummaries = existingMoodboards.map((b: MoodboardSummary) => `"${b.title}": ${b.description}`).join('; ');
    const prompt = `A user has selected the following fashion items: "${productDescriptions}". Their existing mood boards are: ${boardSummaries || 'None'}. Analyze the items and decide if they fit an existing board or if a new one should be created.`;

    // LOGGING: See the exact prompt sent to the AI. This is vital for debugging AI behavior.
    console.log('[api/generate-moodboard] Prompt for categorization:', prompt);

    const { object: categorizationResult } = await generateObject({
      // MODIFICATION: Use the correct model name from Meta Llama API docs
      model: llama('Llama-4-Maverick-17B-128E-Instruct-FP8'),
      schema: categorizationSchema,
      system: `You are an AI mood board curator. Your task is to decide how to categorize a user's selected items.`,
      prompt,
    });

    // LOGGING: See what the AI decided.
    console.log('[api/generate-moodboard] Received categorization from AI:', categorizationResult);

    const responsePayload = {
      categorization: categorizationResult, // This is already a parsed object
      tryOnUrlMap
    };

    // LOGGING: See the final data being sent back to the client.
    console.log('[api/generate-moodboard] Sending response:', responsePayload);

    return new Response(JSON.stringify(responsePayload), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    // LOGGING: This is your most important log. It catches all errors in the process.
    console.error('[api/generate-moodboard] Mood board generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate mood board';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
} 