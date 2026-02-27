"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ScrapeForm } from "@/components/scrape-form";
import { JobList } from "@/components/job-list";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ScrapeProgress } from "@/lib/types";

interface JobEntry {
  id: string;
  url: string;
  status: ScrapeProgress;
}

function Logo() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="2" width="20" height="28" rx="3" className="stroke-accent" strokeWidth="2" />
      <path d="M23 10L27 14L23 18" className="stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="23" y1="14" x2="29" y2="14" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="10" x2="18" y2="10" className="stroke-accent/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="14" x2="16" y2="14" className="stroke-accent/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="18" x2="17" y2="18" className="stroke-accent/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="22" x2="14" y2="22" className="stroke-accent/50" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HomeClient() {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());

  useEffect(() => {
    const sources = eventSourcesRef.current;
    return () => {
      sources.forEach((es) => es.close());
      sources.clear();
    };
  }, []);

  const updateJob = useCallback((jobId: string, progress: ScrapeProgress) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: progress } : j))
    );
  }, []);

  function subscribeToJob(jobId: string) {
    const eventSource = new EventSource(`/api/status/${jobId}`);
    eventSourcesRef.current.set(jobId, eventSource);

    eventSource.onmessage = (event) => {
      try {
        const progress: ScrapeProgress = JSON.parse(event.data);
        updateJob(jobId, progress);
        if (progress.status === "done" || progress.status === "error") {
          eventSource.close();
          eventSourcesRef.current.delete(jobId);
        }
      } catch {
        // ignore parse errors
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
      eventSourcesRef.current.delete(jobId);
    };
  }

  async function handleSubmit(data: {
    urls: string[];
    email?: string;
    passcode?: string;
  }) {
    setIsLoading(true);
    setError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Request failed");
      }

      const result = await res.json();

      const newJobs: JobEntry[] = result.jobs.map(
        (j: { id: string; url: string }) => ({
          id: j.id,
          url: j.url,
          status: {
            jobId: j.id,
            status: "queued" as const,
            currentPage: 0,
            totalPages: 0,
          },
        })
      );

      setJobs((prev) => [...newJobs, ...prev]);
      setSubmitSuccess(true);

      for (const job of newJobs) {
        subscribeToJob(job.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRetry(url: string) {
    handleSubmit({ urls: [url] });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <h1 className="text-xl font-semibold text-foreground">
                DocSend to PDF
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-sm text-muted mt-1">
            Convert DocSend documents to downloadable PDF files. Free, no signup required.
          </p>
        </header>

        <main>
          <section aria-label="Convert DocSend to PDF" className="mb-8">
            <ScrapeForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onSuccess={submitSuccess}
            />
          </section>

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error mb-8">
              {error}
            </div>
          )}

          <section aria-label="Conversion jobs">
            <JobList jobs={jobs} onRetry={handleRetry} />
          </section>
        </main>

        <footer className="mt-16 border-t border-border pt-8">
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-sm font-medium text-foreground mb-4">FAQ</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-foreground">What is DocSend to PDF?</dt>
                <dd className="text-muted mt-0.5">
                  DocSend to PDF is a free online tool that converts DocSend presentations and documents into downloadable PDF files. It works by loading each page in a headless browser, capturing the images, and assembling them into a single PDF.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">How do I convert a DocSend to PDF?</dt>
                <dd className="text-muted mt-0.5">
                  Paste the DocSend URL (e.g. https://docsend.com/view/abc123) into the input field above, optionally enter email and passcode if the document requires them, and click &ldquo;Convert to PDF&rdquo;. The PDF will be ready to download in seconds.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Is anything stored?</dt>
                <dd className="text-muted mt-0.5">
                  No. Documents are converted on-the-fly and the generated PDF is
                  deleted from the server after download. Nothing is saved permanently.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Are my credentials stored?</dt>
                <dd className="text-muted mt-0.5">
                  No. Email and passcode are only used for the current conversion
                  request and are never logged or persisted.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">When do I need credentials?</dt>
                <dd className="text-muted mt-0.5">
                  Only if the DocSend document requires an email address or
                  passcode to view. If you can open the link without logging in,
                  you can leave the fields empty.
                </dd>
              </div>
            </dl>
          </section>

          <div className="mt-8 pt-6 border-t border-border">
            <Link
              href="/mcp"
              className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-dim transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              MCP Server — use from Claude, Cursor, Copilot &amp; more
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
