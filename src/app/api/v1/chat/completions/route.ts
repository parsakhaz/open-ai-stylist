import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isStreaming = body.stream === true;

    // --- FINAL FIX: Intelligently construct the correct API URL ---
    // This robustly handles if LLAMA_API_BASE_URL is `https://api.llama.com` or `https://api.llama.com/v1`
    const baseUrl = new URL(process.env.LLAMA_API_BASE_URL!);
    // We construct the final URL by setting the pathname directly, which avoids duplicate segments.
    const llamaApiUrl = new URL('/compat/v1/chat/completions', baseUrl).toString();
    
    console.log(`[llama-proxy] Forwarding request to: ${llamaApiUrl}`);

    const response = await fetch(llamaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Llama API Error:", errorText);
        return new NextResponse(JSON.stringify({ error: `Llama API failed: ${errorText}` }), { status: response.status });
    }

    // --- LOGIC TO HANDLE BOTH STREAMING AND NON-STREAMING ---
    if (isStreaming) {
      if (!response.body) {
          return new NextResponse("The response body is empty for streaming.", { status: 500 });
      }

      // --- FIX: Pass the stream directly through ---
      // The Llama /compat/v1 endpoint already returns an OpenAI-compatible stream.
      // We don't need to transform it; we can just forward it.
      // This eliminates the risk of incorrect transformations.
      console.log('[llama-proxy] Passing stream through directly without transformation.');
      
      return new Response(response.body, {
          headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
      });
    } else {
      // If not streaming, just return the raw JSON from Llama.
      // The `validate-image` route will handle this specific format.
      const llamaJson = await response.json();
      return NextResponse.json(llamaJson);
    }

  } catch (error) {
    console.error('[llama-proxy] CRITICAL ERROR:', error);
    return new NextResponse(JSON.stringify({ error: 'An internal proxy error occurred' }), { status: 500 });
  }
} 