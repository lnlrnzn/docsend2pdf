"use client";

import type { JobStatus } from "@/lib/types";

interface JobCardProps {
  id: string;
  url: string;
  status: JobStatus;
  currentPage: number;
  totalPages: number;
  error?: string;
  documentTitle?: string;
  hasPdf?: boolean;
  onRetry?: (url: string) => void;
  onDownload?: (jobId: string) => void;
}

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Queued",
  scraping: "Scraping",
  building_pdf: "Building PDF",
  done: "Done",
  error: "Error",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  queued: "text-muted",
  scraping: "text-accent",
  building_pdf: "text-warning",
  done: "text-success",
  error: "text-error",
};

export function JobCard({
  id,
  url,
  status,
  currentPage,
  totalPages,
  error,
  documentTitle,
  hasPdf,
  onRetry,
  onDownload,
}: JobCardProps) {
  const docId = url.match(/view\/([a-zA-Z0-9]+)/)?.[1] || url;
  const progress =
    totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="animate-fade-in-up rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {documentTitle || docId}
          </p>
          <p className="text-xs font-mono text-muted truncate mt-0.5">{url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium flex items-center gap-1 ${STATUS_COLORS[status]}`}>
            {status === "done" && (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {STATUS_LABELS[status]}
          </span>
          {status === "done" && hasPdf && onDownload && (
            <button
              onClick={() => onDownload(id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25 transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PDF
            </button>
          )}
        </div>
      </div>

      {status === "scraping" && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden animate-glow">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "building_pdf" && (
        <div className="mt-3">
          <div className="text-xs text-muted mb-1">Building PDF...</div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full w-[40%] rounded-full bg-warning animate-indeterminate" />
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-2 flex items-center gap-2">
          <p className="flex-1 text-xs text-error bg-error/10 rounded-md px-3 py-2">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(url)}
              className="shrink-0 text-xs text-accent hover:text-accent-dim transition-colors px-2.5 py-1.5 rounded-md border border-border hover:bg-card-hover"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
