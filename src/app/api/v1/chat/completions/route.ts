import { NextResponse } from 'next/server';

export const maxDuration = 60;

// This function transforms the Llama API's streaming chunk format
// to the OpenAI-compatible format that the Vercel AI SDK expects.
function transformLlamaStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk);

      // Process all complete "data: ..." lines in the buffer
      while (true) {
        const newlineIndex = buffer.indexOf('\n\n');
        if (newlineIndex === -1) break;

        const eventLine = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2);

        if (!eventLine.startsWith('data: ')) continue;

        try {
          const jsonData = JSON.parse(eventLine.substring(6));
          let transformedData;

          // Condition 1: Handle tool calls
          if (jsonData.completion_message?.stop_reason === 'tool_calls') {
            transformedData = {
              id: jsonData.id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: jsonData.model,
              choices: [{
                index: 0, delta: { role: 'assistant', content: null,
                  tool_calls: jsonData.completion_message.tool_calls.map((tc: any, index: number) => ({
                      index: index, id: tc.id, type: 'function',
                      function: { name: tc.function.name, arguments: tc.function.arguments }
                  }))
                }, finish_reason: 'tool_calls',
              }],
            };
          } 
          // Condition 2: Handle regular text content
          else if (jsonData.completion_message?.content?.text) {
            transformedData = {
              id: jsonData.id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: jsonData.model,
              choices: [{
                index: 0, delta: { content: jsonData.completion_message.content.text },
                finish_reason: jsonData.completion_message.stop_reason,
              }],
            };
          }

          // --- FIX ---
          // Only enqueue data if we actually transformed it.
          // This prevents sending empty message parts to the client.
          if (transformedData) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(transformedData)}\n\n`));
          }

        } catch (e) {
          console.error('Error parsing or transforming Llama chunk:', e, 'Chunk:', eventLine);
        }
      }
    },
  });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isStreaming = body.stream === true;

    const llamaApiUrl = `${process.env.LLAMA_API_BASE_URL}/chat/completions`;

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
      // If streaming, pipe through the transformer for the AI SDK
      const transformedStream = response.body.pipeThrough(transformLlamaStream());
      return new Response(transformedStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
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