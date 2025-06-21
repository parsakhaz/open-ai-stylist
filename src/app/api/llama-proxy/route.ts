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
        if (newlineIndex === -1) {
          // Not enough data for a full event, wait for more
          break;
        }

        const eventLine = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 2); // +2 for '\n\n'

        if (!eventLine.startsWith('data: ')) {
          continue; // Skip lines that are not data events
        }

        try {
          const jsonData = JSON.parse(eventLine.substring(6)); // Remove 'data: '

          // --- This is the core transformation logic ---
          let transformedData;
          if (jsonData.completion_message?.stop_reason === 'tool_calls') {
            // Transform tool call response
            transformedData = {
              id: jsonData.id,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: jsonData.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    role: 'assistant',
                    content: null,
                    tool_calls: jsonData.completion_message.tool_calls.map((tc: any, index: number) => ({
                        index: index,
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments,
                        }
                    }))
                  },
                  finish_reason: 'tool_calls',
                },
              ],
            };
          } else if (jsonData.completion_message?.content?.text) {
             // Transform regular text response
            transformedData = {
              id: jsonData.id,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: jsonData.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: jsonData.completion_message.content.text,
                  },
                  finish_reason: jsonData.completion_message.stop_reason,
                },
              ],
            };
          } else {
            // It might be an empty chunk or the end of the stream, just create a basic structure
             transformedData = {
                id: jsonData.id,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: jsonData.model,
                choices: [{ index: 0, delta: {}, finish_reason: jsonData.completion_message?.stop_reason }],
            };
          }
          // --- End of transformation logic ---

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(transformedData)}\n\n`));
        } catch (e) {
          console.error('Error parsing or transforming Llama chunk:', e);
          console.error('Problematic chunk:', eventLine);
        }
      }
    },
    flush(controller) {
      // If there's any leftover data in the buffer, it's likely an error or incomplete.
      // You might want to handle it here if necessary.
      console.log('[llama-proxy] Stream flushed.');
    }
  });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    // The Vercel AI SDK now adds `stream: true` to the body automatically
    // so we can just forward the body as-is.
    const llamaRequestPayload = {
        ...body,
        stream: true, // Ensure streaming is enabled
    };

    const llamaApiUrl = `${process.env.LLAMA_API_BASE_URL}/chat/completions`;

    const response = await fetch(llamaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`,
      },
      body: JSON.stringify(llamaRequestPayload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Llama API Error:", errorText);
        return new NextResponse(JSON.stringify({ error: `Llama API failed: ${errorText}` }), { status: response.status });
    }

    if (!response.body) {
        return new NextResponse("The response body is empty.", { status: 500 });
    }

    // Pipe the Llama API's response through our transformer
    const transformedStream = response.body.pipeThrough(transformLlamaStream());
    
    // Return the transformed stream to the Vercel AI SDK
    return new Response(transformedStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        }
    });

  } catch (error) {
    console.error('[llama-proxy] CRITICAL ERROR:', error);
    return new NextResponse(JSON.stringify({ error: 'An internal proxy error occurred' }), { status: 500 });
  }
} 