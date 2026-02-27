import { NextRequest, NextResponse } from "next/server";
import { jobManager } from "@/lib/job-manager";
import type { ScrapeRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ScrapeRequest = await request.json();

    if (!body.urls || body.urls.length === 0) {
      return NextResponse.json(
        { error: "Keine URLs angegeben" },
        { status: 400 }
      );
    }

    // URLs validieren (unterstützt /view/ID und /v/SLUG/ID)
    const validUrls = body.urls.filter((url) =>
      /docsend\.com\/(?:view|v\/[a-zA-Z0-9]+)\/[a-zA-Z0-9]+/.test(url)
    );

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "Keine gültigen DocSend-URLs gefunden" },
        { status: 400 }
      );
    }

    // Jobs erstellen
    const jobs = validUrls.map((url) => jobManager.createJob(url));

    // Jobs starten (async, non-blocking)
    for (const job of jobs) {
      jobManager.startJob(job.id, {
        email: body.email,
        passcode: body.passcode,
      });
    }

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        url: j.url,
        status: j.status,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Ungültige Anfrage" },
      { status: 400 }
    );
  }
}
