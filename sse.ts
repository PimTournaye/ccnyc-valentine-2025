// Handles Server-Sent Events (SSE) to notify connected clients of new iframe submissions.

const sseClients = new Set<ReadableStreamDefaultController>();

/**
 * Broadcasts a new iframe submission to all connected SSE clients.
 * @param message - The message string to send (typically JSON-encoded).
 */
export function broadcastNewSketch(message: string) {
  for (const controller of sseClients) {
    controller.enqueue(`data: ${message}\n\n`);
  }
}

/**
 * Handles incoming SSE connections.
 * @returns A Response object with SSE headers and a streaming body.
 */
export function handleSSE(): Response {
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      sseClients.add(controller);
    },
    cancel() {
      if (controllerRef) sseClients.delete(controllerRef);
    },
  });

  // SSE headers to keep the connection alive
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
