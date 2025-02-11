import { broadcastNewSketch, handleSSE } from "./sse.ts";

const kv = await Deno.openKv();

/**
 * Handles the submission of a new iframe.
 *
 * Expects a POST request with a JSON body containing:
 *  - embed: string (the full iframe embed code)
 *  - creator?: string (optional; submitter's name or identifier)
 *
 * Saves the submission in Deno KV and broadcasts an SSE event.
 */
async function handleSubmit(_req: Request): Promise<Response> {
  try {
    const data = await _req.json();
    if (!data.embed || typeof data.embed !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'embed' field." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const submission = { id, embed: data.embed, creator: data.creator || null, timestamp: Date.now() };
    await kv.set(["iframe", id], submission);
    broadcastNewSketch(JSON.stringify(submission));

    return new Response(JSON.stringify(submission), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON or server error." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Retrieves all stored iframe submissions.
 * Returns a JSON array of submissions.
 */
async function handleList(_req: Request): Promise<Response> {
  const submissions = [];
  for await (const entry of kv.list({ prefix: ["iframe"] })) {
    if (entry.value) submissions.push(entry.value);
  }
  return new Response(JSON.stringify(submissions), { headers: { "Content-Type": "application/json" } });
}

/**
 * Serves the index.html file when people go to the root URL.
 */
async function serveIndex(): Promise<Response> {
  try {
    const file = await Deno.readFile("./index.html");
    return new Response(file, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

/**
 * Routes incoming requests to the appropriate handler.
 * -  POST /submit: handles new iframe submissions
 * - GET /sketchest: retrieves all stored iframe submissions
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === "/submit" && req.method === "POST") return await handleSubmit(req);
  if (url.pathname === "/sketches" && req.method === "GET") return await handleList(req);
  if (url.pathname === "/events" && req.method === "GET") return handleSSE();
  if (url.pathname === "/") return await serveIndex();
  return new Response("Not Found", { status: 404 });
}

Deno.serve(handler);
