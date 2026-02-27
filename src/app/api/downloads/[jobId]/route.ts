import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/job-manager";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = jobManager.getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 });
  }

  if (job.status === "error") {
    return NextResponse.json(
      { error: job.error || "Job fehlgeschlagen" },
      { status: 422 }
    );
  }

  if (job.status !== "done") {
    return NextResponse.json(
      { error: "PDF noch nicht fertig" },
      { status: 409 }
    );
  }

  const pdfBuffer = jobManager.getPdfBuffer(jobId);
  if (!pdfBuffer) {
    return NextResponse.json(
      { error: "PDF nicht mehr verfügbar (abgelaufen)" },
      { status: 410 }
    );
  }

  const filename = job.documentTitle
    ? `${job.documentTitle.replace(/[^a-zA-Z0-9_\-. ]/g, "_")}.pdf`
    : `docsend-${jobId.slice(0, 8)}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
