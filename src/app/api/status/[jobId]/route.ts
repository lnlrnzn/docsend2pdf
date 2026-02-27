import { NextRequest } from "next/server";
import { jobManager } from "@/lib/job-manager";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    return new Response("Job nicht gefunden", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Aktuellen Status sofort senden
      const initial = JSON.stringify({
        jobId: job.id,
        status: job.status,
        currentPage: job.currentPage,
        totalPages: job.totalPages,
        error: job.error,
        documentTitle: job.documentTitle,
      });
      controller.enqueue(encoder.encode(`data: ${initial}\n\n`));

      // Wenn Job bereits fertig, Stream schliessen
      if (job.status === "done" || job.status === "error") {
        controller.close();
        return;
      }

      // Auf Updates lauschen
      const unsubscribe = jobManager.subscribe(jobId, (progress) => {
        try {
          const data = JSON.stringify(progress);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          if (progress.status === "done" || progress.status === "error") {
            controller.close();
            unsubscribe();
          }
        } catch {
          unsubscribe();
        }
      });
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
