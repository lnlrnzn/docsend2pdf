import { NextRequest } from "next/server";
import { scrapeDocSend } from "@/lib/scraper";
import type { ScrapeRequest } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: ScrapeRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.urls || body.urls.length === 0) {
    return new Response(JSON.stringify({ error: "No URLs provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = body.urls[0];
  if (!/docsend\.com\/(?:view|v\/[a-zA-Z0-9]+)\/[a-zA-Z0-9]+/.test(url)) {
    return new Response(
      JSON.stringify({ error: "Invalid DocSend URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // stream closed
        }
      }

      try {
        send("progress", {
          status: "scraping",
          currentPage: 0,
          totalPages: 0,
        });

        const pdfBuffer = await scrapeDocSend(
          url,
          { email: body.email, passcode: body.passcode },
          (progress) => {
            send("progress", progress);
          }
        );

        // Send PDF as base64 in the stream
        const base64 = pdfBuffer.toString("base64");
        send("done", {
          status: "done",
          pdf: base64,
          filename: `docsend.pdf`,
        });
      } catch (err) {
        send("error", {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      Connection: "keep-alive",
    },
  });
}
