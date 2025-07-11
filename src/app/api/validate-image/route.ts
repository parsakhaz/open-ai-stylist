import { NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 30;

const vercelURL = process.env.VERCEL_URL;
const appURL = vercelURL ? `https://${vercelURL}` : 'http://localhost:3000';
const validationSchema = z.object({
  approved: z.boolean(),
  reason: z.string().describe('A 5-7 word explanation for the decision.'),
});

// Define paths for reuse
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'model-images.json');

// Ensure the upload directory exists
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('[api/validate-image] Failed to create uploads directory:', error);
  }
}

// Ensure the data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('[api/validate-image] Failed to create data directory:', error);
  }
}

async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    console.log('[api/validate-image] Config file not found, creating default structure');
    return { images: [] };
  }
}

async function writeConfig(data: any) {
  try {
    await ensureDataDir(); // Ensure directory exists before writing
    await fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[api/validate-image] Failed to write config file:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    await ensureUploadsDir();

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const chillMode = formData.get('chillMode') === 'true';
    
    if (!imageFile) {
      return NextResponse.json({ reason: 'No image file provided.' }, { status: 400 });
    }
    
    // 1. Save the image locally
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const filename = `${uuidv4()}${path.extname(imageFile.name) || '.png'}`;
    await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
    const publicImageUrl = `/uploads/${filename}`;

    // 2. Prepare the exact payload the Llama API needs for multimodal requests
    const dataUrl = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
    
    // Choose prompt based on chill mode
    const validationPrompt = chillMode
      ? `You are an AI judge. Analyze this image to see if it's suitable for a virtual fashion try-on. The image should contain exactly one person, fully visible from head to toe. That's it - just needs to be a single person full body shot. Your response MUST be a valid JSON object with this exact structure: {"approved": true/false, "reason": "5-7 word explanation"}. Do not include any other text, explanations, or formatting. Only return the JSON object.`
      : `You are an AI judge. Analyze this image to see if it's suitable for a virtual fashion try-on. The image MUST contain exactly one person, fully visible from head to toe. The person should be wearing simple, form-fitting clothing (e.g., t-shirt and leggings), not baggy clothes or multiple layers. Your response MUST be a valid JSON object with this exact structure: {"approved": true/false, "reason": "5-7 word explanation"}. Do not include any other text, explanations, or formatting. Only return the JSON object.`;
    
    const openRouterRequestPayload = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: validationPrompt,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      stream: false, // This is crucial for getting a single JSON response
    };

    // 3. Call OUR OWN PROXY with the OpenRouter-specific payload
    // FIX: Update the URL to the full, correct path of our proxy
    const proxyUrl = `${appURL}/api/v1/chat/completions`;
    console.log(`[validate-image] Calling internal proxy at: ${proxyUrl}`);
    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(openRouterRequestPayload),
    });

    if (!proxyResponse.ok) {
      const errorBody = await proxyResponse.json();
      throw new Error(`Proxy call failed: ${errorBody.error || 'Unknown proxy error'}`);
    }

    // 4. Parse the OpenAI-compatible response that our proxy now forwards
    const responseData = await proxyResponse.json();
    console.log('[validate-image] OpenAI-compatible response received via proxy:', JSON.stringify(responseData, null, 2));

    // --- FIX: The OpenRouter endpoint returns a standard OpenAI response structure. ---
    // We now need to look inside `choices[0].message.content` instead of `completion_message`.
    const aiResponseText = responseData.choices?.[0]?.message?.content;
    if (!aiResponseText) {
      throw new Error("AI response did not contain text content in the expected format (choices[0].message.content).");
    }
    
    let validationResult;
    try {
      const parsedContent = JSON.parse(aiResponseText);
      validationResult = validationSchema.parse(parsedContent);
    } catch (e) {
      console.error('[validate-image] Failed to parse or validate AI JSON response:', e, 'Raw AI text:', aiResponseText);
      throw new Error("AI returned a malformed JSON object.");
    }

    // 5. Update state and respond to the client
    const finalImageState = {
      id: Date.now() + Math.random(),
      url: publicImageUrl,
      status: validationResult.approved ? 'approved' : 'failed',
      reason: validationResult.reason,
    };

    const config = await readConfig();
    config.images.push(finalImageState);
    await writeConfig(config);

    return NextResponse.json({ finalImageState });

  } catch (error) {
    console.error('[validate-image] An error occurred:', error);
    const reason = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ reason }, { status: 500 });
  }
} 