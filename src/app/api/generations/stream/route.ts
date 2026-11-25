import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/drizzle/schema";


/**
 * SSE endpoint for realtime generation updates (Part 6). Broadcasts generation
 * events by polling the database — compatible with serverless and workers, and
 * generation continues even when the browser navigates away.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return new Response("missing workspaceId", { status: 400 });
  }

  const stream = new ReadableStream<string>({
    async start(controller) {
      let lastSent: string | null = null;
      const sendAll = async () => {
        try {
          const gens = await db
            .select()
            .from(generations)
            .where(eq(generations.workspaceId, workspaceId))
            .orderBy(asc(generations.createdAt));
          for (const g of gens) {
            const payload = JSON.stringify({
              id: g.id,
              kind: g.kind,
              status: g.status,
              resultUrl: g.resultUrl,
              error: g.error,
              updatedAt: g.updatedAt,
            });
            if (payload !== lastSent) {
              controller.enqueue(`data: ${payload}\n\n`);
              lastSent = payload;
            }
          }
        } catch {
          // poll failures are non-fatal; the client retries
        }
      };
      const interval = setInterval(sendAll, 3000);
      const close = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal?.addEventListener("abort", close);
      await sendAll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
