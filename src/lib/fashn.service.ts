import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = process.env.FASHN_API_KEY;
const BASE_URL = "https://api.fashn.ai/v1";
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!API_KEY) {
    console.error("FASHN_API_KEY environment variable is not set.");
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`
};

// Helper function to convert a public URL to a local file path
function urlToLocalPath(imageUrl: string): string {
    const filename = path.basename(imageUrl);
    return path.join(UPLOADS_DIR, filename);
}

// Helper to convert a local file path to a base64 string
async function localFileToBase64(filePath: string): Promise<string> {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const mimeType = 'image/jpeg'; // Assuming jpeg, adjust if needed
        return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
        console.error(`Error reading file for base64 conversion: ${filePath}`, error);
        throw new Error('Failed to convert local file to base64');
    }
}

async function pollForCompletion(predictionId: string): Promise<string> {
    while (true) {
        try {
            const statusResponse = await fetch(`${BASE_URL}/status/${predictionId}`, { headers });
            const statusData = await statusResponse.json();

            if (statusData.status === "completed") {
                console.log(`[FASHN Service] Prediction ${predictionId} completed.`);
                // The result is an array, we'll take the first image URL
                return statusData.output[0];
            } else if (["starting", "in_queue", "processing"].includes(statusData.status)) {
                console.log(`[FASHN Service] Prediction ${predictionId} status: ${statusData.status}. Polling again in 3s.`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.error(`[FASHN Service] Prediction ${predictionId} failed:`, statusData.error);
                throw new Error(statusData.error || 'Prediction failed with an unknown error.');
            }
        } catch (error) {
            console.error(`[FASHN Service] Error while polling for prediction ${predictionId}:`, error);
            throw error;
        }
    }
}

/**
 * Generates a virtual try-on image, downloads it, and saves it locally.
 * @param modelImageUrl - The public URL of the model image (e.g., /uploads/model.jpg).
 * @param garmentImageUrl - The public URL of the garment image (e.g., https://m.media-amazon.com/...).
 * @returns The public URL of the locally saved try-on image (e.g., /uploads/try-on-uuid.png).
 */
export async function generateAndSaveTryOnImage(modelImageUrl: string, garmentImageUrl: string): Promise<string> {
    console.log(`[FASHN Service] Starting try-on for model: ${modelImageUrl} and garment: ${garmentImageUrl}`);

    try {
        // Convert the local model image path to base64
        const modelLocalPath = urlToLocalPath(modelImageUrl);
        const modelImageBase64 = await localFileToBase64(modelLocalPath);

        const inputData = {
            model_image: modelImageBase64,
            garment_image: garmentImageUrl,
            category: "auto", // 'auto' is robust
            mode: "quality",   // Use 'quality' for final moodboards
            return_base64: false, // We want the CDN URL to download from
        };

        // 1. Start the prediction
        const runResponse = await fetch(`${BASE_URL}/run`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(inputData)
        });

        if (!runResponse.ok) {
            const errorText = await runResponse.text();
            throw new Error(`FASHN API /run failed: ${errorText}`);
        }

        const runData = await runResponse.json();
        const predictionId = runData.id;
        console.log(`[FASHN Service] Prediction started, ID: ${predictionId}`);

        // 2. Poll for the result URL
        const cdnImageUrl = await pollForCompletion(predictionId);
        
        // 3. Download the generated image from the CDN
        const imageResponse = await axios.get(cdnImageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        // 4. Save the image locally with a unique name
        const filename = `try-on-${uuidv4()}.png`;
        const localFilePath = path.join(UPLOADS_DIR, filename);
        await fs.writeFile(localFilePath, imageBuffer);
        
        const publicUrl = `/uploads/${filename}`;
        console.log(`[FASHN Service] Try-on image saved locally to: ${publicUrl}`);

        // 5. Return the public URL for our app to use
        return publicUrl;

    } catch (error) {
        console.error("[FASHN Service] Critical error during try-on generation:", error);
        // Fallback: If try-on fails, return the original garment image URL so the app doesn't break
        return garmentImageUrl;
    }
} 