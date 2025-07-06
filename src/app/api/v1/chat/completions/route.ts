import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isStreaming = body.stream === true;

    // Updated to use llmClient API endpoint
    const llmClientApiUrl = `${process.env.LLM_CLIENT_ENDPOINT}/chat/completions`;
    console.log(`[llmclient-proxy] Forwarding request to: ${llmClientApiUrl}`);

    const response = await fetch(llmClientApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_CLIENT_API_KEY}`,
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        'X-Title': 'OpenAI Stylist',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("LLM Client API Error:", errorText);
        return new NextResponse(JSON.stringify({ error: `LLM Client API failed: ${errorText}` }), { status: response.status });
    }

    // Handle both streaming and non-streaming responses
    if (isStreaming) {
      if (!response.body) {
          return new NextResponse("The response body is empty for streaming.", { status: 500 });
      }

      // llmClient returns an OpenAI-compatible stream, forward it directly
      console.log('[llmclient-proxy] Passing stream through directly without transformation.');
      
      return new Response(response.body, {
          headers: { 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
      });
    } else {
      // If not streaming, return the raw JSON from llmClient
      const llmClientJson = await response.json();
      return NextResponse.json(llmClientJson);
    }

  } catch (error) {
    console.error('[llmclient-proxy] CRITICAL ERROR:', error);
    return new NextResponse(JSON.stringify({ error: 'An internal proxy error occurred' }), { status: 500 });
  }
} 