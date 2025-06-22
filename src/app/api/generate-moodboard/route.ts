import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject } from 'ai';
import { z } from 'zod';
// IMPORT THE CORRECT PRODUCT TYPE FROM OUR CENTRAL STORE
import { Product } from '@/app/store/useAppStore';

console.log('[api/generate-moodboard] Module loaded.');

export const maxDuration = 60; // Allow up to 60 seconds for this complex task

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

    // Step 1: MOCK Try-On image generation
    const tryOnUrlMap: Record<string, string> = {};
    for (const product of selectedProducts) {
      // For the POC, we just use the original product image as the "try-on"
      tryOnUrlMap[product.id] = product.imageUrl;
    }

    // LOGGING: Confirm try-on mapping was created.
    console.log('[api/generate-moodboard] Created try-on URL map:', tryOnUrlMap);

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
    return new Response(JSON.stringify({ error: 'Failed to generate mood board' }), { status: 500 });
  }
} 