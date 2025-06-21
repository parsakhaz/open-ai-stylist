import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'model-images.json');

export async function GET() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // If the file doesn't exist, return an empty array
    console.log('[api/get-model-images] Config file not found, returning empty array');
    return new Response(JSON.stringify({ images: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 