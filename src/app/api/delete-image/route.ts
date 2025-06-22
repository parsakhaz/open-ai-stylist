import { promises as fs } from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'model-images.json');

// Ensure the data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('[api/delete-image] Failed to create data directory:', error);
  }
}

// Helper function to read the config file
async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('[api/delete-image] Config file not found, returning empty structure');
    return { images: [] };
  }
}

// Helper function to write to the config file
async function writeConfig(data: any) {
  try {
    await ensureDataDir(); // Ensure directory exists before writing
    await fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[api/delete-image] Failed to write config file:', error);
    throw error;
  }
}

// We'll use the HTTP DELETE method, which is standard for deletion actions
export async function DELETE(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('[api/delete-image] Invalid image URL provided:', imageUrl);
      return new Response(JSON.stringify({ message: 'Invalid image URL provided.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[api/delete-image] Received request to delete image: ${imageUrl}`);

    // --- 1. Delete the physical file ---
    // The imageUrl is a public path like '/uploads/some-uuid.png'
    // We need to convert it to a full system path.
    const filename = path.basename(imageUrl);
    const localFilePath = path.join(UPLOADS_DIR, filename);
    
    try {
      await fs.unlink(localFilePath);
      console.log(`[api/delete-image] Successfully deleted file: ${localFilePath}`);
    } catch (error: any) {
      // If the file doesn't exist, that's okay, maybe it was already deleted.
      // We'll log it but continue on to remove it from the config.
      if (error.code === 'ENOENT') {
        console.warn(`[api/delete-image] File not found, but proceeding to remove from config: ${localFilePath}`);
      } else {
        console.error(`[api/delete-image] Error deleting file: ${error}`);
        throw error; // Re-throw other unexpected errors
      }
    }

    // --- 2. Remove the entry from the JSON config file ---
    const config = await readConfig();
    const initialCount = config.images.length;
    
    // Filter out the image with the matching URL
    config.images = config.images.filter((img: { url: string }) => img.url !== imageUrl);
    
    const finalCount = config.images.length;
    
    if (initialCount === finalCount) {
        console.warn(`[api/delete-image] Image URL not found in config file: ${imageUrl}`);
    } else {
        console.log(`[api/delete-image] Removed ${initialCount - finalCount} entries from config file`);
    }

    await writeConfig(config);
    console.log(`[api/delete-image] Successfully updated config file`);

    // --- 3. Send a success response ---
    return new Response(JSON.stringify({ 
      message: 'Image deleted successfully.',
      deletedUrl: imageUrl 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[api/delete-image] An error occurred:', error);
    return new Response(JSON.stringify({ 
      message: 'An internal server error occurred.' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 