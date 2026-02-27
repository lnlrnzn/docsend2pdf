"use client";

import { JobCard } from "./job-card";
import type { ScrapeProgress } from "@/lib/types";

interface JobEntry {
  id: string;
  url: string;
  status: ScrapeProgress;
}

interface JobListProps {
  jobs: JobEntry[];
  onRetry?: (url: string) => void;
}

export function JobList({ jobs, onRetry }: JobListProps) {
  if (jobs.length === 0) return null;

  const done = jobs.filter((j) => j.status.status === "done").length;
  const errored = jobs.filter((j) => j.status.status === "error").length;
  const total = jobs.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">
          Jobs ({done + errored}/{total})
        </h2>
        {done > 0 && (
          <span className="text-xs text-success">{done} done</span>
        )}
      </div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            id={job.id}
            url={job.url}
            status={job.status.status}
            currentPage={job.status.currentPage}
            totalPages={job.status.totalPages}
            error={job.status.error}
            documentTitle={job.status.documentTitle}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  );
}
